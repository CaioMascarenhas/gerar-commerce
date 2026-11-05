# Backend — plataforma de lojas dinâmicas

Requisito: Node.js `>=24.15 <25` e PostgreSQL. Na raiz, `docker compose up -d postgres` inicia o banco na porta 5433. Nesta pasta:

```powershell
npm.cmd ci
npm.cmd run dev
```

O comando compila e inicia sete processos NestJS. `Ctrl+C` encerra os processos iniciados pelo script. Reinicie após alterar código. O Angular é executado separadamente em `frontend/`.

| Serviço         | Porta | Responsabilidade e dados próprios                                 |
| --------------- | ----: | ----------------------------------------------------------------- |
| gateway         |  3000 | API do frontend, sessão e autorização por loja                    |
| catalog         |  3001 | Produtos e avaliações; schema `catalog`                           |
| inventory       |  3002 | Saldos e reservas idempotentes; schema `inventory`                |
| orders          |  3003 | Cotação durável, pagamento simulado e pedidos; schema `orders`    |
| recommendations |  3004 | Consulta catálogo e histórico por APIs                            |
| ai-assistant    |  3005 | Geração de três produtos e agente administrativo                  |
| stores          |  3006 | Cadastro, composição, senha com scrypt e sessões; schema `stores` |

Somente o gateway é exposto pelo Compose. Cada serviço tem `/api/health` e `/docs`; em execução local os endereços usam `127.0.0.1`.

Configuração opcional: copie `.env.example` para `.env`. `DATABASE_URL` aponta para o PostgreSQL; `INTERNAL_API_KEY` protege mutações entre serviços. `GOOGLE_API_KEY` e `GEMINI_MODEL` habilitam Gemini. `COOKIE_SECURE=true` é destinado a execução com HTTPS; no ambiente HTTP local mantenha `false`.

Para outra faixa de portas local, defina `PORT_BASE` (por exemplo, 3200). O inicializador atribui as sete portas consecutivas e os URLs internos; ajuste também o proxy do frontend. Variáveis `*_URL` explícitas têm precedência.

O pacote `framework` controla composição e políticas. `contracts` define os tipos compartilhados. `platform` fornece HTTP, inicialização, validação e pool PostgreSQL; cada serviço declara e acessa somente as suas tabelas. Uma única instância e usuário de banco são usados na demonstração local, sem isolamento por credenciais de banco.

## Testar

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run smoke
```

O smoke cria um banco temporário com nome `gerar_smoke_<timestamp>` no servidor de `DATABASE_URL`, usa portas 3100–3106 e o remove ao terminar. Não aponta os testes para as lojas cadastradas. `SMOKE_PORT_BASE` altera a faixa de testes.

Para exportar o snapshot de uma loja existente:

```powershell
npm.cmd run derive -- minha-loja
```

Por padrão a CLI consulta o gateway em `http://127.0.0.1:3000`; `GATEWAY_URL` permite outro endereço. A exportação não cria uma implantação: a loja já é criada e recomposta pela plataforma.

Veja [contratos HTTP](../docs/api.md), [framework](../docs/framework.md) e [limites atuais](../docs/estado-atual.md).
