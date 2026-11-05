import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const apps = ['catalog', 'inventory', 'orders', 'recommendations', 'gateway'];
let children = [];
const ports = {
  catalog: 3001,
  inventory: 3002,
  orders: 3003,
  recommendations: 3004,
  gateway: 3000,
};
async function request(path, options) {
  return fetch('http://127.0.0.1:3000/api' + path, {
    ...options,
    signal: AbortSignal.timeout(5000),
  });
}
async function stopChildren() {
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
function start(profile, names) {
  for (const app of names)
    children.push(
      spawn(process.execPath, [`services/${app}/dist/main.js`], {
        env: {
          ...process.env,
          PRODUCT_PROFILE: profile,
          HOST: '127.0.0.1',
          PORT: String(ports[app] ?? 3005),
          CATALOG_URL: 'http://127.0.0.1:3001',
          INVENTORY_URL: 'http://127.0.0.1:3002',
          ORDERS_URL: 'http://127.0.0.1:3003',
          RECOMMENDATIONS_URL: 'http://127.0.0.1:3004',
          AI_ASSISTANT_URL: 'http://127.0.0.1:3005',
          DEMO_ADMIN_TOKEN: 'gerar-demo',
          GOOGLE_API_KEY: '',
          GEMINI_MODEL: '',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    );
  for (const child of children) {
    child.stderr.on('data', (data) => process.stderr.write(data));
    child.on('error', (error) => console.error(error));
  }
}
async function waitForServices(count) {
  for (let attempt = 0; ; attempt++) {
    try {
      const health = await (await request('/services')).json();
      assert.equal(health.length, count);
      assert(health.every((service) => service.status === 'ok'));
      return;
    } catch (error) {
      if (attempt >= 35) throw error;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
}
try {
  // Falha em vez de testar processos de outra sessão por engano.
  for (const port of [...Object.values(ports), 3005]) {
    try {
      await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(250) });
      throw new Error(`Porta ${port} já está ocupada. Encerre npm run dev antes do smoke.`);
    } catch (error) {
      if (error.message.includes('já está ocupada')) throw error;
    }
  }
  start('essencial', apps);
  await waitForServices(4);
  const configuration = await (await request('/configuration')).json();
  assert.equal(configuration.configuration.id, 'essencial');
  assert(!configuration.configuration.features.includes('aiAssistant'));
  const products = await (await request('/products')).json();
  assert.equal(products.length, 4);
  const stock = await (await request('/stock')).json();
  assert(stock.every((item) => Number.isInteger(item.available) && item.available >= 0));
  const recommendations = await (await request('/recommendations/cliente-demo')).json();
  assert.equal(recommendations.source, 'demo-history');
  assert.equal(recommendations.strategy, 'history-category');
  assert.equal(recommendations.products[0].id, 'lapis');
  assert(recommendations.products.every((product) => product.id !== 'caderno'));
  const unknown = await (await request('/recommendations/cliente-novo')).json();
  assert.equal(unknown.strategy, 'catalog-fallback');
  assert.equal((await request('/derivations/invalido')).status, 400);
  const assisted = await (await request('/derivations/assistida')).json();
  assert(assisted.configuration.features.includes('aiAssistant'));
  assert.equal(assisted.shippingInCents, 1500);
  const blocked = await request('/assistant/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'estoque' }),
  });
  assert.equal(blocked.status, 404);
  assert.equal((await fetch('http://127.0.0.1:3000/docs-json')).status, 200);
  await stopChildren();
  start('assistida', [...apps, 'ai-assistant']);
  await waitForServices(5);
  const withoutAdmin = await request('/assistant/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'estoque' }),
  });
  assert.equal(withoutAdmin.status, 403);
  const withoutKey = await request('/assistant/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-demo-admin': 'gerar-demo' },
    body: JSON.stringify({ message: 'estoque' }),
  });
  assert.equal(withoutKey.status, 503);
  assert.equal((await request('/products')).status, 200);
  console.log(
    'Smoke OK: dois perfis, seis serviços, catálogo, histórico, composição e guardas da IA, sem chamadas ao Gemini.',
  );
} finally {
  await stopChildren();
}
