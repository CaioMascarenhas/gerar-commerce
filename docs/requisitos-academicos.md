# Rastreabilidade dos dois trabalhos

Fontes locais: `projeto_docs/atividade.txt`, `projeto_docs/atividadereuso.txt` e os dois modelos PDF fornecidos. Foram lidas as duas páginas de cada PDF. Não há regras comerciais específicas nesses materiais; as regras abaixo são decisões do projeto para concretizar o domínio.

## Linha de produtos — Tópico em Engenharia de Software

| Item do modelo                                   | Evidência planejada / caminho                              | Backlog                |
| ------------------------------------------------ | ---------------------------------------------------------- | ---------------------- |
| 1–4: enunciado, método ágil e técnicas de reuso  | README, gestão, arquitetura e descrição do processo        | PB-001, PB-002, PB-021 |
| 5: Product Backlog e Sprint Backlog por ciclo    | docs/gestao; issues e Project com histórico                | PB-001, PB-021         |
| 5.1: diagrama de features                        | docs/variabilidade.md                                      | PB-002                 |
| 5.2: camadas e variabilidade                     | docs/arquitetura.md e docs/variabilidade.md                | PB-002                 |
| 5.3: componentes e variabilidade                 | docs/framework.md e docs/variabilidade.md                  | PB-002                 |
| 5.4: tela de seleção e construção de produto     | Cadastro dinâmico, core marcado, opcionais e configurações | PB-015, PB-028, PB-029 |
| 6.1: microsserviços e recomendação por histórico | Serviço recommendations com histórico persistido por loja  | PB-005, PB-014         |
| 6.2–6.3: código documentado das APIs             | /docs, /docs-json e código de cada aplicação               | PB-018                 |
| 6.4: portas dos serviços em execução             | GET /api/services e captura de docker compose ps           | PB-020                 |
| 6.5: passo a passo de nova aplicação             | Cadastro /criar, docs/framework.md e snapshot por CLI      | PB-028, PB-029         |
| 7: tecnologias e bancos por serviço              | docs/arquitetura.md, schemas PostgreSQL por domínio        | PB-008, PB-021         |
| 8: telas e destaque dos microsserviços           | Roteiro e screenshots da versão final                      | PB-019, PB-021         |
| 9–10: código GitHub, execução e referências      | README e docs/referencias.md                               | PB-021                 |
| 11: vídeo de jogo                                | Não aplicável ao e-commerce                                | —                      |

## Reuso de Software e Metodologias Ágeis

| Item do modelo                                      | Evidência planejada / caminho                                               | Backlog        |
| --------------------------------------------------- | --------------------------------------------------------------------------- | -------------- |
| 1–5: enunciado, método, reuso e backlogs            | Mesmo histórico de projeto com explicação do framework                      | PB-001, PB-022 |
| 6: classe de framework e componentes com interfaces | Diagramas atual e de destino em docs/framework.md                           | PB-002, PB-022 |
| 6: Template Method e hotspots documentados          | CommerceApplication e subclasses                                            | PB-003         |
| 6: duas aplicações e implementação dos hotspots     | Exemplos EssentialStore/AssistedStore e lojas dinâmicas com ConfiguredStore | PB-004, PB-028 |
| 6: passo a passo para desenvolvedor                 | Tutorial em docs/framework.md                                               | PB-004, PB-022 |
| 6: microsserviços, APIs e portas                    | Arquitetura, OpenAPI e Compose                                              | PB-018, PB-020 |
| 7–8: tecnologias, bancos e aplicações               | Tabela por serviço + duas derivações                                        | PB-008, PB-022 |
| 9: telas e funcionamento das duas aplicações        | Demonstração completa e capturas                                            | PB-019, PB-022 |
| 10–11: GitHub, execução e referências               | README e referências                                                        | PB-022         |
| 12: vídeo de jogo                                   | Não aplicável ao e-commerce                                                 | —              |

## Regras comerciais adotadas

- Produtos físicos com identificador, nome, categoria e preço em centavos de real.
- Estoque não negativo; reserva por referência do pedido e liberação em recusa.
- Preço calculado pelo backend com os dados do catálogo; o cliente não define o total.
- Checkout com pagamento simulado e modalidade de entrega escolhida pela aplicação.
- Histórico por identificador de cliente de demonstração, suficiente para personalizar recomendações.
- Loja básica deve funcionar integralmente sem IA e sem chave do Gemini.
- IA administrativa consulta estoque e resumo de vendas via APIs, sem alterar dados.
- Cadastro dinâmico exige nome, descrição, capa, senha e pelo menos um produto; cada loja tem rotas públicas e administrativas próprias.
- Categorias Eletrônicos, Construção e Roupas variam a identidade visual. Opcionais: cupons, avaliações, entrega e agente de IA.
- Planos fictícios: R$ 59,90 com core; R$ 79,90 com opcionais sem IA; R$ 99,90 com agente, com ou sem os demais opcionais.

## Dependências documentais a obter depois

Os modelos citam o artigo de framework de pagamentos e relatórios de referência disponíveis no Classroom, mas esses arquivos não estão em `projeto_docs`. O alinhamento fino das figuras com esses exemplos depende da consulta posterior pela equipe. Não foi presumido acesso ao Classroom.
