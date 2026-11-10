# Sprint Backlog / snapshot Kanban — navegação e avaliações, 10/11/2026

Solicitação do usuário: corrigir o botão que saía da loja ao abrir a coleção, retirar menus repetidos, permitir avaliação somente por comprador conectado com compra aprovada, usar o nome da conta e retirar recomendações automáticas. Item local: **PB-043**, ciclo I3.

## Implementação

- A coleção usa a rota Angular `/loja/:slug#colecao`, com rolagem após renderização do catálogo.
- A vitrine usa somente o menu da própria loja. O cabeçalho da plataforma e o resumo de perfis permanecem nas demais páginas.
- O catálogo valida a sessão do comprador e consulta pedidos por HTTP para conferir uma compra aprovada do produto. Não há consulta SQL entre domínios.
- O autor da avaliação vem da conta, sem campo de nome editável e sem confiar em identidade enviada no JSON. Uma nova publicação do mesmo comprador atualiza a própria avaliação.
- Avaliações antigas são preservadas sem selo de compra verificada; cadastros, produtos, pedidos e sessões não são apagados.
- Recomendações automáticas saem do core, do gateway e dos serviços. As composições antigas são atualizadas na inicialização; o chat opcional Gemini permanece disponível.

## Validação concluída

Builds aprovados, 8 testes de frontend, 15 testes de backend e 83 verificações PostgreSQL aprovados. A suíte E2E concluiu 15 testes em Chromium, Firefox e WebKit móvel, sem falhas; somente o cenário Gemini real foi ignorado intencionalmente nesta rodada sem chave. O ambiente de testes e o banco temporário foram removidos ao terminar. Os novos cenários cobrem identidade forjada, visitante, administrador, sessão de outra loja, ausência de compra e pagamento recusado.

Não foram criadas issues remotas nem alterados os snapshots das validações anteriores. A retirada das recomendações é uma mudança explícita do escopo, registrada também na rastreabilidade acadêmica.

A migração de um blueprint antigo com recomendações foi simulada no banco temporário e aprovada após reinício. Capturas de desktop e celular foram inspecionadas, confirmando um único cabeçalho da loja e ausência do resumo duplicado de perfis. As telas do teste exibem dados fictícios.

[Resumo de evidências](../evidencias/2026-11-10-navegacao-avaliacoes.json).
