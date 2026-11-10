# Snapshot I3 — relatório de Reuso de Software

Item: **PB-022**. Estado local: **Em revisão**.

Foi produzido o relatório individual de Caio Mascarenhas Soares, matrícula 22111481, seguindo as 11 seções aplicáveis do modelo de 2026.2 e a apresentação acadêmica do exemplo fornecido. O [PDF](../../relatorio/relatorio-reuso.pdf) é acompanhado de [Markdown completo](../../relatorio-reuso.md), gerador, diagramas SVG, inventário de fontes e capturas sanitizadas.

O conteúdo abrange enunciado, Kanban, três snapshots de planejamento, 43 itens do Product Backlog, Template Method, hotspots, classes/interfaces por componente, duas subclasses e duas lojas dinâmicas, tutorial de publicação, contratos HTTP, tecnologias, telas, execução e referências. Na revisão solicitada pelo autor, as listagens integrais foram substituídas por links do GitHub, com trechos selecionados e explicações aprofundadas do framework. A seção de IA detalha Mastra, Agent, createTool, Zod, chamadas às APIs, permissões, geração inicial, chat público, ciclo administrativo e limites da integração.

Revisão de implementação: `be534c187ffa2d8baa5f21de7943fb6e406c299b`. A geração adicional de capturas usa Chromium e ambiente Compose isolado, sem Gemini real, e terminou com um roteiro aprovado. Os testes gerais são citados pelas evidências históricas de suas próprias revisões; não foram apresentados como uma nova execução integral durante a redação.

A retirada de recomendações, a exigência de compra aprovada para avaliações, o núcleo de seis features e os oito contêineres refletem a versão atual. A modelagem foi confrontada com as rotas reais; os schemas compartilham uma instância e uma credencial PostgreSQL. OpenAPI parcial, reconciliação de tentativas, emulação móvel e pagamento simulado são limites explícitos.

O PDF foi renderizado para revisão de paginação, figuras, códigos, identificação e acentuação. O inventário `docs/relatorio/fontes.json` registra hashes das fontes e do PDF. Os requisitos acadêmicos de aceite final permanecem sujeitos à revisão do relatório; PB-018, PB-019, PB-021 e PB-023 não foram encerrados por consequência. Nenhuma sincronização do Project ou publicação no GitHub foi executada nesta tarefa.
