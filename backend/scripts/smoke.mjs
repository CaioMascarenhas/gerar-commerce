import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
if (existsSync('.env')) process.loadEnvFile('.env');
const apps = [
  'catalog',
  'inventory',
  'orders',
  'recommendations',
  'ai-assistant',
  'stores',
  'gateway',
];
const base = Number(process.env.SMOKE_PORT_BASE ?? 3100);
const ports = {
  gateway: base,
  catalog: base + 1,
  inventory: base + 2,
  orders: base + 3,
  recommendations: base + 4,
  'ai-assistant': base + 5,
  stores: base + 6,
};
const databaseUrl =
  process.env.DATABASE_URL ?? 'postgres://gerar:gerar_local@127.0.0.1:5433/gerar_commerce';
const databaseName = 'gerar_smoke_' + Date.now();
const testUrl = new URL(databaseUrl);
testUrl.pathname = '/' + databaseName;
const control = new Pool({ connectionString: databaseUrl });
let children = [];
let created = false;
let checks = 0;
const logs = [];
function check(value, message) {
  assert(value, message);
  checks++;
}
async function stop() {
  await Promise.all(
    children.map(
      (child) =>
        new Promise((resolve) => {
          if (child.exitCode !== null || child.signalCode !== null) return resolve();
          child.once('exit', resolve);
          child.kill();
        }),
    ),
  );
  children = [];
}
function start() {
  for (const app of apps) {
    const child = spawn(process.execPath, ['services/' + app + '/dist/main.js'], {
      env: {
        ...process.env,
        DATABASE_URL: testUrl.href,
        HOST: '127.0.0.1',
        PORT: String(ports[app]),
        INTERNAL_API_KEY: 'smoke-internal',
        GOOGLE_API_KEY: '',
        GEMINI_MODEL: '',
        COOKIE_SECURE: 'false',
        CATALOG_URL: 'http://127.0.0.1:' + ports.catalog,
        INVENTORY_URL: 'http://127.0.0.1:' + ports.inventory,
        ORDERS_URL: 'http://127.0.0.1:' + ports.orders,
        RECOMMENDATIONS_URL: 'http://127.0.0.1:' + ports.recommendations,
        AI_ASSISTANT_URL: 'http://127.0.0.1:' + ports['ai-assistant'],
        STORES_URL: 'http://127.0.0.1:' + ports.stores,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', (chunk) => logs.push(chunk.toString()));
    child.stderr.on('data', (chunk) => logs.push(chunk.toString()));
    children.push(child);
  }
}
async function request(path, method = 'GET', body, cookie) {
  const response = await fetch('http://127.0.0.1:' + ports.gateway + '/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(25000),
  });
  const data = await response.json();
  return {
    status: response.status,
    data,
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  };
}
async function ok(path, method = 'GET', body, cookie) {
  const result = await request(path, method, body, cookie);
  assert(result.status < 300, JSON.stringify({ path, ...result }));
  return result.data;
}
async function ready() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const result = await ok('/services');
      if (result.length === 6 && result.every((s) => s.status === 'ok')) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error('Serviços não ficaram prontos. ' + logs.slice(-12).join('\n'));
}
const cover =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4X0AAAAASUVORK5CYII=';
const draft = (slug, category, options) => ({
  slug,
  name: 'Loja ' + slug,
  description: 'Loja de teste com dados fictícios.',
  cover,
  category,
  options,
  password: 'senha-teste',
  products: [
    {
      name: 'Produto principal',
      description: 'Produto fictício.',
      priceInCents: 10000,
      stock: 5,
      image: '',
    },
    {
      name: 'Produto complementar',
      description: 'Outro produto fictício.',
      priceInCents: 5000,
      stock: 2,
      image: '',
    },
  ],
});
try {
  for (const port of Object.values(ports)) {
    let response;
    try {
      response = await fetch('http://127.0.0.1:' + port + '/api/health', {
        signal: AbortSignal.timeout(250),
      });
    } catch {}
    if (response) throw new Error('Porta ' + port + ' ocupada. Pare o backend antes do smoke.');
  }
  await control.query('CREATE DATABASE ' + databaseName);
  created = true;
  start();
  await ready();
  const essential = draft('smoke-tech', 'eletronicos', []),
    complete = draft('smoke-obra', 'construcao', ['coupons', 'reviews', 'delivery']),
    intelligent = draft('smoke-moda', 'roupas', ['aiAssistant']);
  check(
    (await request('/stores', 'POST', { ...essential, products: [] })).status === 400,
    'Cadastro precisa de produto.',
  );
  const shops = [];
  for (const input of [essential, complete, intelligent])
    shops.push(await ok('/stores', 'POST', input));
  check(
    shops.map((s) => s.blueprint.plan.monthlyInCents).join(',') === '5990,7990,9990',
    'Preços dos planos.',
  );
  check(
    new Set(shops.map((s) => s.blueprint.theme.accent)).size === 3,
    'Três categorias com cores distintas.',
  );
  check((await request('/stores', 'POST', essential)).status === 409, 'Endereço único.');
  check(
    (
      await request('/stores', 'POST', {
        ...essential,
        slug: 'smoke-invalid',
        options: ['catalog'],
      })
    ).status === 400,
    'Core não é opcional.',
  );
  const list = await ok('/stores');
  check(
    list.length === 3 && !JSON.stringify(list).includes('password'),
    'Lojas públicas não expõem senhas.',
  );
  check(
    (await request('/internal/stores', 'POST', essential)).status === 403,
    'Rotas internas bloqueadas.',
  );
  check((await request('/stores/smoke-tech/orders')).status === 401, 'Admin exige login.');
  check(
    (await request('/stores/smoke-tech/login', 'POST', { password: 'incorreta' })).status === 401,
    'Senha errada rejeitada.',
  );
  const login = await request('/stores/smoke-tech/login', 'POST', { password: 'senha-teste' });
  check(login.status === 201 && login.cookie, 'Login cria sessão.');
  const cookie = login.cookie;
  check(
    (await request('/stores/smoke-obra/orders', 'GET', undefined, cookie)).status === 401,
    'Sessão de outra loja é rejeitada.',
  );
  const products = await ok('/stores/smoke-tech/products'),
    otherProducts = await ok('/stores/smoke-obra/products');
  const product = products.find((p) => p.name === 'Produto principal');
  const purchase = {
    reference: randomUUID(),
    customerId: 'cliente-smoke',
    items: [{ productId: product.id, quantity: 1 }],
    payment: 'approved',
    fulfillment: 'pickup',
    coupon: '',
    totalInCents: 1,
  };
  const paid = await ok('/stores/smoke-tech/checkout', 'POST', purchase);
  check(paid.totalInCents === 10000 && paid.status === 'paid', 'Preço oficial no checkout.');
  const repeated = await ok('/stores/smoke-tech/checkout', 'POST', purchase);
  check(repeated.id === paid.id, 'Repetição não duplica pedido.');
  const simulation = new Pool({ connectionString: testUrl.href });
  try {
    await simulation.query('DELETE FROM orders.purchases WHERE store_slug=$1 AND reference=$2', [
      'smoke-tech',
      purchase.reference,
    ]);
    const recovered = await ok('/stores/smoke-tech/checkout', 'POST', purchase);
    check(
      recovered.id === paid.id && recovered.totalInCents === paid.totalInCents,
      'Recupera tentativa após perda de confirmação sem duplicar baixa.',
    );
  } finally {
    await simulation.end();
  }
  check(
    (await ok('/stores/smoke-tech/stock')).find((s) => s.productId === product.id).available === 4,
    'Estoque baixado uma única vez.',
  );
  check(
    (
      await request('/stores/smoke-tech/checkout', 'POST', {
        ...purchase,
        reference: randomUUID(),
        items: [{ productId: otherProducts[0].id, quantity: 1 }],
      })
    ).status === 400,
    'Produto de outra loja rejeitado.',
  );
  const declined = await ok('/stores/smoke-tech/checkout', 'POST', {
    ...purchase,
    reference: randomUUID(),
    payment: 'declined',
  });
  check(declined.status === 'declined', 'Recusa simulada.');
  check(
    (await ok('/stores/smoke-tech/stock')).find((s) => s.productId === product.id).available === 4,
    'Recusa libera estoque.',
  );
  check(
    (
      await request('/stores/smoke-tech/checkout', 'POST', {
        ...purchase,
        reference: randomUUID(),
        coupon: 'BOASVINDAS10',
      })
    ).status === 400,
    'Cupom bloqueado sem feature.',
  );
  const completeProduct = otherProducts.find((p) => p.name === 'Produto principal');
  const discounted = await ok('/stores/smoke-obra/checkout', 'POST', {
    ...purchase,
    reference: randomUUID(),
    items: [{ productId: completeProduct.id, quantity: 1 }],
    coupon: 'BOASVINDAS10',
    fulfillment: 'delivery',
  });
  check(discounted.totalInCents === 10500, 'Desconto e entrega pela composição.');
  check(
    (await request('/stores/smoke-tech/reviews/' + product.id)).status === 403,
    'Avaliações bloqueadas sem feature.',
  );
  await ok('/stores/smoke-obra/reviews/' + completeProduct.id, 'POST', {
    author: 'Cliente',
    rating: 5,
    comment: 'Ótimo produto de demonstração.',
  });
  check(
    (await ok('/stores/smoke-obra/reviews/' + completeProduct.id)).length === 1,
    'Avaliação persistida.',
  );
  const recommendations = await ok('/stores/smoke-tech/recommendations/cliente-smoke');
  check(
    recommendations.products.every((p) => p.id !== product.id),
    'Recomendação exclui produtos comprados.',
  );
  const updated = await ok(
    '/stores/smoke-tech/settings',
    'PUT',
    { ...essential, name: 'Tech atualizada', options: ['aiAssistant', 'reviews'] },
    cookie,
  );
  check(updated.blueprint.plan.monthlyInCents === 9990, 'Settings recompõe plano.');
  check(
    (
      await request(
        '/stores/smoke-tech/assistant',
        'POST',
        { message: 'Qual é o estoque?' },
        cookie,
      )
    ).status === 503,
    'IA sem chave tem erro explícito.',
  );
  for (const category of ['eletronicos', 'construcao', 'roupas']) {
    const generated = await ok('/generate-products', 'POST', { category, name: 'Loja de teste' });
    check(
      generated.products.length === 3 && generated.source === 'examples',
      'Três exemplos identificados sem Gemini.',
    );
  }
  await ok('/stores/smoke-tech/products/' + product.id, 'PUT', { ...product, stock: 1 }, cookie);
  const concurrent = await Promise.all(
    [1, 2].map(() =>
      request('/stores/smoke-tech/checkout', 'POST', { ...purchase, reference: randomUUID() }),
    ),
  );
  check(
    concurrent.filter((r) => r.status < 300).length === 1 &&
      concurrent.some((r) => r.status === 409),
    'Concorrência não gera saldo negativo.',
  );
  await stop();
  start();
  await ready();
  check(
    (await ok('/stores/smoke-tech')).name === 'Tech atualizada',
    'Loja persiste após reiniciar.',
  );
  check(
    (await ok('/stores/smoke-tech/orders', 'GET', undefined, cookie)).length === 3,
    'Pedidos e sessão persistem após reiniciar.',
  );
  check(
    (await ok('/stores/smoke-tech/stock')).find((s) => s.productId === product.id).available === 0,
    'Saldo persiste após reiniciar.',
  );
  const added = await ok(
    '/stores/smoke-tech/products',
    'POST',
    { name: 'Produto novo', description: 'Novo item.', priceInCents: 990, stock: 3, image: '' },
    cookie,
  );
  await ok('/stores/smoke-tech/products/' + added.id, 'DELETE', undefined, cookie);
  check((await ok('/stores/smoke-tech/products')).length === 2, 'CRUD de produto.');
  await ok('/stores/smoke-tech/products/' + product.id, 'DELETE', undefined, cookie);
  const remaining = (await ok('/stores/smoke-tech/products'))[0];
  check(
    (await request('/stores/smoke-tech/products/' + remaining.id, 'DELETE', undefined, cookie))
      .status === 400,
    'Último produto não pode ser removido.',
  );
  await ok('/stores/smoke-tech/logout', 'POST', {}, cookie);
  check(
    (await request('/stores/smoke-tech/orders', 'GET', undefined, cookie)).status === 401,
    'Logout revoga sessão.',
  );
  console.log(
    'Smoke OK: ' +
      checks +
      ' verificações; três lojas, PostgreSQL, persistência, isolamento, login, CRUD, compra, concorrência, opcionais e IA sem chave.',
  );
} catch (error) {
  console.error(
    logs
      .filter((line) => /error|exception|failed/i.test(line))
      .slice(-8)
      .join('\n'),
  );
  throw error;
} finally {
  await stop();
  if (created) await control.query('DROP DATABASE ' + databaseName + ' WITH (FORCE)');
  await control.end();
}
