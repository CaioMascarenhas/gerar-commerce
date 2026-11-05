import { spawnSync } from 'node:child_process';

export function gh(args, input) {
  const result = spawnSync('gh', args, {
    encoding: 'utf8',
    input: input === undefined ? undefined : JSON.stringify(input),
    windowsHide: true,
  });
  if (result.status !== 0)
    throw new Error(result.stderr || result.stdout || 'Falha na CLI do GitHub.');
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}
export function api(path, method = 'GET', body) {
  return gh(['api', path, '--method', method, ...(body ? ['--input', '-'] : [])], body);
}
export function graphql(query, variables = {}) {
  const response = gh(['api', 'graphql', '--input', '-'], { query, variables });
  if (response.errors?.length) throw new Error(JSON.stringify(response.errors));
  return response.data;
}
