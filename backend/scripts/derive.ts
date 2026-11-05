import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
if (existsSync('.env')) process.loadEnvFile('.env');
const slug = process.argv[2];
if (!slug || !/^[a-z][a-z0-9-]{1,49}$/.test(slug))
  throw new Error('Informe o endereço de uma loja cadastrada: npm run derive -- minha-loja');
const response = await fetch(
  (process.env['GATEWAY_URL'] ?? 'http://127.0.0.1:3000') + '/api/stores/' + slug,
);
if (!response.ok)
  throw new Error('Não foi possível consultar a loja. Confira o endereço e o gateway em execução.');
const store: any = await response.json();
const directory = resolve('output', 'products', slug);
await mkdir(directory, { recursive: true });
await writeFile(
  resolve(directory, 'blueprint.json'),
  JSON.stringify(store.blueprint, null, 2) + '\n',
);
await writeFile(resolve(directory, 'store.json'), JSON.stringify(store, null, 2) + '\n');
await writeFile(
  resolve(directory, 'README.md'),
  '# ' +
    store.name +
    '\n\nSnapshot de uma loja criada dinamicamente. A configuração operacional está persistida no PostgreSQL.\n\nVitrine: /loja/' +
    slug +
    '\n\nAdministração: /admin/' +
    slug +
    '\n\nNenhuma senha ou sessão está incluída nesta exportação.\n',
);
console.log('Snapshot da composição exportado para ' + directory);
