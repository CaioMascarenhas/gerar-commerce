# Snapshot I3 — relatório de Linha de Produtos de Software

Item **PB-021**, estado local **Em revisão**. Autores: Caio Mascarenhas Soares e Laura Marques Costa, sem matrículas na capa, conforme solicitação.

A entrega segue o modelo de LPS de 2026.2: enunciado, método, reuso, desenvolvimento, backlogs, diagrama de features, camadas, variabilidade, componentes, seletor e construção de produto, microsserviços, recomendações por histórico, contratos HTTP, portas, tutorial, tecnologias, telas, execução e referências.

A referência de implementação é `5435ce33c7c0cb0f5cd226938793e771464b64a9`, lida do GitHub em cópia isolada. Ela integra as pull requests 47 e 48: sete recursos core, recomendações restauradas na porta 3004 e nove contêineres. PB-043 e os snapshots anteriores permanecem históricos. A restauração não foi atribuída a um ID PB retroativo inexistente.

O [PDF](../../relatorio-lps/relatorio-lps.pdf) é acompanhado de [Markdown](../../relatorio-lps.md), gerador, diagramas, capturas e inventário de fontes. As listagens são excertos explicativos; código completo está em links da revisão do GitHub.

A demonstração usa lojas e compradores fictícios, em projeto Compose exclusivo, sem Gemini real. As verificações cobrem seleção de sete features obrigatórias, criação de produto pela interface, plano, ranking de recomendações, exclusão de comprado e esgotado, popularidade para visitante, histórico alheio bloqueado e serviços saudáveis. Os números dos testes históricos continuam associados às suas próprias revisões.

O documento foi renderizado para inspeção de capa, autores, diagramas, códigos, links, sumário e figuras. Os hashes e resultados estão em `docs/relatorio-lps/`. O relatório de Reuso mantém sua autoria individual e a revisão já documentada; seu PDF não foi substituído. Nenhum merge ou sincronização remota de issues foi executado nesta tarefa.
