# Gerar Commerce

**Uma base reutilizável para gerar diferentes lojas.** Projeto educacional do IC/UFAL para LPS e Reuso de Software e Metodologias Ágeis, período 2026.2.

Equipe: **Caio Mascarenhas Soares e Laura Marques Costa**. Apresentação: **11/11/2026**. Meta de conclusão: **10/11/2026**.

- [Comece aqui: organização e funcionamento](docs/organizacao-do-projeto.md)
- [Frontend Angular](frontend/README.md) · [Backend NestJS e framework](backend/README.md)
- [Repositório](https://github.com/CaioMascarenhas/gerar-commerce) · [Kanban](https://github.com/users/CaioMascarenhas/projects/3/views/2)
- [Arquitetura](docs/arquitetura.md) · [Variabilidade](docs/variabilidade.md) · [Framework e diagramas](docs/framework.md)
- [Product Backlog](docs/gestao/product-backlog.md) · [Ciclos](docs/gestao/ciclos.md)
- [Requisitos acadêmicos](docs/requisitos-academicos.md) · [Estado da implementação](docs/estado-atual.md)

## Estrutura

```text
frontend/                 Angular: interface, dependências e Dockerfile próprios
  src/                    Telas, estilos e chamadas HTTP
backend/                  NestJS: dependências e Dockerfile próprios
  services/               Gateway, catálogo, estoque, pedidos, recomendações e IA
  packages/framework/     Composição de lojas e hotspots
  packages/contracts/     Tipos usados pelos serviços do backend
  packages/platform/      Inicialização e utilitários técnicos do NestJS
  scripts/                Build, inicialização, testes e derivação
docs/                     Modelagem, explicações, gestão e evidências
projeto_docs/             Materiais fornecidos pelas disciplinas
scripts/                  Gestão do GitHub e verificação da documentação
compose.yaml              Conecta os contêineres
package.json              Atalhos e ferramenta de formatação do repositório
```

Frontend e backend têm `package.json`, lockfile e `node_modules` separados. O workspace npm existe somente dentro do backend. O frontend se comunica com as APIs por HTTP e não importa pacotes do servidor.

## Executar localmente

Requisitos: **Node.js 24** (a partir de 24.15) e npm. Instale e inicie o backend em um terminal:

```powershell
cd backend
npm ci
npm run dev
```

Em outro terminal, a partir da raiz do repositório:

```powershell
cd frontend
npm ci
npm run dev
```

Interface: **http://127.0.0.1:4200**. API do gateway: **http://127.0.0.1:3000/docs**. Encerre cada lado com `Ctrl+C` no respectivo terminal.

O frontend pode ser instalado e compilado sozinho. Para mostrar os dados, precisa do backend em execução.

## Perfil com IA

No terminal do backend:

```powershell
$env:PRODUCT_PROFILE='assistida'
npm run dev
```

Copie `backend/.env.example` para `backend/.env` e configure `GOOGLE_API_KEY` e `GEMINI_MODEL` para usar Gemini. A loja Essencial não exige chave nem inicia o serviço de IA. O token `gerar-demo` e os dados de exemplo servem à demonstração educacional.

## Atalhos da raiz

```powershell
npm run setup
npm run dev:backend
```

Use `npm run dev:frontend` em outro terminal na raiz. `setup` instala ambos nas respectivas pastas, mantendo as dependências separadas. `npm ci` na raiz instala apenas a ferramenta de formatação.

```powershell
npm run build
npm test
npm run smoke
npm run check:docs
npm run derive -- essencial
npm run derive -- assistida
```

O smoke exige as portas 3000–3005 livres. Os produtos derivados são exportados para `output/products/<perfil>/`. O CI instala e compila frontend e backend em jobs separados.

## Docker

Com Docker Desktop em execução, na raiz:

```powershell
docker compose up --build
```

Para Assistida, crie `backend/.env` a partir do exemplo e execute:

```powershell
$env:PRODUCT_PROFILE='assistida'
docker compose --env-file backend/.env --profile ai up --build
```

Cada lado tem contexto de build e Dockerfile próprios. A interface continua na porta 4200. Os serviços de domínio ficam na rede interna. `docker compose config --quiet` valida a configuração.

Este é o primeiro incremento: catálogo, estoque de leitura, histórico de exemplo, recomendações e composição de lojas estão disponíveis. Carrinho, checkout completo, persistência PostgreSQL e validação real do Gemini seguem no backlog.
