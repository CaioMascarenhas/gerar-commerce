import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const live = args.includes('--ai');
const browserArgs = args.filter((arg) => arg !== '--ai' && arg !== '--');
const project = 'gerar-commerce-e2e-' + Date.now();
assert(/^gerar-commerce-e2e-\d+$/.test(project));
const artifacts = resolve(root, 'frontend/.e2e-artifacts', project);
assert(artifacts.startsWith(resolve(root, 'frontend/.e2e-artifacts')));
mkdirSync(artifacts, { recursive: true });
if (live && existsSync(resolve(root, 'backend/.env')))
  process.loadEnvFile(resolve(root, 'backend/.env'));
if (live && (!process.env.GOOGLE_API_KEY || !process.env.GEMINI_MODEL))
  throw new Error('Configure GOOGLE_API_KEY e GEMINI_MODEL em backend/.env para usar --ai.');
const env = {
  ...process.env,
  E2E_PROJECT_NAME: project,
  E2E_ARTIFACT_DIR: artifacts,
  E2E_REAL_AI: live ? '1' : '0',
  E2E_GOOGLE_API_KEY: live ? process.env.GOOGLE_API_KEY : '',
  E2E_GEMINI_MODEL: live ? process.env.GEMINI_MODEL : '',
  INTERNAL_API_KEY: 'gerar-e2e-internal',
  COOKIE_SECURE: 'false',
  COMPOSE_PROFILES: '',
};
const compose = ['compose', '-p', project, '-f', 'compose.yaml', '-f', 'compose.e2e.yaml'];
async function command(tool, argv, capture = false) {
  return new Promise((resolveCommand, reject) => {
    const child = spawn(tool, argv, {
      cwd: root,
      env,
      windowsHide: true,
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });
    let output = '',
      error = '';
    if (capture) {
      child.stdout.on('data', (chunk) => (output += chunk));
      child.stderr.on('data', (chunk) => (error += chunk));
    }
    child.on('error', reject);
    child.on('exit', (code) => resolveCommand({ code: code ?? 1, output, error }));
  });
}
async function docker(argv, capture = false) {
  const result = await command('docker', [...compose, ...argv], capture);
  if (result.code !== 0)
    throw new Error('Docker falhou: ' + argv[0] + (capture ? '\n' + result.error : ''));
  return result.output;
}
let started = false;
try {
  const config = JSON.parse(await docker(['config', '--format', 'json'], true));
  assert.equal(config.name, project);
  assert.equal(config.volumes['commerce-data'].name, project + '_commerce-data');
  for (const name of ['postgres', 'gateway', 'storefront'])
    assert(!config.services[name].ports?.length, 'Testes não devem publicar portas: ' + name);
  for (const name of Object.keys(config.services).filter((name) => name !== 'ai-assistant'))
    assert(
      !config.services[name].environment?.GOOGLE_API_KEY,
      'Chave da IA fora do serviço autorizado.',
    );
  console.log(
    'E2E isolado: ' +
      project +
      '. Gemini real: ' +
      (live ? 'ativado para dados fictícios' : 'desativado'),
  );
  started = true;
  await docker(['build', 'gateway', 'storefront', 'e2e']);
  await docker(['up', '-d', '--wait', '--wait-timeout', '180']);
  await docker([
    'run',
    '--rm',
    '--no-deps',
    'e2e',
    'npm',
    'run',
    'test:e2e:browser',
    '--',
    ...browserArgs,
  ]);
} catch (error) {
  process.exitCode = 1;
  console.error(error.message);
  if (started) {
    try {
      const logs = await docker(
        [
          'logs',
          '--no-color',
          '--tail',
          '100',
          'gateway',
          'stores',
          'catalog',
          'inventory',
          'orders',
          'storefront',
        ],
        true,
      );
      writeFileSync(resolve(artifacts, 'services.log'), logs);
    } catch {}
  }
} finally {
  if (started) {
    try {
      await docker(['down', '--volumes', '--remove-orphans', '--timeout', '5']);
    } catch (error) {
      process.exitCode = 1;
      console.error('Falha ao remover o projeto temporário: ' + error.message);
    }
    await command(
      'docker',
      ['image', 'rm', project + '-backend', project + '-storefront', project + '-browser'],
      true,
    ).catch(() => {});
  }
  const resultPath = resolve(artifacts, 'results.json');
  if (existsSync(resultPath)) {
    const result = JSON.parse(readFileSync(resultPath, 'utf8'));
    console.log('Resultado E2E: ' + JSON.stringify(result.stats));
    writeFileSync(
      resolve(root, 'frontend/.e2e-artifacts/latest.json'),
      JSON.stringify({ project, artifacts, liveGemini: live, stats: result.stats }, null, 2) + '\n',
    );
  }
  console.log('Relatório E2E: ' + resolve(artifacts, 'report/index.html'));
}
