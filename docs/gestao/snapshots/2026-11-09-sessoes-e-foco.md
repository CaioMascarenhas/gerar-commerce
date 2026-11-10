# Snapshot I3 — perfis conectados e foco do login

Data de referência: 09/11/2026, America/Fortaleza. Correção solicitada a partir de captura da tela de finalização: o login aparecia desfocado por baixo da camada de fundo.

## PB-039 — perfis conectados

- O cabeçalho passa a mostrar o perfil administrativo da loja e o comprador separadamente, com nome, loja e comandos explícitos **Sair da loja** e **Sair do comprador**.
- Refinamento solicitado: botão **Entrar para comprar** no cabeçalho principal. Abre login/cadastro na loja atual mantendo o produto visitado; sem contexto, `/entrar` oferece escolha da loja. Após login, o botão exibe **Minha conta**. O diálogo identifica o nome da loja.
- Estado de sessão compartilhado entre cabeçalho, vitrine e painel, confirmado pelas APIs de sessão. O último endereço é lembrado no navegador; tokens e senhas não são guardados nesse estado persistente.
- Logout de um perfil preserva a sessão do outro. Consultas iniciadas antes de um login/logout não podem sobrescrever o estado mais recente. O painel protegido acompanha o logout realizado no cabeçalho.

## PB-040 — login e sacola

- Causa da sobreposição: a regra `.dialog`, declarada depois de `.buyer-dialog` com a mesma especificidade, diminuía o z-index do login para 45, deixando seu próprio fundo em 55 por cima. O seletor `.dialog.buyer-dialog` preserva a camada 60.
- Abrir a conta pela finalização pausa a sacola, mantendo os itens. Ao concluir ou cancelar o login, a sacola volta para permitir continuar a compra, sem disparar pagamento automaticamente.
- A gestão de foco acompanha os diálogos ativos. Um painel que termina sua animação de saída não rouba o foco nem libera a rolagem enquanto outro diálogo está aberto. Somente o diálogo superior recebe interação; o formulário direciona o foco para o primeiro campo apropriado.

## Verificação

- Seis testes de frontend com componentes compilados pelo Angular e DOM simulado: ordem das camadas, foco durante a saída de outro painel, contenção de Tab, retomada da sacola, logout independente, proteção contra respostas antigas de sessão e interação com os perfis do cabeçalho.
- O frontend passa a executar `npm test` no CI. Artefatos de teste ficam fora do Git e do contexto Docker.
- Smoke PostgreSQL ampliado de 73 para 75 verificações, comprovando que sair do comprador mantém a sessão administrativa e vice-versa.
- Build Angular e reconstrução do frontend Docker fazem parte da validação desta correção. Os testes de DOM não substituem inspeção visual no navegador.

Os itens permanecem em revisão para conferência humana da interface. Os commits locais foram criados posteriormente por solicitação explícita do usuário; os hashes estão no [registro de versionamento](2026-11-09-compradores-e-experiencia.md). Nenhuma sincronização remota do Kanban foi realizada.
