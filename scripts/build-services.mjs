import { spawnSync } from 'node:child_process';
const apps = ['catalog', 'inventory', 'orders', 'recommendations', 'gateway', 'ai-assistant'];
for (const app of apps) {
  const result = spawnSync(
    process.execPath,
    ['node_modules/typescript/bin/tsc', '-p', `apps/${app}/tsconfig.json`],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
