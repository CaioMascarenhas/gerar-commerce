import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const backlog = JSON.parse(readFileSync('docs/gestao/backlog.json', 'utf8'));
const issues = backlog.issues;
const ids = new Set(issues.map((issue) => issue.id));
assert.equal(ids.size, issues.length, 'IDs duplicados no backlog.');
for (const issue of issues) {
  for (const dependency of issue.dependencies)
    assert(ids.has(dependency), `Dependência inexistente: ${dependency}`);
  assert(issue.acceptance.length >= 2, `${issue.id} precisa de critérios de aceite.`);
}
const active = new Set();
const complete = new Set();
function visit(id) {
  assert(!active.has(id), `Dependência circular no backlog: ${id}`);
  if (complete.has(id)) return;
  active.add(id);
  issues.find((issue) => issue.id === id).dependencies.forEach(visit);
  active.delete(id);
  complete.add(id);
}
ids.forEach(visit);
for (const path of [
  'README.md',
  'docs/arquitetura.md',
  'docs/variabilidade.md',
  'docs/framework.md',
  'docs/requisitos-academicos.md',
  'docs/estado-atual.md',
  'docs/gestao/product-backlog.md',
  'docs/gestao/ciclos.md',
])
  assert(existsSync(path), `Documento ausente: ${path}`);
const index = JSON.parse(readFileSync('docs/gestao/github-index.json', 'utf8'));
assert.equal(index.issues.length, issues.length, 'Issues e backlog estão divergentes.');
for (const issue of index.issues)
  assert(ids.has(issue.id), `Issue sem item de backlog: ${issue.id}`);
console.log(
  `Documentação OK: ${issues.length} itens, critérios de aceite, dependências acíclicas e links do GitHub.`,
);
