# Backend — NestJS, microsserviços e framework

Esta pasta contém as APIs, os dados de demonstração, as regras de composição das lojas e o assistente opcional. Tem instalação própria, independente do Angular.

## Executar

Abra um terminal nesta pasta:

```powershell
npm ci
npm run dev
```

O comando compila os pacotes e os serviços e inicia o perfil Essencial. A documentação do gateway fica em http://127.0.0.1:3000/docs. O frontend é iniciado em outro terminal, dentro de `frontend/`.

Para iniciar a loja assistida:

```powershell
$env:PRODUCT_PROFILE='assistida'
npm run dev
```

Para usar Gemini, copie `.env.example` para `.env` **nesta pasta** e configure `GOOGLE_API_KEY` e `GEMINI_MODEL`. Nenhuma chave é necessária no perfil Essencial. O assistente existe como integração inicial; a validação real com Gemini permanece no backlog.

## Serviços

| Pasta em `services/` | Porta | Função atual                                                                |
| -------------------- | ----: | --------------------------------------------------------------------------- |
| `gateway/`           |  3000 | Entrada usada pelo frontend; encaminha consultas e informa o perfil da loja |
| `catalog/`           |  3001 | Lista produtos e preços de demonstração                                     |
| `inventory/`         |  3002 | Consulta saldos de demonstração                                             |
| `orders/`            |  3003 | Consulta pedidos e resumo de vendas de exemplo                              |
| `recommendations/`   |  3004 | Recomenda produtos usando o histórico de exemplo                            |
| `ai-assistant/`      |  3005 | Usa Mastra + Gemini para consultar estoque e vendas; opcional               |

Cada pasta tem seu `package.json`, código em `src/` e saída compilada em `dist/`. São processos separados. O workspace npm desta pasta compartilha a instalação das dependências entre os serviços do backend.

## Pacotes reutilizáveis

- `packages/framework/`: monta as lojas Essencial e Assistida com Template Method, validação de features e políticas de entrega.
- `packages/contracts/`: tipos públicos usados pelos serviços do backend.
- `packages/platform/`: inicialização comum do NestJS, documentação das APIs e cliente HTTP. É infraestrutura técnica, não a regra de composição da loja.
- `scripts/`: build dos serviços, inicialização, teste de integração e geração dos produtos.

NestJS e Mastra pertencem ao backend. Angular não faz parte desta instalação. O workspace interno organiza os pacotes do servidor; o frontend não é membro dele.

## Comandos

```powershell
npm run build
npm test
npm run smoke
npm run derive -- essencial
npm run derive -- assistida
```

O smoke precisa das portas 3000–3005 livres e verifica os dois perfis sem chamar o Gemini. Os produtos derivados são exportados para `output/products/` dentro do backend.

Atualmente os dados são de demonstração. PostgreSQL, carrinho, checkout completo e pagamento simulado operacional ainda serão implementados.
