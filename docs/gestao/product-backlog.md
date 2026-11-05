# Product Backlog

Snapshot inicial de 04/11/2026. [Kanban](https://github.com/users/CaioMascarenhas/projects/3/views/2). Estados atuais de execução são acompanhados no Project; este documento preserva o planejamento inicial.

Fonte estruturada: [backlog.json](backlog.json). Prioridades: P0 obrigatório para 11/11, P1 importante, P2 evolução posterior.

| ID                                                                    | Item                                                                 | Prioridade | Ciclo  | Estado inicial | Dependências                   |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------- | ------ | -------------- | ------------------------------ |
| [PB-001](https://github.com/CaioMascarenhas/gerar-commerce/issues/1)  | Preparar monorepo, repositório, Kanban e backlogs                    | P0         | I1     | Concluído      | —                              |
| [PB-002](https://github.com/CaioMascarenhas/gerar-commerce/issues/2)  | Modelar arquitetura, features e rastreabilidade acadêmica            | P0         | I1     | Concluído      | —                              |
| [PB-003](https://github.com/CaioMascarenhas/gerar-commerce/issues/3)  | Implementar framework com Template Method e hotspots                 | P0         | I1     | Concluído      | PB-002                         |
| [PB-004](https://github.com/CaioMascarenhas/gerar-commerce/issues/4)  | Derivar duas lojas pelo mesmo framework                              | P0         | I1     | Concluído      | PB-003                         |
| [PB-005](https://github.com/CaioMascarenhas/gerar-commerce/issues/5)  | Disponibilizar microsserviços de demonstração e gateway              | P0         | I1     | Concluído      | PB-001                         |
| [PB-006](https://github.com/CaioMascarenhas/gerar-commerce/issues/6)  | Criar interface Angular para explorar loja e composição              | P0         | I1     | Concluído      | PB-004, PB-005                 |
| [PB-007](https://github.com/CaioMascarenhas/gerar-commerce/issues/7)  | Configurar CI com build, testes e smoke de integração                | P0         | I1     | Concluído      | PB-005, PB-006                 |
| [PB-008](https://github.com/CaioMascarenhas/gerar-commerce/issues/8)  | Persistir os domínios em PostgreSQL com isolamento                   | P0         | I2     | Pronto         | PB-005                         |
| [PB-009](https://github.com/CaioMascarenhas/gerar-commerce/issues/9)  | Implementar manutenção simples do catálogo                           | P0         | I2     | Pronto         | PB-008                         |
| [PB-010](https://github.com/CaioMascarenhas/gerar-commerce/issues/10) | Implementar reserva e liberação de estoque                           | P0         | I2     | Pronto         | PB-008                         |
| [PB-011](https://github.com/CaioMascarenhas/gerar-commerce/issues/11) | Implementar carrinho e resumo da compra no Angular                   | P0         | I2     | Pronto         | PB-006                         |
| [PB-012](https://github.com/CaioMascarenhas/gerar-commerce/issues/12) | Implementar checkout com pagamento simulado e políticas do framework | P0         | I2     | Pronto         | PB-010, PB-011                 |
| [PB-013](https://github.com/CaioMascarenhas/gerar-commerce/issues/13) | Consultar pedidos, estados e resumo administrativo                   | P0         | I2     | Pronto         | PB-012                         |
| [PB-014](https://github.com/CaioMascarenhas/gerar-commerce/issues/14) | Recomendar com histórico real das compras de demonstração            | P0         | I2     | Pronto         | PB-013                         |
| [PB-015](https://github.com/CaioMascarenhas/gerar-commerce/issues/15) | Concluir seletor de features e derivação pela interface              | P0         | I3     | Pronto         | PB-004, PB-006                 |
| [PB-016](https://github.com/CaioMascarenhas/gerar-commerce/issues/16) | Validar assistente Mastra + Gemini com estoque e vendas              | P0         | I3     | Pronto         | PB-013                         |
| [PB-017](https://github.com/CaioMascarenhas/gerar-commerce/issues/17) | Concluir administração com sessão simples de demonstração            | P1         | I2     | Pronto         | PB-009, PB-013                 |
| [PB-018](https://github.com/CaioMascarenhas/gerar-commerce/issues/18) | Documentar contratos HTTP e APIs de cada serviço                     | P0         | I3     | Pronto         | PB-012                         |
| [PB-019](https://github.com/CaioMascarenhas/gerar-commerce/issues/19) | Validar as duas aplicações de ponta a ponta                          | P0         | I3     | Pronto         | PB-014, PB-015, PB-016, PB-017 |
| [PB-020](https://github.com/CaioMascarenhas/gerar-commerce/issues/20) | Validar Docker Compose e capturar serviços com portas                | P0         | I1     | Pronto         | PB-005                         |
| [PB-021](https://github.com/CaioMascarenhas/gerar-commerce/issues/21) | Redigir relatório da LPS e reunir evidências                         | P0         | I3     | Pronto         | PB-018, PB-019, PB-020         |
| [PB-022](https://github.com/CaioMascarenhas/gerar-commerce/issues/22) | Redigir relatório de reuso e documentar duas aplicações              | P0         | I3     | Pronto         | PB-018, PB-019, PB-020         |
| [PB-023](https://github.com/CaioMascarenhas/gerar-commerce/issues/23) | Congelar demonstração e ensaiar apresentação de 11/11                | P0         | I3     | Pronto         | PB-021, PB-022                 |
| [PB-024](https://github.com/CaioMascarenhas/gerar-commerce/issues/24) | Adicionar cupons como componente opcional                            | P2         | Futuro | Backlog        | PB-012                         |
| [PB-025](https://github.com/CaioMascarenhas/gerar-commerce/issues/25) | Adicionar variações de produto como feature opcional                 | P2         | Futuro | Backlog        | PB-009, PB-010                 |
| [PB-026](https://github.com/CaioMascarenhas/gerar-commerce/issues/26) | Adicionar avaliações de produtos como feature opcional               | P2         | Futuro | Backlog        | PB-013                         |

[Planejamento dos ciclos e regras de Kanban](ciclos.md).
