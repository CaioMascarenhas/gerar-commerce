# Relatório de Reuso de Software

Entrega individual de Caio Mascarenhas Soares, matrícula 22111481, UFAL/IC.

- [PDF final](relatorio-reuso.pdf).
- [Markdown editável](../relatorio-reuso.md), com explicações e trechos selecionados.
- [Conteúdo de autoria](conteudo.md), antes da expansão dos códigos e tabelas.
- [Gerador](gerar_relatorio.py), com diagramação e diagramas vetoriais autorais.
- [Inventário das fontes e integridade do PDF](fontes.json).
- [Evidência sanitizada das capturas](capturas.json).

O modelo de referência é `projeto_docs/Modelo-Relatorio-2026-2-reuso.pdf`. As 11 seções aplicáveis mantêm sua correspondência. Conforme a revisão solicitada pelo autor, o relatório utiliza apenas trechos selecionados para explicar o framework e a integração de IA com Mastra. O código completo fica nos links diretos do GitHub na seção 10. `projeto_docs/exemplo_relatorio.pdf` orientou a apresentação acadêmica: capa centralizada, sumário, tipografia serifada, seções numeradas e listagens. Seus dados, sistema e autoria não foram reutilizados.

A marca da UFAL foi baixada de fonte institucional e preservada em suas proporções. A URL do arquivo e a página de procedência constam na referência 10 do relatório. Não foi utilizada uma marca não verificada do IC.

Os materiais de Classroom mencionados no roteiro não estão disponíveis no repositório e não foram incluídos como referências consultadas. A modelagem apresentada foi construída a partir do código e dos contratos efetivos. Os estados de revisão no Kanban e as limitações de OpenAPI, IA, pagamento e infraestrutura são explicitados no relatório.

## Reprodução da diagramação

Na raiz, usar Python 3.12 com `reportlab`, `Pillow` e `pypdf`:

```powershell
python docs/relatorio/gerar_relatorio.py
```

O gerador lê o conteúdo, o backlog local, os arquivos-fonte e as capturas. Atualiza o PDF, o Markdown expandido, os SVGs e `fontes.json`. Em Windows usa Times New Roman, Arial e Consolas; em Linux usa DejaVu. Não depende de Word ou de serviço de conversão. O ambiente de autoria utilizou o Python do runtime de artefatos disponibilizado ao agente.

A revisão declarada está em `REVISION`. Antes de reutilizar o gerador após mudanças de implementação, atualizar essa revisão, revisar a redação e renovar as evidências. O documento não deve manter uma revisão antiga associada a fontes novas.

## Reprodução das capturas

O roteiro `capturar-telas.spec.ts` é um utilitário de documentação. Para executá-lo, copiá-lo temporariamente para `frontend/e2e/report.spec.ts`, onde resolve a massa compartilhada de `fixtures.ts`, e executar o runner isolado:

```powershell
Copy-Item docs/relatorio/capturar-telas.spec.ts frontend/e2e/report.spec.ts
node .github/scripts/e2e.mjs report.spec.ts --project=chromium
Remove-Item -LiteralPath frontend/e2e/report.spec.ts
```

O runner usa um projeto Compose exclusivo, sem portas publicadas, com banco, rede e volume próprios; remove esse ambiente ao final. Não executa Gemini real. As capturas ficam no diretório indicado em `frontend/.e2e-artifacts/latest.json`. Copiar somente as imagens aprovadas para `figuras/`, atualizar `capturas.json` e gerar novamente o PDF. Não copiar `storageState`, traces ou credenciais para os artefatos públicos.

`servicos-ativos.png` mostra uma resposta real de `/api/services`, formatada por indentação no navegador para melhorar a leitura; os dados não foram alterados. O PDF enquadra o seletor de features para facilitar a leitura e mantém a imagem original em disco. `compra-movel.png` provém da evidência E2E anterior de 10/11, identificada na legenda e em `capturas.json`.

## Verificação da entrega

O PDF foi renderizado em imagens de página e revisado visualmente, com inspeção ampliada de diagramas, trechos de código e capturas. Também foram conferidos autoria, seções, sumário, links, glifos e a correspondência dos trechos selecionados com os arquivos-fonte. `fontes.json` distingue os arquivos completos referenciados no GitHub dos excertos incluídos no PDF. Intermediários de revisão ficam em `tmp/relatorio/`, ignorado pelo Git.

PB-022 está em revisão para o aceite acadêmico. Não foi feita publicação, sincronização do quadro remoto ou alteração dos serviços de produção nesta entrega.
