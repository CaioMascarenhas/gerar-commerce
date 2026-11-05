# Kanban e snapshots de entrega

Equipe: Caio Mascarenhas Soares e Laura Marques Costa. Laura será adicionada ao GitHub posteriormente pelo Caio; não há convite automático. A divisão das issues entre a dupla será combinada, sem inventar responsáveis.

## Método

Kanban: **Backlog → Pronto → Em andamento → Em revisão → Concluído**. Limite sugerido: no máximo **2** itens em andamento e **2** em revisão para a dupla. Bloqueios recebem etiqueta e motivo na issue; o item permanece na coluna correspondente.

Como os modelos exigem Product Backlog e Sprint Backlog, usaremos ciclos curtos e registraremos os conjuntos selecionados com esse nome no relatório. São snapshots de planejamento do Kanban; não estamos declarando adoção de todos os eventos/papéis do Scrum.

Critério de pronto para iniciar: descrição compreensível, dependências identificadas e critérios de aceite verificáveis. Critério de concluído: implementação quando aplicável, verificação pertinente, documentação coerente e evidência na issue/commit. Não fechar uma funcionalidade apenas porque existe uma pasta ou um contrato.

## Plano até a apresentação

| Data local | Resultado esperado                                                |
| ---------- | ----------------------------------------------------------------- |
| 04/11      | Nome, repositório, modelagem, framework e incremento inicial      |
| 05/11      | Validar Docker e fechar fundação                                  |
| 06/11      | Persistência, catálogo e estoque                                  |
| 07/11      | Carrinho, checkout e pagamento simulado                           |
| 08/11      | Pedidos, administração e recomendação com histórico persistido    |
| 09/11      | Seletor final, Gemini e testes dos dois produtos                  |
| 10/11      | Relatórios, evidências, correções e ensaio; congelar demonstração |
| 11/11      | Apresentação, sem desenvolvimento planejado                       |

Datas de 2026, fuso America/Fortaleza. Plano inicial com prazo curto; priorizar P0 e reduzir as evoluções P2.

## Snapshot I1 — Fundação (04–05/11)

Meta: tornar o reuso e os limites dos serviços executáveis e inspecionáveis.

Selecionados: **PB-001 a PB-007 e PB-020**. Os sete primeiros correspondem ao incremento inicial; PB-020 depende da execução real do motor Docker. O fechamento do ciclo depende da captura dos serviços e portas. [Snapshot do incremento de 04/11](snapshots/2026-11-04-i1.md).

Refinamento solicitado em 04/11: **PB-027**, separação física e de dependências entre frontend e backend, com documentação de funcionamento.

## Snapshot I2 — Fluxo de compra (06–08/11)

Meta: concluir uma compra de demonstração e usar seu histórico.

Selecionados: **PB-008 a PB-014 e PB-017**. Ordem principal: persistência → catálogo/estoque → carrinho → checkout → pedidos → recomendação. Administração depende das APIs. Refinar a divisão entre a dupla na abertura do ciclo.

## Snapshot I3 — Demonstração e relatórios (09–10/11)

Meta: demonstrar os dois produtos, incluindo IA opcional, e concluir as duas entregas acadêmicas.

Selecionados: **PB-015, PB-016, PB-018, PB-019, PB-021, PB-022 e PB-023**. Documentação pode ser adiantada durante os demais ciclos; capturas finais precisam refletir o código real.

## Depois da apresentação

**PB-024 a PB-026**: cupons, variações de SKU e avaliações. Não compõem o mínimo para 11/11. Só antecipar caso todas as entregas P0 já estejam aceitas.

## Registro para o relatório

Na abertura/fechamento de cada ciclo, adicionar snapshot datado em `docs/gestao/snapshots/`, com itens selecionados, concluídos, bloqueios e mudanças de escopo. Manter histórico real, links de commits/PRs e evidências; não reconstruir um histórico fictício no final. Se mudar status manualmente no Project, registrar também o fechamento no snapshot para preservar a rastreabilidade.
