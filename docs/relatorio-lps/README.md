# Relatório de Linha de Produtos de Software

Autores: **Caio Mascarenhas Soares** e **Laura Marques Costa**, confirmados no README e no backlog da revisão do GitHub. A capa não utiliza matrículas.

- [PDF](relatorio-lps.pdf).
- [Fonte Markdown editável](../relatorio-lps.md).
- [Conteúdo de autoria](conteudo.md).
- [Gerador](gerar_relatorio.py).
- [Proveniência do GitHub](github.json).
- [Evidência sanitizada da demonstração](evidencia-lps.json).
- [Inventário de fontes e hash do PDF](fontes.json).
- [Verificações do documento](verificacao.json).

O roteiro seguido é `projeto_docs/Elementos do Relatorio do Projeto -2026-2-lps.pdf`, com seções 1 a 10 e os itens 5.1 a 5.4 e 6.1 a 6.5. Mantêm-se as preferências do autor por links do GitHub para código completo, capa institucional e sumário com links. O modelo visual segue o relatório de Reuso, mas a estrutura, a autoria e a revisão de implementação são específicas da LPS.

## Revisão da implementação

Referência fixada: `5435ce33c7c0cb0f5cd226938793e771464b64a9`, da branch `main`. As pull requests 47 e 48 restauram recomendações e acrescentam diagramas. O relatório usa sete features obrigatórias, quatro opcionais e nove contêineres. A documentação histórica que registra a retirada das recomendações é tratada como histórico, substituído pela ADR-011.

Essa referência foi lida em uma cópia isolada em `tmp/relatorio-lps/referencia/`. Não foi feito checkout ou merge sobre os arquivos locais de trabalho. O relatório de Reuso mantém sua revisão de referência e autoria individual; seu PDF não foi regenerado nesta tarefa.

## Reprodução

Usar Python 3.12 com `reportlab`, `Pillow` e `pypdf`. O gerador reutiliza os componentes de diagramação em `../relatorio/gerar_relatorio.py`, com configuração própria de capa, autores, seções, saída e diagramas.

```powershell
python docs/relatorio-lps/gerar_relatorio.py --source-root tmp/relatorio-lps/referencia
```

Para obter a revisão em uma pasta de referência, usar `git archive` da revisão fixada e extrair o conteúdo nessa pasta. O `--source-root` deve apontar para essa revisão, pois os excertos e hashes são associados a ela. O gerador usa o backlog local para refletir o estado das entregas documentais e os arquivos da referência para explicar a implementação.

O roteiro `capturar-telas.spec.ts` deve ser copiado para `frontend/e2e/report-lps.spec.ts` da cópia de referência. Executar nela:

```powershell
node .github/scripts/e2e.mjs report-lps.spec.ts --project=chromium
```

O runner cria um projeto Docker exclusivo, sem portas públicas, e remove rede, contêineres e volume próprios ao terminar. Usa apenas dados fictícios e não chama Gemini real. As imagens aprovadas ficam em `figuras/`; o JSON `evidencia-lps.json` registra as respostas usadas na validação. Não publicar arquivos de sessão, cookies, traces ou credenciais.

O ranking foi verificado com três compras aprovadas, uma recusada e um produto esgotado. As figuras de recomendações mostram separadamente visitante e comprador autenticado. A pontuação numérica da tabela do relatório é um cálculo explicativo a partir da fórmula e da massa, pois a API retorna produtos e motivos, sem expor scores.

## Revisão do PDF

As verificações incluem autores sem matrículas, seções do modelo, links externos e internos, correspondência dos excertos com a revisão, legenda das figuras, acentuação, paginação e renderização. A evidência desta tarefa não é apresentada como execução integral de todos os testes históricos do projeto.

A marca UFAL foi reutilizada do mesmo arquivo institucional verificado no relatório de Reuso. Sua procedência está na referência 13 e o arquivo conserva as proporções originais.
