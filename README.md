# Gerar Commerce

**Uma base reutilizável para gerar diferentes lojas.** Projeto educacional do IC/UFAL para as disciplinas de LPS e Reuso de Software e Metodologias Ágeis, período 2026.2.

Equipe: **Caio Mascarenhas Soares e Laura Marques Costa**. Apresentação: **11/11/2026**. Meta de conclusão: **10/11/2026**.

- [Repositório](https://github.com/CaioMascarenhas/gerar-commerce)
- [Kanban](https://github.com/users/CaioMascarenhas/projects/3/views/2)
- [Arquitetura e decisões](docs/arquitetura.md)
- [Core, variabilidade e opcionais](docs/variabilidade.md)
- [Diagramas de classes e componentes](docs/framework.md)
- [Product Backlog](docs/gestao/product-backlog.md) · [Ciclos / Sprint Backlogs](docs/gestao/ciclos.md)
- [Rastreabilidade dos relatórios](docs/requisitos-academicos.md)
- [Estado real da implementação](docs/estado-atual.md)

## Executar localmente

Requisitos: **Node.js 24** (a partir de 24.15) e npm. Docker é opcional para o desenvolvimento local.

```powershell
npm ci
npm run dev
```

Abra **http://127.0.0.1:4200**. O gateway fica em **http://127.0.0.1:3000/docs**. Os processos sobem juntos e são encerrados com `Ctrl+C`.

Por padrão, inicia a loja **Gerar Essencial**. Para executar a segunda aplicação:

```powershell
$env:PRODUCT_PROFILE='assistida'
npm run dev
```

O comando inicia também o serviço opcional de IA. Para consultar Gemini, copie `.env.example` para `.env` e preencha `GOOGLE_API_KEY` e `GEMINI_MODEL` com um modelo disponível na sua conta Google AI Studio. Nenhuma chave é necessária para a loja Essencial. Não há chamadas pagas nos testes.

O token administrativo `gerar-demo` é uma credencial pública de demonstração local, não um mecanismo de autenticação para produção. As fixtures não contêm dados reais. Cadastro complexo e pagamento real ficam fora do escopo acadêmico.

## Derivar produtos

```powershell
npm run derive -- essencial
npm run derive -- assistida
```

Os artefatos aparecem em `output/products/<perfil>/`: blueprint validado, ambiente, referência ao Compose e instruções. As duas subclasses reutilizam `CommerceApplication`, registram componentes e escolhem a política de entrega pelos hotspots. [Tutorial para adicionar uma loja](docs/framework.md).

## Docker

Com o Docker Desktop em execução:

```powershell
docker compose up --build
```

Para a loja assistida, habilite **o perfil do produto e o perfil do Compose**:

```powershell
$env:PRODUCT_PROFILE='assistida'
docker compose --profile ai up --build
```

Mesma interface na porta 4200. Somente a interface e o gateway são publicados no host; os serviços de domínio ficam na rede interna. `docker compose ps` exibe a saúde e as portas internas/publicadas.

## Validar

```powershell
npm run build
npm test
npm run smoke
npm run check:docs
docker compose config --quiet
```

Execute o smoke com as portas 3000–3004 livres. Ele inicia processos temporários e verifica a comunicação real entre os serviços. O CI executa build, testes, smoke e consistência do backlog.

## Estrutura

```text
apps/
  storefront/          Angular: vitrine, composição e saúde dos serviços
  gateway/             NestJS: entrada única e composição das APIs
  catalog/             NestJS: catálogo
  inventory/           NestJS: estoque
  orders/              NestJS: pedidos e resumo de vendas
  recommendations/     NestJS: recomendação por histórico
  ai-assistant/        NestJS + Mastra + Gemini, opcional
packages/
  contracts/           Tipos públicos de integração
  framework/           Template Method, registry, validação e hotspots
  backend/             Bootstrap técnico e cliente HTTP
docs/                  Modelagem, gestão e evidências
projeto_docs/          Enunciados e modelos fornecidos pelas disciplinas
```

Este é o primeiro incremento. Carrinho, checkout, escrita de estoque, PostgreSQL e validação real do Gemini estão nas issues, com critérios de aceite. Features selecionadas no blueprint descrevem a composição prevista, não significam que todas já estão implementadas.
