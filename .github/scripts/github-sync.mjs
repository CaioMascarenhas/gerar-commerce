import { readFileSync, writeFileSync } from 'node:fs';
import { api, graphql } from './github-client.mjs';

const config = JSON.parse(readFileSync('.github/project.json', 'utf8'));
const backlog = JSON.parse(readFileSync('docs/gestao/backlog.json', 'utf8'));
const repo = `${config.owner}/${config.repository}`;
const projectUrl = config.kanbanUrl ?? config.url;
const path = `repos/${repo}`;
const statuses = {
  backlog: 'Backlog',
  todo: 'Pronto',
  progress: 'Em andamento',
  review: 'Em revisão',
  done: 'Concluído',
};

const labels = [
  ['prioridade:P0', 'b60205', 'Obrigatório para a apresentação'],
  ['prioridade:P1', 'fbca04', 'Importante para a demonstração'],
  ['prioridade:P2', 'c5def5', 'Evolução fora do mínimo para 11/11'],
  ...['infra', 'docs', 'framework', 'backend', 'frontend', 'ia', 'testes', 'opcional'].map(
    (area) => [`area:${area}`, '1d76db', `Área: ${area}`],
  ),
  ...Object.values(statuses).map((status) => [
    `status:${status}`,
    'c2e0c6',
    `Estado inicial do Kanban: ${status}`,
  ]),
  ['bloqueado', 'd93f0b', 'Registrar a causa do bloqueio na issue'],
];
const existingLabels = api(`${path}/labels?per_page=100`);
for (const [name, color, description] of labels) {
  if (!existingLabels.some((label) => label.name === name))
    api(`${path}/labels`, 'POST', { name, color, description });
}

const milestoneDefinitions = [
  {
    title: 'I1 — Fundação (04–05/11)',
    description: 'Framework, composição, base executável e Docker.',
    due_on: '2026-11-06T02:59:00Z',
  },
  {
    title: 'I2 — Fluxo de compra (06–08/11)',
    description: 'Persistência, catálogo, estoque, carrinho, checkout e histórico.',
    due_on: '2026-11-09T02:59:00Z',
  },
  {
    title: 'I3 — Demonstração e relatórios (09–10/11)',
    description:
      'IA opcional, duas aplicações, evidências e relatórios antes da apresentação de 11/11.',
    due_on: '2026-11-11T02:59:00Z',
  },
  {
    title: 'Futuro — Opcionais após a apresentação',
    description: 'Cupons, variações e avaliações; sem compromisso com 11/11.',
  },
];
const existingMilestones = api(`${path}/milestones?state=all&per_page=100`);
const milestones = {};
for (const [index, definition] of milestoneDefinitions.entries()) {
  const milestone =
    existingMilestones.find((item) => item.title === definition.title) ??
    api(`${path}/milestones`, 'POST', definition);
  milestones[index < 3 ? `I${index + 1}` : 'Futuro'] = milestone.number;
}

let fields = graphql(
  'query($id:ID!){node(id:$id){... on ProjectV2{fields(first:40){nodes{... on ProjectV2Field{id name} ... on ProjectV2SingleSelectField{id name options{id name}}}}}}}',
  { id: config.id },
).node.fields.nodes;
let status = fields.find((field) => field.name === 'Status');
// Preserva IDs de opções existentes. Nunca reseta o andamento ao executar novamente.
if (
  !Object.values(statuses).every((name) => status.options.some((option) => option.name === name))
) {
  const oldNames = { Pronto: 'Todo', 'Em andamento': 'In Progress', Concluído: 'Done' };
  const colors = {
    Backlog: 'GRAY',
    Pronto: 'BLUE',
    'Em andamento': 'YELLOW',
    'Em revisão': 'PURPLE',
    Concluído: 'GREEN',
  };
  const options = Object.values(statuses).map((name) => ({
    ...(status.options.find((option) => option.name === name || option.name === oldNames[name]) ??
      {}),
    name,
    color: colors[name],
    description: `Coluna ${name}`,
  }));
  status = graphql(
    'mutation($input:UpdateProjectV2FieldInput!){updateProjectV2Field(input:$input){projectV2Field{... on ProjectV2SingleSelectField{id name options{id name}}}}}',
    { input: { fieldId: status.id, singleSelectOptions: options } },
  ).updateProjectV2Field.projectV2Field;
}

