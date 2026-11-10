# Gerar Commerce

Plataforma acadêmica para **criar lojas dinamicamente** com Angular, microsserviços NestJS e PostgreSQL. O framework compõe cada produto a partir das funcionalidades escolhidas no cadastro. Não é necessário copiar código nem implantar um conjunto de contêineres para cada loja.

Equipe: Caio Mascarenhas Soares e Laura Marques Costa · IC/UFAL · 2026.2.

## Rodar com Docker

Com Docker Desktop aberto, execute na raiz:

```powershell
docker compose up --build -d
```

- Plataforma: http://localhost:4200
- Cadastro: http://localhost:4200/criar
- Loja: `http://localhost:4200/loja/<endereco>`
- Administração: `http://localhost:4200/admin/<endereco>`
- Swagger do gateway: http://localhost:3000/docs
- PostgreSQL local: `localhost:5433`, banco `gerar_commerce`, usuário `gerar`, senha local `gerar_local`.

O banco persiste no volume `commerce-data`. `docker compose down` encerra os contêineres preservando os dados. As tabelas são criadas de forma idempotente na inicialização de cada serviço. Não use `down -v` se quiser preservar as lojas.

Caso alguma porta esteja ocupada, defina `FRONTEND_PORT`, `GATEWAY_PORT` ou `POSTGRES_PORT` no terminal antes de subir os contêineres. Exemplo: `$env:FRONTEND_PORT='4400'` e `$env:GATEWAY_PORT='3300'`.

## Desenvolver sem contêineres de aplicação

Requisito: Node.js `>=24.15 <25`. Na raiz, inicie somente o banco:

```powershell
docker compose up -d postgres
```

Backend, em um terminal a partir da raiz:

```powershell
cd backend
npm.cmd ci
npm.cmd run dev
```

Frontend, em outro terminal a partir da raiz:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

O PowerShell pode bloquear `npm.ps1`; `npm.cmd` evita esse problema. Não há `package.json` na raiz. O backend compila ao iniciar; reinicie-o após alterar seu código. O Angular atualiza automaticamente.

## Criar e administrar uma loja

1. Acesse `/criar`. Cadastre nome, endereço único, descrição, foto de capa, categoria e senha com pelo menos seis caracteres.
2. Confira as sete funcionalidades core, sempre selecionadas. Escolha cupons, avaliações, entrega local e/ou agente de IA.
3. Cadastre pelo menos um produto. O botão **Gerar 3 produtos com IA** usa Gemini quando configurado; sem chave, informa que adicionou exemplos editáveis da categoria.
4. Crie a loja e abra `/loja/<endereco>`. Cada produto tem um link próprio. A sacola flutuante mostra a quantidade de itens e abre com animação.
5. Para comprar, o visitante cria uma conta com nome, e-mail e senha de pelo menos oito caracteres. A conta e os pedidos ficam vinculados à loja; a navegação é livre.
6. Use **Acessar minha loja** no menu ou entre em `/admin/<endereco>` com a senha cadastrada. Gerencie produtos, estoque, pedidos, cupons e configurações. Alterar opcionais recompõe a loja e atualiza seu plano.

Os perfis conectados aparecem no cabeçalho, com nome e ações **Sair da loja** e **Sair do comprador**. Encerrar um perfil mantém o outro conectado. O login solicitado pela finalização pausa a sacola e a reabre com os itens preservados ao fechar a conta.

O cabeçalho principal também oferece **Entrar para comprar**, que abre login e cadastro de comprador na loja atual, preservando a página do produto. Sem uma loja selecionada, `/entrar` permite escolher uma. Após autenticar, o botão passa a **Minha conta**.

Categorias: **Eletrônicos**, **Construção** e **Roupas**, cada uma com cores próprias. O endereço da loja permanece fixo após o cadastro.

| Plano fictício | Regra                                                    | Mensalidade |
| -------------- | -------------------------------------------------------- | ----------: |
| Essencial      | Apenas core                                              |    R$ 59,90 |
| Completo       | Um ou mais opcionais, sem agente                         |    R$ 79,90 |
| Inteligente    | Agente de IA selecionado, com quaisquer outros opcionais |    R$ 99,90 |

Não há cobrança, assinatura externa, cartão real ou recuperação de senha. A compra permite simular aprovação e recusa. Na aba **Cupons**, a administração cadastra código, percentual, compra mínima, validade opcional e ativação. Não existe código de desconto automático. Entrega local custa R$ 15,00 e a retirada é gratuita.

Capas e fotos de produtos aceitam upload ou link HTTPS direto, com prévia, encaixe, zoom e posição. Fotos enviadas são otimizadas; o enquadramento é persistido. Links externos dependem da disponibilidade e das permissões do provedor; a interface informa quando a foto não carrega.

## IA opcional

Para chamadas reais, crie `backend/.env` a partir de `backend/.env.example` e preencha `GOOGLE_API_KEY` e `GEMINI_MODEL`. Nunca coloque a chave no frontend.

Localmente o backend lê esse arquivo. O Compose também o carrega automaticamente no serviço de IA, quando o arquivo existe. Para aplicar alterações:

```powershell
docker compose up --build -d
```

O serviço de IA permanece disponível para ajudar no cadastro de qualquer loja. A geração acrescenta fotos ilustrativas de um conjunto conhecido do Unsplash, identificadas para revisão; o Gemini gera os textos, não as fotografias nem URLs arbitrárias.

Selecionar `aiAssistant` habilita dois acessos: **Abrir agente**, no painel após login, para estoque e vendas; e **Dicas com IA**, na vitrine, para comparação de produtos. O chat público recebe apenas catálogo e disponibilidade da loja. Os links retornados são montados pelo servidor com IDs válidos desse catálogo; dados de pedidos e compradores não são enviados ao chat público. Sem chave, há erro explícito. O painel mostra se a configuração está presente, sem expor credenciais.

## Verificação

Para criar três lojas fictícias de demonstração com o gateway já rodando, execute `npm.cmd run seed` dentro de `backend/`. Seus endereços são `demo-eletronicos`, `demo-construcao` e `demo-roupas`; a senha administrativa é `gerar-demo123`. O script preserva lojas que já existam com esses endereços. Para outro gateway, defina `GATEWAY_URL`, por exemplo `http://127.0.0.1:3300`.

Dentro de `backend/`:

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run smoke
```

O smoke exige PostgreSQL e permissão para criar um banco temporário. Usa as portas 3100–3106 e remove somente o banco de teste que criou. Confere cadastro, três categorias, preços, isolamento, sessões, CRUD, checkout, idempotência, estoque concorrente, persistência após reinício e opcionais. Nunca usa Gemini.

Dentro de `frontend/`: `npm.cmd run build`. Na raiz: `node .github/scripts/check-docs.mjs`.

## Arquitetura e gestão

- [Organização](docs/organizacao-do-projeto.md) · [Arquitetura e decisões](docs/arquitetura.md)
- [Framework](docs/framework.md) · [Modelo de features](docs/variabilidade.md) · [Contratos HTTP](docs/api.md)
- [Estado e limites](docs/estado-atual.md) · [Product Backlog](docs/gestao/product-backlog.md) · [Ciclos Kanban](docs/gestao/ciclos.md)
- [Materiais das disciplinas](projeto_docs/) · [Requisitos acadêmicos](docs/requisitos-academicos.md)

Os antigos perfis Essencial/Assistida em código são exemplos didáticos do framework. A criação operacional ocorre pela plataforma e persiste cada composição no PostgreSQL; a CLI é apenas uma exportação de diagnóstico de uma loja já cadastrada.
