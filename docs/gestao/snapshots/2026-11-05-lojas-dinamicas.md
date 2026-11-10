# Sprint Backlog / snapshot Kanban — 05/11/2026

## Mudança de escopo autorizada

O usuário solicitou substituir a exportação de perfis estáticos por uma plataforma de cadastro dinâmico. Cada loja passa a ter identidade, capa, senha, categoria, opcionais, produtos e rotas próprias, com PostgreSQL. O framework continua sendo responsável pela composição dos produtos.

Três categorias: Eletrônicos, Construção e Roupas. Planos fictícios de R$ 59,90, R$ 79,90 e R$ 99,90; sem cobrança real. Cadastro precisa de pelo menos um produto e oferece geração de três produtos para agilizar o preenchimento. Administração tem login simples e configurações; recuperação de senha foi explicitamente excluída.

## Itens selecionados

Foram antecipados os itens PB-008 a PB-017, PB-020, PB-024 e PB-026. PB-028 a PB-032 registram a composição dinâmica, onboarding, temas/planos, geração inicial e testes de isolamento. A execução foi sequencial por um agente; não atribuímos trabalho à dupla nem reconstruímos histórico de commits.

## Entregas verificadas

- PostgreSQL com volume e propriedade de tabelas por serviço.
- Serviço `stores` na porta 3006; adaptação dos seis serviços existentes para lojas por slug.
- Composição `ConfiguredStore`, políticas e validação do core/opcionais.
- Cadastro, login, configurações, produtos, estoque, carrinho, checkout e pedidos implementados.
- Recomendação por compras persistidas; cupons, avaliações e entrega local implementados.
- Geração inicial e agente administrativo integrados ao Gemini; fallback explícito de exemplos apenas na geração inicial.
- Builds locais e Docker aprovados. Nove contêineres iniciados, serviços saudáveis e HTTP das rotas diretas aprovado.
- Smoke usa banco temporário e testa três produtos da família, retentativas, concorrência e persistência após reinício, sem chamar Gemini.
- Resultado final: 8 testes de framework e 35 verificações de integração aprovados; envio de capa maior que 1 MB pelo Nginx, cookie por loja e exportação de snapshot também conferidos. `git diff --check` e verificação da documentação aprovados.

## Bloqueios e revisão

PB-016 fica em revisão até a chamada real ao Gemini. PB-019 e PB-029 precisam de inspeção manual das telas: a automação visual foi encerrada pela ferramenta porque não foi possível confirmar com segurança a URL atual no Chrome. Não houve tentativa de contornar essa restrição.

As portas 3000/4200 e 5432 estavam ocupadas por processos existentes. A validação usou 3300/4400 e PostgreSQL 5433, sem encerrar processos do usuário. As lojas fictícias de demonstração foram criadas pelo script `seed`; a senha pública de demonstração é documentada no README.

## Próximos passos do Kanban

1. Revisar visualmente cadastro, loja, sacola e painel em desktop e celular.
2. Configurar chave/modelo e registrar evidência de Gemini real.
3. Ampliar DTOs OpenAPI e preparar relatórios com capturas do funcionamento atual.
4. Sincronizar os novos itens locais no GitHub quando solicitado; nenhuma issue remota foi inventada ou publicada nesta alteração.

Conventional Commit sugerido para a implementação: `feat: criar plataforma de lojas dinâmicas com composição e PostgreSQL`. Nenhum commit foi criado automaticamente.
