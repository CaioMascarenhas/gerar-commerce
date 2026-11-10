# Product Backlog

Atualizado em 2026-11-09. [Kanban](https://github.com/users/CaioMascarenhas/projects/3/views/2). Estados auditados por critérios de aceite e evidências da [PR #29](https://github.com/CaioMascarenhas/gerar-commerce/pull/29).

Fonte estruturada: [backlog.json](backlog.json).

Evolução de 10/11: PB-019 recebeu testes E2E em três navegadores, validação com Gemini real e correções verificadas de checkout; permanece em revisão. PB-022 recebeu os dados de autoria individual e os requisitos do relatório de Reuso. [Snapshot e evidências](snapshots/2026-11-10-validacao-e2e.md). Os estados auditados abaixo não foram encerrados automaticamente pelos testes.

| ID                                                                    | Item                                                                 | Prioridade | Ciclo  | Estado atual | Dependências                           |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------- | ------ | ------------ | -------------------------------------- |
| [PB-001](https://github.com/CaioMascarenhas/gerar-commerce/issues/1)  | Preparar monorepo, repositório, Kanban e backlogs                    | P0         | I1     | Concluído    | —                                      |
| [PB-002](https://github.com/CaioMascarenhas/gerar-commerce/issues/2)  | Modelar arquitetura, features e rastreabilidade acadêmica            | P0         | I1     | Concluído    | —                                      |
| [PB-003](https://github.com/CaioMascarenhas/gerar-commerce/issues/3)  | Implementar framework com Template Method e hotspots                 | P0         | I1     | Concluído    | PB-002                                 |
| [PB-004](https://github.com/CaioMascarenhas/gerar-commerce/issues/4)  | Derivar duas lojas pelo mesmo framework                              | P0         | I1     | Concluído    | PB-003                                 |
| [PB-005](https://github.com/CaioMascarenhas/gerar-commerce/issues/5)  | Disponibilizar microsserviços de demonstração e gateway              | P0         | I1     | Concluído    | PB-001                                 |
| [PB-006](https://github.com/CaioMascarenhas/gerar-commerce/issues/6)  | Criar interface Angular para explorar loja e composição              | P0         | I1     | Concluído    | PB-004, PB-005                         |
| [PB-007](https://github.com/CaioMascarenhas/gerar-commerce/issues/7)  | Configurar CI com build, testes e smoke de integração                | P0         | I1     | Concluído    | PB-005, PB-006                         |
| [PB-008](https://github.com/CaioMascarenhas/gerar-commerce/issues/8)  | Persistir os domínios em PostgreSQL com isolamento                   | P0         | I2     | Concluído    | PB-005                                 |
| [PB-009](https://github.com/CaioMascarenhas/gerar-commerce/issues/9)  | Implementar manutenção simples do catálogo                           | P0         | I2     | Concluído    | PB-008                                 |
| [PB-010](https://github.com/CaioMascarenhas/gerar-commerce/issues/10) | Implementar reserva e liberação de estoque                           | P0         | I2     | Concluído    | PB-008                                 |
| [PB-011](https://github.com/CaioMascarenhas/gerar-commerce/issues/11) | Implementar carrinho e resumo da compra no Angular                   | P0         | I2     | Concluído    | PB-006                                 |
| [PB-012](https://github.com/CaioMascarenhas/gerar-commerce/issues/12) | Implementar checkout com pagamento simulado e políticas do framework | P0         | I2     | Concluído    | PB-010, PB-011                         |
| [PB-013](https://github.com/CaioMascarenhas/gerar-commerce/issues/13) | Consultar pedidos, estados e resumo administrativo                   | P0         | I2     | Concluído    | PB-012                                 |
| [PB-014](https://github.com/CaioMascarenhas/gerar-commerce/issues/14) | Recomendar com histórico real das compras de demonstração            | P0         | I2     | Concluído    | PB-013                                 |
| [PB-015](https://github.com/CaioMascarenhas/gerar-commerce/issues/15) | Criar lojas pela interface com composição dinâmica e opcionais       | P0         | I3     | Concluído    | PB-004, PB-006                         |
| [PB-016](https://github.com/CaioMascarenhas/gerar-commerce/issues/16) | Validar assistente Mastra + Gemini com estoque e vendas              | P0         | I3     | Concluído    | PB-013                                 |
| [PB-017](https://github.com/CaioMascarenhas/gerar-commerce/issues/17) | Administrar lojas com login simples por senha                        | P1         | I2     | Concluído    | PB-009, PB-013                         |
| [PB-018](https://github.com/CaioMascarenhas/gerar-commerce/issues/18) | Documentar contratos HTTP e APIs de cada serviço                     | P0         | I3     | Pronto       | PB-012                                 |
| [PB-019](https://github.com/CaioMascarenhas/gerar-commerce/issues/19) | Validar as duas aplicações de ponta a ponta                          | P0         | I3     | Em revisão   | PB-014, PB-015, PB-016, PB-017         |
| [PB-020](https://github.com/CaioMascarenhas/gerar-commerce/issues/20) | Validar Docker Compose e capturar serviços com portas                | P0         | I1     | Concluído    | PB-005                                 |
| [PB-021](https://github.com/CaioMascarenhas/gerar-commerce/issues/21) | Redigir relatório da LPS e reunir evidências                         | P0         | I3     | Pronto       | PB-018, PB-019, PB-020                 |
| [PB-022](https://github.com/CaioMascarenhas/gerar-commerce/issues/22) | Redigir relatório de reuso e documentar duas aplicações              | P0         | I3     | Pronto       | PB-018, PB-019, PB-020                 |
| [PB-023](https://github.com/CaioMascarenhas/gerar-commerce/issues/23) | Congelar demonstração e ensaiar apresentação de 11/11                | P0         | I3     | Pronto       | PB-021, PB-022                         |
| [PB-024](https://github.com/CaioMascarenhas/gerar-commerce/issues/24) | Adicionar cupons como componente opcional                            | P1         | I2     | Concluído    | PB-012                                 |
| [PB-025](https://github.com/CaioMascarenhas/gerar-commerce/issues/25) | Adicionar variações de produto como feature opcional                 | P2         | Futuro | Backlog      | PB-009, PB-010                         |
| [PB-026](https://github.com/CaioMascarenhas/gerar-commerce/issues/26) | Adicionar avaliações de produtos como feature opcional               | P1         | I2     | Concluído    | PB-013                                 |
| [PB-027](https://github.com/CaioMascarenhas/gerar-commerce/issues/27) | Separar frontend e backend com dependências independentes            | P0         | I1     | Concluído    | PB-001, PB-005, PB-006                 |
| [PB-028](https://github.com/CaioMascarenhas/gerar-commerce/issues/30) | Compor e persistir lojas dinâmicas por endereço                      | P0         | I2     | Concluído    | PB-003, PB-008                         |
| [PB-029](https://github.com/CaioMascarenhas/gerar-commerce/issues/31) | Criar onboarding, rotas de loja e painel administrativo              | P0         | I2     | Em revisão   | PB-028, PB-017                         |
| [PB-030](https://github.com/CaioMascarenhas/gerar-commerce/issues/32) | Aplicar temas de categoria e três planos fictícios                   | P0         | I2     | Concluído    | PB-028                                 |
| [PB-031](https://github.com/CaioMascarenhas/gerar-commerce/issues/33) | Gerar três produtos para agilizar o cadastro                         | P0         | I2     | Concluído    | PB-029                                 |
| [PB-032](https://github.com/CaioMascarenhas/gerar-commerce/issues/34) | Testar isolamento, persistência e retentativas de compra             | P0         | I2     | Concluído    | PB-028, PB-012                         |
| [PB-033](https://github.com/CaioMascarenhas/gerar-commerce/issues/35) | Criar contas de compradores e exigir login no checkout               | P0         | I3     | Concluído    | PB-017, PB-012                         |
| [PB-034](https://github.com/CaioMascarenhas/gerar-commerce/issues/36) | Cadastrar e administrar cupons próprios da loja                      | P0         | I3     | Em revisão   | PB-024                                 |
| [PB-035](https://github.com/CaioMascarenhas/gerar-commerce/issues/37) | Disponibilizar chat Gemini e links individuais de produtos           | P0         | I3     | Em revisão   | PB-015, PB-016                         |
| [PB-036](https://github.com/CaioMascarenhas/gerar-commerce/issues/38) | Criar sacola flutuante animada e acesso à própria loja               | P0         | I3     | Em revisão   | PB-011, PB-029                         |
| [PB-037](https://github.com/CaioMascarenhas/gerar-commerce/issues/39) | Adicionar fotos e ajuste de enquadramento de capas e produtos        | P0         | I3     | Em revisão   | PB-009, PB-031                         |
| [PB-038](https://github.com/CaioMascarenhas/gerar-commerce/issues/40) | Validar contas, cupons e experiência ampliada                        | P0         | I3     | Concluído    | PB-033, PB-034, PB-035, PB-036, PB-037 |
| [PB-039](https://github.com/CaioMascarenhas/gerar-commerce/issues/41) | Identificar perfis conectados e permitir logout independente         | P0         | I3     | Concluído    | PB-033, PB-017                         |
| [PB-040](https://github.com/CaioMascarenhas/gerar-commerce/issues/42) | Corrigir sobreposição e foco do login ao finalizar a compra          | P0         | I3     | Concluído    | PB-033, PB-036                         |
| [PB-041](https://github.com/CaioMascarenhas/gerar-commerce/issues/43) | Padronizar tipografia com Inter nos textos e Exo nos títulos         | P1         | I3     | Concluído    | PB-006                                 |
| [PB-042](https://github.com/CaioMascarenhas/gerar-commerce/issues/44) | Criar ícones originais para as três categorias de loja               | P1         | I3     | Concluído    | PB-030                                 |

31 itens concluídos, seis em revisão, quatro prontos e um no backlog. A revisão visual geral, Swagger completo, relatórios e ensaio continuam pendentes. [Auditoria e evidências](snapshots/2026-11-09-sincronizacao-e-merge.md).

[Planejamento dos ciclos e regras de Kanban](ciclos.md).
