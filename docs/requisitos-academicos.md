# Rastreabilidade dos dois trabalhos

Fontes locais: `projeto_docs/atividade.txt`, `projeto_docs/atividadereuso.txt` e os dois modelos PDF fornecidos. Foram lidas as duas páginas de cada PDF. Não há regras comerciais específicas nesses materiais; as regras abaixo são decisões do projeto para concretizar o domínio.

## Linha de produtos — Tópico em Engenharia de Software

Entrega de PB-021: [PDF da LPS](relatorio-lps/relatorio-lps.pdf) e [fonte editável](relatorio-lps.md), de **Caio Mascarenhas Soares e Laura Marques Costa**, sem matrículas. A referência é a revisão do GitHub `5435ce33c7c0cb0f5cd226938793e771464b64a9`, com sete features core e recomendações restauradas. Os diagramas e capturas dessa referência estão em `docs/relatorio-lps/`, preservando os arquivos locais de implementação e a referência anterior do relatório de Reuso.

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

## Reuso de Software e Metodologias Ágeis

Identificação específica desta entrega: Universidade Federal de Alagoas (UFAL), Instituto de Computação, **Caio Mascarenhas Soares**, matrícula **22111481**, como único autor. O [PDF do relatório](relatorio/relatorio-reuso.pdf) inclui a marca oficial da UFAL, as 11 seções aplicáveis, diagramas e capturas. Conforme solicitação do autor, as listagens se concentram no funcionamento do framework e dos agentes Mastra, e o código completo é referenciado por links do GitHub na seção 10. A [fonte editável](relatorio-reuso.md) e o [procedimento de geração](relatorio/README.md) acompanham a entrega, registrada em PB-022 como Em revisão. A autoria individual deste relatório não altera o histórico da equipe no projeto.

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

## Revisão de escopo — 10/11

O usuário solicitou uma retirada temporária das recomendações automáticas, registrada em PB-043 e na revisão de referência do relatório de Reuso. Posteriormente, a pull request 47 e a ADR-011 restauraram o microsserviço obrigatório, e o relatório de LPS utiliza a revisão posterior `5435ce3`. O item 6.1 e PB-014 voltam a ser atendidos pelo serviço `recommendations`, que usa o histórico do comprador e as cestas da loja. Cada relatório identifica a própria referência e suas evidências. O chat opcional com Gemini permanece distinto do ranking por histórico.
