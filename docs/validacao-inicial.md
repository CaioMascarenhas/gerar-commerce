# Validação do incremento inicial — 04/11/2026

## Executado

| Verificação                     | Resultado                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------- |
| Instalação npm e lockfile       | Dependências instaladas; versões fixadas                                         |
| Build Angular e serviços NestJS | Aprovado                                                                         |
| Testes do framework             | 5 aprovados; incluem core obrigatório, variantes, extensão ausente e duplicidade |
| Smoke de integração             | Aprovado nos dois perfis, com processos reais e comunicação pelo gateway         |
| Derivação por CLI               | Blueprints e arquivos gerados para Essencial e Assistida                         |
| Desenvolvimento local           | Angular na porta 4200 e proxy para o gateway aprovados por HTTP                  |
| YAML do Docker Compose          | `docker compose config --quiet` aprovado                                         |

O smoke verifica catálogo, estoque, histórico, recomendação personalizada/fallback, prévia de derivação, rejeição de perfil desconhecido e ausência da IA no Essencial. No Assistida, verifica serviço de IA presente, recusa sem sessão administrativa e erro 503 sem chave/modelo. Não faz chamada ao Gemini nem usa dados financeiros reais.

## Limites da evidência

- Motor Docker desligado no ambiente: containers ainda não foram construídos/executados. PB-020 permanece aberto.
- Sem chave/modelo Gemini fornecidos: execução real do agente depende de PB-016.
- Persistência e compra completa ainda não implementadas; não foram apresentadas como funcionalidades concluídas.
- Os relatórios finais e screenshots de todos os fluxos permanecem em PB-021/PB-022.

Comandos reproduzíveis e verificações adicionais estão no README. O resultado final do workflow remoto pode ser consultado na aba Actions do repositório.
