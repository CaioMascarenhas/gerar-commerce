import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

// Configuração sem credenciais no código. Variáveis do terminal têm precedência.
const fromFile = existsSync('.env')
  ? Object.fromEntries(
      readFileSync('.env', 'utf8')
        .split(/\r?\n/)
        .filter((line) => /^[A-Z_]+=/.test(line))
        .map((line) => {
          const index = line.indexOf('=');
          return [
            line.slice(0, index),
            line
              .slice(index + 1)
              .trim()
              .replace(/^['"]|['"]$/g, ''),
          ];
        }),
    )
  : {};
const env = { ...fromFile, ...process.env };
const base = Number(env.PORT_BASE ?? 3000);
const ports = {
  gateway: base,
  catalog: base + 1,
  inventory: base + 2,
  orders: base + 3,
  'ai-assistant': base + 5,
  stores: base + 6,
};
for (const [key, port] of Object.entries({
  CATALOG_URL: ports.catalog,
  INVENTORY_URL: ports.inventory,
  ORDERS_URL: ports.orders,
  AI_ASSISTANT_URL: ports['ai-assistant'],
  STORES_URL: ports.stores,
}))
  env[key] ??= 'http://127.0.0.1:' + port;
const apps = ['catalog', 'inventory', 'orders', 'stores', 'gateway', 'ai-assistant'];
// O Nest precisa dos decorators/metadados emitidos pelo TypeScript.
// Executar o build evita diferenças entre transpilers no Windows e no CI.
const children = apps.map((app) =>
  spawn(process.execPath, [`services/${app}/dist/main.js`], {
    stdio: 'inherit',
    env: { ...env, PORT: String(ports[app]) },
  }),
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
for (const child of children) {
  child.on('error', (error) => {
    console.error(error);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) stop(code ?? 1);
  });
}
console.log(
  'Plataforma Gerar Commerce · lojas dinâmicas · gateway em http://127.0.0.1:' + base + '/docs',
);
