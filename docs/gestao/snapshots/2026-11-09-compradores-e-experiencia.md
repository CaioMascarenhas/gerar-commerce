# Snapshot I3 — compradores e experiência de compra

> Registro histórico anterior à auditoria de integração. O agente administrativo foi posteriormente validado com Gemini real e o GitHub foi sincronizado; consulte o [snapshot da PR #29](2026-11-09-sincronizacao-e-merge.md) para os estados atuais.

Data de referência: 09/11/2026, America/Fortaleza. Solicitação registrada durante a evolução da plataforma dinâmica, após o merge de PB-028.

## Escopo solicitado e implementado

- **PB-033:** conta de comprador por loja, nome/e-mail/senha, scrypt, sessão persistida em hash, cookie próprio e histórico pessoal. Visita e sacola públicas; checkout exige conta e usa a identidade do servidor.
- **PB-034:** painel de cupons com código próprio, percentual, compra mínima, validade e ativação; validação pelo domínio de pedidos e política reutilizável no framework. Substitui o desconto fixo do incremento inicial.
- **PB-035:** acesso destacado ao agente administrativo e estado de configuração; chat público Gemini de dicas baseado somente em catálogo e disponibilidade, com IDs filtrados e links internos de produtos. Página individual de produto.
- **PB-036:** sacola com botão flutuante e contador, animações de entrada/saída, movimento reduzido, foco nos diálogos e acesso à própria loja pelo menu.
- **PB-037:** upload otimizado e URL HTTPS para capas e produtos, prévia, encaixe, posição e zoom persistidos; fallback de imagem indisponível. Sugestões acrescentam fotos ilustrativas conhecidas do Unsplash, explicitamente identificadas e editáveis.
- **PB-038:** testes de autorização, isolamento, persistência e cupons; build e Docker. O Compose passa a ler automaticamente o arquivo opcional backend/.env no serviço de IA, sem copiá-lo para a imagem.

## Evidências verificadas

- Builds Angular e backend aprovados.
- Nove testes do framework aprovados, incluindo percentual, mínimo, validade e desativação de cupons.
- 73 verificações de integração PostgreSQL aprovadas em banco temporário, incluindo compra anônima bloqueada, separação comprador/administrador, isolamento entre lojas, ID do comprador obtido da sessão, persistência, cupons, imagem/enquadramento, checkout idempotente e concorrência de estoque.
- Nove URLs ilustrativas responderam HTTP 200 com conteúdo image/jpeg. Isso comprova disponibilidade na data da verificação, sem garantir disponibilidade futura ou correspondência com produtos reais.
- Compose compilado e executado preservando o volume e a loja existente.
- Chamada real ao chat Gemini da loja existente retornou uma recomendação e o link interno de um produto válido do catálogo. Nenhum dado de vendas ou compradores foi enviado nesse teste.

## Revisão pendente e limites

- A ferramenta de controle do navegador bloqueou a revisão visual porque não conseguiu confirmar com segurança a URL atual no Chrome. Não foram contornadas as proteções da ferramenta. Layout, responsividade, animações, foco e enquadramento ainda precisam de conferência visual humana.
- O agente administrativo mantém as ferramentas de estoque e vendas, mas sua chamada real ainda não foi validada nesta evolução; o teste real realizado foi do chat público.
- Não há confirmação de e-mail, recuperação de senha ou conta global entre lojas. Fotos ilustrativas não são fotografias geradas pelo Gemini nem comprovação visual do item vendido. Hospedagem externa pode bloquear links ou removê-los; upload é a alternativa local.
- Itens de interface permanecem em revisão no Kanban. Nenhuma issue ou coluna remota foi alterada automaticamente. PB-033 está concluído com evidência de integração; os demais registros preservam a revisão manual pendente.

Os arquivos históricos de 04 e 05/11 mantêm o estado anterior. O Product Backlog e os contratos atuais refletem a mudança de escopo.

## Versionamento solicitado

As alterações foram organizadas em commits locais por solicitação explícita do usuário, na branch `feat/pb-033-experiencia-compradores`:

- `164e01e` — contas de compradores, cupons e chat de produtos no backend.
- `e7374a6` — carregamento automático do arquivo de ambiente da IA no Docker.
- `158fb8e` — experiência de compra, perfis, regressões de foco, fotos e identidade visual no frontend.

Este registro integra o commit de documentação, arquitetura e backlogs. Nenhum push ou sincronização remota do Kanban foi realizado nesta etapa.
