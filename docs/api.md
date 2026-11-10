# Contratos HTTP da plataforma

Todas as rotas abaixo usam o prefixo `/api` no gateway. Erros retornam status HTTP e `message` em JSON. Os métodos internos não devem ser chamados pelo navegador.

## Cadastro

`GET /features` retorna o catálogo de funcionalidades e as categorias. `GET /stores` lista até 30 lojas ativas. `GET /stores/:slug` retorna identidade e blueprint, sem senha ou sessão.

`POST /stores`:

```json
{
  "name": "Aurora Studio",
  "slug": "aurora-studio",
  "description": "Roupas para o cotidiano.",
  "cover": "https://exemplo.com/capa.jpg",
  "password": "senha-de-exemplo",
  "category": "roupas",
  "options": ["reviews", "coupons"],
  "products": [
    {
      "name": "Camiseta",
      "description": "Camiseta de algodão.",
      "priceInCents": 6990,
      "stock": 10,
      "image": ""
    }
  ]
}
```

Categorias válidas: `eletronicos`, `construcao`, `roupas`. Opcionais: `coupons`, `reviews`, `delivery`, `aiAssistant`. O core é acrescentado pelo framework. Capa obrigatória: URL HTTPS ou data URL de JPG/PNG/WebP de até 2 MB. Senha: de 6 a 128 caracteres. Cadastro: de 1 a 30 produtos; preço positivo em centavos e estoque inteiro não negativo. Slug: de 2 a 50 letras minúsculas, números e hífens, começando por letra. Um endereço já registrado retorna 409.

`POST /generate-products` recebe `{ "name": "Aurora Studio", "category": "roupas" }` e retorna `{ "source": "gemini" | "examples", "message": "...", "products": [...] }`, sempre com três produtos editáveis quando bem-sucedido. Sem chave, a origem é explicitamente `examples`. Falha do Gemini configurado retorna 502, sem fingir sucesso.

## Sessão e administração

| Método / rota por loja              | Comportamento                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `POST /stores/:slug/login`          | Recebe `{ "password": "..." }`, cria cookie HttpOnly                                |
| `GET /stores/:slug/session`         | Verifica a sessão da loja; 401 quando ausente/expirada                              |
| `POST /stores/:slug/logout`         | Revoga o token e limpa o cookie                                                     |
| `PUT /stores/:slug/settings`        | Altera nome, descrição, capa, categoria e opções; recompõe blueprint                |
| `GET /stores/:slug/orders`          | Lista até 100 pedidos da loja, com aprovação/recusa simuladas                       |
| `POST /stores/:slug/products`       | Cria produto e saldo inicial                                                        |
| `PUT /stores/:slug/products/:id`    | Altera nome, descrição, preço, imagem e saldo disponível                            |
| `DELETE /stores/:slug/products/:id` | Retira produto da vitrine; preserva histórico; último produto não pode ser removido |
| `POST /stores/:slug/assistant`      | Recebe `{ "message": "..." }`; exige login e feature `aiAssistant`                  |

Settings recebe os mesmos campos de identidade do cadastro, sem alterar slug ou senha. Produtos recebem os campos mostrados no cadastro. Cookies de outra loja não autorizam operações. Não há token público de administrador.

## Vitrine e compra simulada

`GET /stores/:slug/products` retorna os produtos ativos da loja. `GET /stores/:slug/stock` retorna `{ productId, available }[]`. `GET /stores/:slug/recommendations/:customerId` retorna `{ strategy, products }`, excluindo produtos já comprados pelo cliente nessa loja. O cliente recebe um identificador aleatório local ao navegador; não há cadastro de comprador.

`POST /stores/:slug/checkout`:

```json
{
  "reference": "uma-referencia-unica-por-tentativa",
  "customerId": "cliente-local",
  "items": [{ "productId": "id-retornado-pelo-catalogo", "quantity": 1 }],
  "payment": "approved",
  "fulfillment": "pickup",
  "coupon": ""
}
```

`payment`: `approved` ou `declined`. `fulfillment`: `pickup` ou `delivery` (exige opcional). Cupom: vazio ou `BOASVINDAS10` (exige opcional). Os preços são consultados no catálogo, e o framework calcula desconto e entrega. Quantidades devem ser inteiras de 1 a 1000, com no máximo 30 linhas sem produtos repetidos. Falta de estoque retorna 409. Produtos de outra loja são rejeitados. A resposta contém `id`, `reference`, itens, subtotal, desconto, frete, total, status e data.

Retentativas devem usar os mesmos dados e referência; mudar a compra exige outra referência. O servidor guarda a intenção antes de reservar e devolve o mesmo pedido para uma tentativa concluída.

## Avaliações e saúde

`GET /stores/:slug/reviews/:productId` e `POST` na mesma rota exigem o opcional `reviews`. A publicação recebe `{ "author": "Cliente", "rating": 5, "comment": "Comentário" }`; notas válidas de 1 a 5. Há limite de publicações por IP. Não é uma comprovação de compra.

`GET /services` agrega a saúde dos seis serviços internos. `GET /health` informa o gateway. Cada processo também disponibiliza Swagger em `/docs`; os DTOs detalhados por endpoint ainda precisam ser ampliados para o relatório final. Os exemplos e limites deste documento descrevem a validação implementada no código.
