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
const profile = env.PRODUCT_PROFILE ?? 'essencial';
if (!['essencial', 'assistida'].includes(profile))
  throw new Error('PRODUCT_PROFILE deve ser essencial ou assistida.');
const apps = ['catalog', 'inventory', 'orders', 'recommendations', 'gateway'];
if (profile === 'assistida') apps.push('ai-assistant');
// O Nest precisa dos decorators/metadados emitidos pelo TypeScript.
// Executar o build evita diferenças entre transpilers no Windows e no CI.
const children = apps.map((app) =>
  spawn(process.execPath, [`apps/${app}/dist/main.js`], { stdio: 'inherit', env }),
);
children.push(
  spawn(
    process.execPath,
    ['node_modules/@angular/cli/bin/ng.js', 'serve', 'storefront', '--host', '127.0.0.1'],
    { stdio: 'inherit', env },
  ),
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
console.log(`Gerar Commerce · perfil ${profile} · http://127.0.0.1:4200`);
