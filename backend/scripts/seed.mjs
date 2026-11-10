import { existsSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
if (existsSync('.env')) process.loadEnvFile('.env');
const base = process.env.GATEWAY_URL ?? 'http://127.0.0.1:3000';
function crc(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value ^= byte;
    for (let i = 0; i < 8; i++) value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
  }
  return (value ^ 0xffffffff) >>> 0;
}
function chunk(type, body) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc(Buffer.concat([name, body])));
  return Buffer.concat([length, name, body, checksum]);
}
function cover(rgb) {
  const width = 960,
    height = 540,
    rows = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const circle = Math.hypot(x - width * 0.7, y - height * 0.38) < height * 0.41;
      const stripe = Math.abs(x - y * 0.8 - width * 0.12) < 50;
      const strength = circle ? 0.6 : stripe ? 0.9 : 0.15 + 0.3 * (x / width);
      const offset = y * (width * 3 + 1) + 1 + x * 3;
      for (let c = 0; c < 3; c++)
        rows[offset + c] = Math.round(rgb[c] * strength + 245 * (1 - strength));
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return (
    'data:image/png;base64,' +
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', header),
      chunk('IDAT', deflateSync(rows)),
      chunk('IEND', Buffer.alloc(0)),
    ]).toString('base64')
  );
}
const stores = [
  {
    slug: 'demo-eletronicos',
    name: 'Nexo Eletrônicos',
    description: 'Tecnologia que conecta ideias ao seu dia a dia. Loja fictícia de demonstração.',
    category: 'eletronicos',
    options: [],
    color: [37, 99, 235],
  },
  {
    slug: 'demo-construcao',
    name: 'Base & Obra',
    description:
      'Do primeiro esboço ao último detalhe. Materiais para suas próximas ideias. Loja fictícia de demonstração.',
    category: 'construcao',
    options: ['coupons', 'delivery'],
    color: [180, 83, 9],
  },
  {
    slug: 'demo-roupas',
    name: 'Aurora Studio',
    description:
      'Peças para viver novas histórias, com leveza e identidade. Loja fictícia de demonstração.',
    category: 'roupas',
    options: ['reviews', 'aiAssistant'],
    color: [163, 50, 101],
  },
];
for (const store of stores) {
  const existing = await fetch(base + '/api/stores/' + store.slug);
  if (existing.ok) {
    console.log('Já existe, preservada: ' + store.slug);
    continue;
  }
  if (existing.status !== 404) throw new Error('Não foi possível consultar o gateway.');
  const generated = await fetch(base + '/api/generate-products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: store.name, category: store.category }),
  });
  if (!generated.ok) throw new Error('Não foi possível gerar os produtos de demonstração.');
  const { products } = await generated.json();
  const response = await fetch(base + '/api/stores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...store,
      cover: cover(store.color),
      password: 'gerar-demo123',
      products,
    }),
  });
  if (!response.ok)
    throw new Error('Falha ao cadastrar ' + store.slug + ': ' + (await response.text()));
  console.log('Loja fictícia criada: /loja/' + store.slug);
}
console.log('Demonstração pronta. Senha das lojas criadas por este script: gerar-demo123');
