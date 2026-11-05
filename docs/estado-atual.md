# Estado da implementação — 04/11/2026

## Disponível no incremento inicial

- Frontend Angular e backend NestJS em pastas e instalações independentes. O backend contém seis aplicações NestJS (cinco obrigatórias e uma opcional) e um workspace interno para seus componentes.
- Framework com Template Method, registry, interfaces de política de entrega, validação e duas aplicações derivadas.
- Catálogo e estoque de leitura com fixtures; pedidos de demonstração e totais de exemplo.
- Recomendação em serviço próprio: procura produtos da mesma categoria de compras anteriores e exclui os já comprados; usa catálogo como fallback.
- Gateway com composição de APIs, validação dos perfis e saúde dos serviços.
- Vitrine Angular, prévia dos dois perfis, lista de serviços e consulta do assistente no perfil Assistida.
- Integração Mastra com ferramentas de leitura de estoque e resumo de vendas e modelo Gemini configurável.
- CLI de derivação, Compose com serviço de IA opcional, CI e testes.

## Ainda não concluído

- Persistência PostgreSQL, CRUD de catálogo e reserva/liberação de estoque.
- Carrinho, checkout, pagamento simulado operacional e estados reais do pedido.
- Histórico persistido gerado pelas compras feitas na interface.
- Seletor completo de features com exportação pela interface; hoje há prévia de dois perfis e exportação por CLI.
- Administração com alternância explícita de persona; hoje o assistente usa o token público de demonstração.
- Teste real do Gemini: exige configuração externa, não foi realizado sem chave.
- Execução real em Docker e evidências dos contêineres: o motor estava desligado no ambiente inicial.
- Relatórios finais, capturas de tela e ensaio da apresentação.

## Como interpretar os blueprints

O registry registra a responsabilidade de cada componente na composição. A presença de `cart`, `checkout` ou `administration` no core identifica requisitos obrigatórios da família; não certifica a conclusão da implementação. A validação atual garante integridade da composição, não um teste funcional de todos os componentes.

O aceite final de cada requisito está nas issues. A conclusão acadêmica depende do fluxo de compra funcional, das duas aplicações demonstradas e das evidências dos relatórios.
