# Product Backlog

Atualizado em 09/11/2026. A solicitação de cadastro dinâmico substitui o modelo de um perfil por implantação. O Kanban continua sendo o método de trabalho; os ciclos registram snapshots para o relatório.

Itens PB-028 a PB-042 foram registrados localmente. Ainda não possuem issues remotas; nenhuma sincronização com GitHub foi executada nesta alteração.

| ID                                                                    | Item                                                                 | Prioridade | Ciclo  | Estado atual | Dependências                   |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------- | ------ | ------------ | ------------------------------ |
| [PB-001](https://github.com/CaioMascarenhas/gerar-commerce/issues/1)  | Preparar monorepo, repositório, Kanban e backlogs                    | P0         | I1     | Concluído    | —                              |
| [PB-002](https://github.com/CaioMascarenhas/gerar-commerce/issues/2)  | Modelar arquitetura, features e rastreabilidade acadêmica            | P0         | I1     | Concluído    | —                              |
| [PB-003](https://github.com/CaioMascarenhas/gerar-commerce/issues/3)  | Implementar framework com Template Method e hotspots                 | P0         | I1     | Concluído    | PB-002                         |
| [PB-004](https://github.com/CaioMascarenhas/gerar-commerce/issues/4)  | Derivar duas lojas pelo mesmo framework                              | P0         | I1     | Concluído    | PB-003                         |
| [PB-005](https://github.com/CaioMascarenhas/gerar-commerce/issues/5)  | Disponibilizar microsserviços de demonstração e gateway              | P0         | I1     | Concluído    | PB-001                         |
| [PB-006](https://github.com/CaioMascarenhas/gerar-commerce/issues/6)  | Criar interface Angular para explorar loja e composição              | P0         | I1     | Concluído    | PB-004, PB-005                 |
| [PB-007](https://github.com/CaioMascarenhas/gerar-commerce/issues/7)  | Configurar CI com build, testes e smoke de integração                | P0         | I1     | Concluído    | PB-005, PB-006                 |
| [PB-008](https://github.com/CaioMascarenhas/gerar-commerce/issues/8)  | Persistir os domínios em PostgreSQL com isolamento                   | P0         | I2     | Concluído    | PB-005                         |
| [PB-009](https://github.com/CaioMascarenhas/gerar-commerce/issues/9)  | Implementar manutenção simples do catálogo                           | P0         | I2     | Concluído    | PB-008                         |
| [PB-010](https://github.com/CaioMascarenhas/gerar-commerce/issues/10) | Implementar reserva e liberação de estoque                           | P0         | I2     | Concluído    | PB-008                         |
| [PB-011](https://github.com/CaioMascarenhas/gerar-commerce/issues/11) | Implementar carrinho e resumo da compra no Angular                   | P0         | I2     | Concluído    | PB-006                         |
| [PB-012](https://github.com/CaioMascarenhas/gerar-commerce/issues/12) | Implementar checkout com pagamento simulado e políticas do framework | P0         | I2     | Concluído    | PB-010, PB-011                 |
| [PB-013](https://github.com/CaioMascarenhas/gerar-commerce/issues/13) | Consultar pedidos, estados e resumo administrativo                   | P0         | I2     | Concluído    | PB-012                         |
| [PB-014](https://github.com/CaioMascarenhas/gerar-commerce/issues/14) | Recomendar com histórico real das compras de demonstração            | P0         | I2     | Concluído    | PB-013                         |
| [PB-015](https://github.com/CaioMascarenhas/gerar-commerce/issues/15) | Criar lojas pela interface com composição dinâmica e opcionais       | P0         | I3     | Concluído    | PB-004, PB-006                 |
| [PB-016](https://github.com/CaioMascarenhas/gerar-commerce/issues/16) | Validar assistente Mastra + Gemini com estoque e vendas              | P0         | I3     | Em revisão   | PB-013                         |
| [PB-017](https://github.com/CaioMascarenhas/gerar-commerce/issues/17) | Administrar lojas com login simples por senha                        | P1         | I2     | Concluído    | PB-009, PB-013                 |
| [PB-018](https://github.com/CaioMascarenhas/gerar-commerce/issues/18) | Documentar contratos HTTP e APIs de cada serviço                     | P0         | I3     | Pronto       | PB-012                         |
| [PB-019](https://github.com/CaioMascarenhas/gerar-commerce/issues/19) | Validar as duas aplicações de ponta a ponta                          | P0         | I3     | Em revisão   | PB-014, PB-015, PB-016, PB-017 |
| [PB-020](https://github.com/CaioMascarenhas/gerar-commerce/issues/20) | Validar Docker Compose e capturar serviços com portas                | P0         | I1     | Concluído    | PB-005                         |
| [PB-021](https://github.com/CaioMascarenhas/gerar-commerce/issues/21) | Redigir relatório da LPS e reunir evidências                         | P0         | I3     | Pronto       | PB-018, PB-019, PB-020         |
| [PB-022](https://github.com/CaioMascarenhas/gerar-commerce/issues/22) | Redigir relatório de reuso e documentar duas aplicações              | P0         | I3     | Pronto       | PB-018, PB-019, PB-020         |
| [PB-023](https://github.com/CaioMascarenhas/gerar-commerce/issues/23) | Congelar demonstração e ensaiar apresentação de 11/11                | P0         | I3     | Pronto       | PB-021, PB-022                 |
| [PB-024](https://github.com/CaioMascarenhas/gerar-commerce/issues/24) | Adicionar cupons como componente opcional                            | P1         | I2     | Concluído    | PB-012                         |
| [PB-025](https://github.com/CaioMascarenhas/gerar-commerce/issues/25) | Adicionar variações de produto como feature opcional                 | P2         | Futuro | Backlog      | PB-009, PB-010                 |
| [PB-026](https://github.com/CaioMascarenhas/gerar-commerce/issues/26) | Adicionar avaliações de produtos como feature opcional               | P1         | I2     | Concluído    | PB-013                         |
| [PB-027](https://github.com/CaioMascarenhas/gerar-commerce/issues/27) | Separar frontend e backend com dependências independentes            | P0         | I1     | Concluído    | PB-001, PB-005, PB-006         |
| PB-028                                                                | Compor e persistir lojas dinâmicas por endereço                      | P0         | I2     | Concluído    | PB-003, PB-008                 |
| PB-029                                                                | Criar onboarding, rotas de loja e painel administrativo              | P0         | I2     | Em revisão   | PB-028, PB-017                 |
| PB-030                                                                | Aplicar temas de categoria e três planos fictícios                   | P0         | I2     | Concluído    | PB-028                         |
| PB-031                                                                | Gerar três produtos para agilizar o cadastro                         | P0         | I2     | Concluído    | PB-029                         |
| PB-032                                                                | Testar isolamento, persistência e retentativas de compra             | P0         | I2     | Concluído    | PB-028, PB-012                 |

PB-016 e PB-019 permanecem em revisão porque falta evidência de Gemini real e inspeção manual no navegador. O bloqueio da automação visual está registrado no snapshot. Os critérios detalhados estão em `backlog.json`.

[Snapshot da mudança](snapshots/2026-11-05-lojas-dinamicas.md).

## Evolução de compradores e experiência — 09/11/2026

**PB-041 — Concluído:** Inter nos textos e controles e Exo nos títulos, com fontes variáveis e licenças OFL servidas pela aplicação. Registrado no ciclo I3; build e arquivos públicos conferidos.

**PB-042 — Concluído:** ícones SVG originais para as três categorias, com componente reutilizável aplicado à plataforma, ao cadastro e à vitrine. Os desenhos foram inspecionados em prévia rasterizada em três tamanhos; build e publicação do sprite conferidos.

Correção posterior: **PB-039**, perfis conectados e logout independente, e **PB-040**, camadas e foco do login na finalização, implementados e em revisão visual. Seis testes de frontend e 75 verificações de integração aprovados. [Snapshot da correção](snapshots/2026-11-09-sessoes-e-foco.md).

| ID     | Item                                                | Ciclo | Estado     |
| ------ | --------------------------------------------------- | ----- | ---------- |
| PB-033 | Contas de compradores e checkout autenticado        | I3    | Concluído  |
| PB-034 | Cupons cadastrados pela loja                        | I3    | Em revisão |
| PB-035 | Chat Gemini e links individuais dos produtos        | I3    | Em revisão |
| PB-036 | Sacola flutuante, animações e acesso à própria loja | I3    | Em revisão |
| PB-037 | Fotos e ajuste de enquadramento                     | I3    | Em revisão |
| PB-038 | Validação da experiência ampliada                   | I3    | Em revisão |

Implementação e verificações automatizadas concluídas; itens com interface aguardam inspeção visual. Chat Gemini teve resposta real com link válido; o agente administrativo ainda não teve sua chamada real validada. [Evidências e limites](snapshots/2026-11-09-compradores-e-experiencia.md). Os registros históricos de PB-024 descrevem o cupom fixo inicial; PB-034 o substitui por códigos cadastrados. Nenhuma sincronização remota foi realizada.
