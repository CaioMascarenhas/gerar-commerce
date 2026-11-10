# Snapshot I3 — testes em navegador e correções de checkout

Solicitação: validar as funcionalidades, executar testes normais e E2E, corrigir problemas encontrados, fazer commits e push. Trabalho associado a **PB-019**, com evidências úteis para PB-029, PB-034 a PB-038 e para os relatórios PB-021/PB-022.

## Correções verificadas

- A compra travava em HTTP fora de `localhost`: `crypto.randomUUID()` não está disponível nesse contexto e a exceção deixava o botão em processamento. A referência agora usa UUID nativo quando disponível ou UUID v4 com `crypto.getRandomValues()`. A geração ocorre dentro do tratamento de falhas do checkout. Dois testes de frontend cobrem os caminhos com e sem a API nativa.
- A confirmação de aprovação ou recusa só era renderizada na coleção. Agora aparece também na página individual do produto; os E2E verificam ambos os resultados, saldo, sacola e histórico pessoal.
- O nome acessível do botão da sacola distingue “1 item” de “itens”.
- O smoke aguarda até 60 segundos pela saúde dos serviços, com duração configurável por `SMOKE_STARTUP_TIMEOUT_MS` e diagnóstico do último estado, evitando o limite anterior de aproximadamente 18 segundos em inicializações lentas.

## Validação

| Camada                | Resultado                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------ |
| Frontend Angular      | Build e oito testes aprovados: foco, camadas de diálogos, sessões e referência do checkout |
| Backend NestJS        | Build e 15 testes aprovados: nove do framework e seis das validações da plataforma         |
| Integração PostgreSQL | 75 verificações aprovadas, com banco temporário e limpeza ao final                         |
| E2E sem chave Gemini  | 14 aprovados; cenário de Gemini real ignorado intencionalmente                             |
| E2E com Gemini real   | 14 aprovados; cenário de ausência de chave ignorado intencionalmente                       |
| Navegadores           | Chromium, Firefox e WebKit com emulação de iPhone 13                                       |

Os 15 cenários E2E incluem plataforma e rotas, cadastro completo da loja, fotos e enquadramento, cadastro de comprador durante o checkout, cupom e entrega, pedido e estoque, logout independente, CRUD administrativo, foto por URL e falha de rede, gestão de cupons, recusa de pagamento, isolamento entre lojas, avaliações, guardas de opcionais, chat e agente Gemini, largura móvel, foco e sacola com movimento reduzido e persistência após recarga.

As chamadas reais do Gemini foram feitas somente com lojas fictícias. O chat retornou um link de produto navegável e o agente consultou os nomes e saldos do catálogo. A ausência de chave também foi validada como indisponibilidade explícita. Os testes de URL de imagem interceptam uma origem HTTPS fictícia para conferir tanto a imagem válida quanto a falha; não garantem a disponibilidade futura de provedores externos.

## Execução reproduzível e isolamento

Em `frontend/`, executar `npm run test:e2e:types` e `npm run test:e2e`. Para o provedor real, usar `npm run test:e2e -- --ai`, com configuração em `backend/.env`.

Cada rodada recebe um projeto Compose `gerar-commerce-e2e-<timestamp>`, rede e volume exclusivos, sem portas públicas. O executor confere esse isolamento antes de criar a massa. A limpeza remove somente o projeto temporário e suas três imagens; não remove o volume das lojas existentes. Por padrão, as chaves da IA ficam vazias. O modo real passa a chave somente ao serviço de IA; ela não entra no navegador, nas imagens Docker ou nas evidências versionadas.

O Playwright gera HTML, JSON, JUnit e capturas. Falhas preservam vídeo e trace. Os arquivos locais ficam em `frontend/.e2e-artifacts/`; o CI executa a rodada sem chave e publica os artefatos por sete dias. A massa é reaproveitada quando o Playwright reinicia um worker após falha, evitando que o próprio teste esgote os limites de cadastro. O teste de logout usa uma sessão própria, sem revogar a sessão compartilhada da massa.

## Evidências e limites

Resumo sanitizado das rodadas e capturas selecionadas: [evidências E2E](../evidencias/2026-11-10-e2e.json). As imagens mostram dados fictícios; relatórios brutos, cookies e credenciais de teste não são versionados.

As capturas de cadastro, produto, login e sacola foram conferidas visualmente. A emulação móvel não substitui um teste em aparelho físico e teclado virtual. O pagamento permanece simulado, conforme o escopo acadêmico. Os itens em revisão não são fechados automaticamente por existir uma suíte: a aprovação final da experiência continua no Kanban. Os relatórios acadêmicos finais continuam pendentes; a identificação individual de Reuso está em [Preparação do relatório](../../relatorio-reuso.md).
