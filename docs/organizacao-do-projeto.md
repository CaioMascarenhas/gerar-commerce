# Organização do projeto

```text
frontend/
  src/app/pages/          Plataforma, cadastro, loja e administração
  src/app/components/     Features, imagens, contas, foco e chat reutilizáveis
  src/app/models/         Contratos HTTP do frontend
  src/app/api.ts          Cliente HTTP e mensagens de erro
  src/app/routes.ts      Plataforma, acesso à loja, vitrine, produto e painel
  src/styles.css         Estilo e adaptação a telas menores
  Dockerfile             Angular compilado, servido por Nginx
backend/
  services/stores/       Lojas, compradores, senhas e sessões
  services/catalog/      Produtos e avaliações
  services/inventory/    Saldos e reservas
  services/orders/       Cupons, compra simulada e pedidos
  services/ai-assistant/  Geração, chat público e agente administrativo
  services/gateway/      Entrada HTTP e autorização por loja
  packages/framework/    Template Method, features, temas, planos e políticas
  packages/contracts/    Contratos públicos compartilhados pelo backend
  packages/platform/     NestJS, HTTP, PostgreSQL e validação
  scripts/               Build, inicialização, smoke e exportação
docs/                    Modelagem, contratos, gestão e evidências
projeto_docs/            Materiais fornecidos pelas disciplinas
compose.yaml             Oito contêineres e volume PostgreSQL
```

Frontend e backend têm dependências e lockfiles próprios. O workspace npm existe somente dentro do backend. Não há instalação npm na raiz nem imports do backend pelo Angular.

O navegador chama o gateway em `/api`. O gateway autoriza a loja correta e encaminha aos serviços por HTTP. Cada serviço acessa as suas tabelas PostgreSQL. O framework fornece composição e políticas sem depender de infraestrutura.

O cadastro é dinâmico: a plataforma salva uma definição de produto e o Angular monta a loja pela configuração. Não gera uma cópia do projeto nem inicia contêineres adicionais por lojista. O exportador de snapshots serve para inspecionar a composição e documentar produtos nos relatórios.

Os comandos completos estão no [README](../README.md). O estado real, incluindo limites e validação pendente, está em [estado-atual.md](estado-atual.md).
