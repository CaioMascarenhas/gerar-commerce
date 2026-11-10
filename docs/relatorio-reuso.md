# Preparação do relatório de Reuso de Software e Metodologias Ágeis

## Identificação e autoria

- Instituição: Universidade Federal de Alagoas (UFAL).
- Unidade acadêmica: Instituto de Computação (IC).
- Autor único: **Caio Mascarenhas Soares**.
- Matrícula: **22111481**.
- Disciplina: Reuso de Software e Metodologias Ágeis.
- Projeto: Gerar Commerce — Framework para Sistemas de E-commerce Usando Microsserviços e Componentes de Software.
- Modelo obrigatório: [Modelo-Relatorio-2026-2-reuso.pdf](../projeto_docs/Modelo-Relatorio-2026-2-reuso.pdf), duas páginas.

A capa e a folha de identificação devem apresentar o nome da UFAL, o Instituto de Computação, o nome e a matrícula acima. Usar a marca oficial da UFAL, com proporções preservadas e legibilidade adequada. Obter o arquivo em fonte institucional e registrar sua procedência ao preparar o PDF. Caso seja utilizada também a marca do IC, aplicar o mesmo cuidado.

**Não incluir coautores neste relatório.** A composição da equipe no histórico do projeto e nos backlogs não altera essa autoria individual. Essa instrução é específica do relatório de Reuso; não pressupõe a autoria do outro relatório de Linha de Produtos de Software.

## Estrutura exigida pelo modelo

Manter a correspondência com os itens numerados do modelo, além dos elementos de identificação e sumário.

1. Enunciado do projeto e escopo do framework de e-commerce.
2. Metodologia ágil escolhida: Kanban, explicando o planejamento em ciclos.
3. Técnicas de reuso: framework, componentes e microsserviços.
4. Desenvolvimento segundo a metodologia e as técnicas escolhidas, com histórico real.
5. Product Backlog e Sprint Backlog de cada ciclo. Explicar que os snapshots dos ciclos atendem ao registro de planejamento solicitado; não declarar práticas de Scrum que não foram adotadas.
6. Arquitetura e modelagem:
   - Diagrama de classes do framework, classes dos componentes e suas interfaces.
   - Diagrama de classes de cada componente utilizado.
   - Código documentado do Template Method e dos hotspots.
   - Código documentado de duas aplicações derivadas e de suas adaptações.
   - Tutorial em código para criar outra aplicação reutilizando o framework.
   - Arquitetura de microsserviços e especificação documentada do gateway e de cada serviço.
   - Captura dos microsserviços em execução e respectivas portas.
   - Código completo de cada microsserviço em anexo, como solicitado pelo modelo. O link do GitHub complementa esse anexo.
7. Tecnologias de implementação, com linguagem e banco de dados de cada microsserviço. Distinguir schemas por domínio da implantação física compartilhada do PostgreSQL.
8. Tecnologias do framework e das aplicações construídas.
9. Funcionamento explicado por telas, destacando os microsserviços envolvidos e demonstrando duas aplicações derivadas.
10. Repositório GitHub com framework e aplicações, acompanhado de instruções reproduzíveis de execução.
11. Referências bibliográficas efetivamente utilizadas.
12. Vídeo para framework de jogos: registrar como não aplicável ao domínio de e-commerce.

## Evidências e critérios de conclusão

- Reaproveitar a rastreabilidade em [requisitos-academicos.md](requisitos-academicos.md), os diagramas e as explicações em [framework.md](framework.md) e [arquitetura.md](arquitetura.md).
- Relacionar backlogs e snapshots de [gestão](gestao/ciclos.md) ao código entregue, sem reconstruir um histórico fictício.
- Capturar telas e serviços da versão realmente validada; associar os resultados dos testes à revisão do código testado.
- Distinguir testes aprovados, testes pendentes e limitações. Não apresentar resultados E2E ainda não executados como evidência concluída.
- Usar apenas dados fictícios nas capturas e remover segredos, cookies e informações pessoais alheias ao autor.
- Conferir as referências do Classroom citadas no modelo quando estiverem disponíveis; esses materiais não constam em `projeto_docs`.
- Gerar e inspecionar visualmente o PDF final, conferindo diagramas, anexos, acentuação, paginação e identificação do autor.

Registro da solicitação: 10/11/2026. Item de entrega: **PB-022**. Este documento prepara a produção do relatório; não representa o relatório final concluído.