let priority = fields.find((field) => field.name === 'Prioridade');
if (!priority) {
  priority = graphql(
    'mutation($input:CreateProjectV2FieldInput!){createProjectV2Field(input:$input){projectV2Field{... on ProjectV2SingleSelectField{id name options{id name}}}}}',
    {
      input: {
        projectId: config.id,
        name: 'Prioridade',
        dataType: 'SINGLE_SELECT',
        singleSelectOptions: [
          { name: 'P0', color: 'RED', description: 'Obrigatório para 11/11' },
          { name: 'P1', color: 'YELLOW', description: 'Importante' },
          { name: 'P2', color: 'BLUE', description: 'Evolução posterior' },
        ],
      },
    },
  ).createProjectV2Field.projectV2Field;
}

const views = graphql(
  'query($id:ID!){node(id:$id){... on ProjectV2{views(first:20){nodes{id name layout}}}}}',
  { id: config.id },
).node.views.nodes;
if (!views.some((view) => view.name === 'Kanban'))
  graphql(
    'mutation($input:CreateProjectV2ViewInput!){createProjectV2View(input:$input){projectV2View{id name layout}}}',
    {
      input: {
        projectId: config.id,
        name: 'Kanban',
        layout: 'BOARD_LAYOUT',
        configuration: {
          visibleFieldIds: fields
            .filter((field) => ['Assignees', 'Labels', 'Milestone'].includes(field.name))
            .map((field) => field.id),
        },
      },
    },
  );

graphql('mutation($input:UpdateProjectV2Input!){updateProjectV2(input:$input){projectV2{id}}}', {
  input: {
    projectId: config.id,
    shortDescription: 'LPS e framework de e-commerce · IC/UFAL · apresentação 11/11/2026',
    readme:
      'Equipe: Caio Mascarenhas Soares e Laura Marques Costa. Meta: concluir até 10/11/2026.\n\nKanban: Backlog → Pronto → Em andamento (WIP 2) → Em revisão (WIP 2) → Concluído.\n\nMarcos I1/I2/I3 são ciclos de entrega com snapshots para os relatórios. Opcionais P2 ficam após a apresentação.\n\nFonte versionada: docs/gestao/backlog.json. Atualizar snapshots ao fechar cada ciclo.',
  },
});
const repository = api(path);
graphql(
  'mutation($project:ID!,$repo:ID!){linkProjectV2ToRepository(input:{projectId:$project,repositoryId:$repo}){repository{id}}}',
  { project: config.id, repo: repository.node_id },
);
api(`${path}/topics`, 'PUT', {
  names: [
    'angular',
    'nestjs',
    'software-product-line',
    'software-reuse',
    'microservices',
    'mastra',
    'gemini',
    'ufal',
    'educational',
  ],
});

const existingIssues = api(`${path}/issues?state=all&per_page=100`).filter(
  (issue) => !issue.pull_request,
);
const existingItems = graphql(
  'query($id:ID!){node(id:$id){... on ProjectV2{items(first:100){nodes{id content{... on Issue{id}}}}}}}',
  { id: config.id },
).node.items.nodes;
const index = [];
for (const issue of backlog.issues) {
  let remote = existingIssues.find((item) => item.title.startsWith(`[${issue.id}]`));
  const created = !remote;
  if (!remote) {
    const body = `## Objetivo\n\n${issue.title}.\n\n## Critérios de aceite\n\n${issue.acceptance.map((item) => '- [ ] ' + item).join('\n')}\n\n## Planejamento e rastreabilidade\n\n- ID: ${issue.id}\n- Ciclo: ${issue.cycle}\n- Prioridade: ${issue.priority}\n- Dependências: ${issue.dependencies.join(', ') || 'nenhuma'}\n- Fonte: docs/gestao/backlog.json\n\nConsultar docs/requisitos-academicos.md e docs/estado-atual.md.\n\n${issue.status === 'done' ? 'Entregue no incremento inicial. Verificações: build, testes do framework e smoke de integração. Evidências: docs/validacao-inicial.md.' : 'Ao concluir, registrar evidências, atualizar diagramas afetados e o snapshot do ciclo.'}`;
    remote = api(`${path}/issues`, 'POST', {
      title: `[${issue.id}] ${issue.title}`,
      body: body.replace(
        'Entregue no incremento inicial. Verificações: build, testes do framework e smoke de integração. Evidências: docs/validacao-inicial.md.',
        'Implementado e verificado. Evidências: ' + (issue.evidence ?? 'docs/validacao-inicial.md') + '.',
      ),
      labels: [
        `prioridade:${issue.priority}`,
        `area:${issue.area}`,
        `status:${statuses[issue.status]}`,
      ],
      milestone: milestones[issue.cycle],
    });
  }
  let item = existingItems.find((item) => item.content?.id === remote.node_id);
  if (!item) {
    item = graphql(
      'mutation($project:ID!,$content:ID!){addProjectV2ItemById(input:{projectId:$project,contentId:$content}){item{id}}}',
      { project: config.id, content: remote.node_id },
    ).addProjectV2ItemById.item;
    for (const [field, option] of [
      [status, status.options.find((option) => option.name === statuses[issue.status])],
      [priority, priority.options.find((option) => option.name === issue.priority)],
    ]) {
      graphql(
        'mutation($input:UpdateProjectV2ItemFieldValueInput!){updateProjectV2ItemFieldValue(input:$input){projectV2Item{id}}}',
        {
          input: {
            projectId: config.id,
            itemId: item.id,
            fieldId: field.id,
            value: { singleSelectOptionId: option.id },
          },
        },
      );
    }
  }
  if (created && issue.status === 'done') {
    const completedBody = remote.body.replaceAll('- [ ] ', '- [x] ');
    api(`${path}/issues/${remote.number}`, 'PATCH', {
      state: 'closed',
      state_reason: 'completed',
      body: completedBody,
    });
  }
  index.push({ id: issue.id, number: remote.number, url: remote.html_url, itemId: item.id });
  console.log(`${issue.id} → #${remote.number}`);
}
writeFileSync(
  'docs/gestao/github-index.json',
  JSON.stringify({ project: projectUrl, issues: index }, null, 2) + '\n',
);
const rows = backlog.issues.map((issue) => {
  const link = index.find((item) => item.id === issue.id);
  return `| [${issue.id}](${link.url}) | ${issue.title} | ${issue.priority} | ${issue.cycle} | ${statuses[issue.status]} | ${issue.dependencies.join(', ') || '—'} |`;
});
// Só remove a pendência local depois que os vínculos reais foram persistidos.
for (const issue of backlog.issues) delete issue.githubPending;
writeFileSync('docs/gestao/backlog.json', JSON.stringify(backlog, null, 2) + '\n');
writeFileSync(
  'docs/gestao/product-backlog.md',
  `# Product Backlog\n\nAtualizado em ${backlog.updatedAt}. [Kanban](${projectUrl}). Snapshot dos estados registrados no backlog local.\n\nFonte estruturada: [backlog.json](backlog.json). Prioridades: P0 obrigatório para 11/11, P1 importante, P2 evolução posterior.\n\n| ID | Item | Prioridade | Ciclo | Estado atual | Dependências |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n\n[Planejamento dos ciclos e regras de Kanban](ciclos.md).\n`,
);
console.log(`GitHub sincronizado: ${config.url}`);
