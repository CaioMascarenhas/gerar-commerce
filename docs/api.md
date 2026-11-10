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

`GET /stores/:slug/products` retorna os produtos ativos da loja; `GET /stores/:slug/products/:id` consulta um produto e retorna 404 se não pertence à loja. A página é `/loja/:slug/produto/:id`. `GET /stores/:slug/stock` retorna `{ productId, available }[]`. As rotas de recomendações automáticas foram removidas e retornam 404.

`POST /stores/:slug/checkout`:

```json
{
  "reference": "uma-referencia-unica-por-tentativa",
  "items": [{ "productId": "id-retornado-pelo-catalogo", "quantity": 1 }],
  "payment": "approved",
  "fulfillment": "pickup",
  "coupon": ""
}
```

Checkout exige cookie de comprador válido; sessão administrativa não autoriza compras. O serviço de pedidos obtém o ID pela sessão, ignorando `customerId` enviado pelo cliente. `payment`: `approved` ou `declined`. `fulfillment`: `pickup` ou `delivery` (exige opcional). Cupom: vazio ou código cadastrado e ativo na loja, dentro da validade e compra mínima. Os preços são consultados no catálogo, e o framework calcula desconto e entrega. Quantidades devem ser inteiras de 1 a 1000, com no máximo 30 linhas sem produtos repetidos. Falta de estoque retorna 409. Produtos de outra loja são rejeitados. A resposta contém `id`, `reference`, itens, subtotal, desconto, frete, total, status e data.

Retentativas devem usar os mesmos dados e referência; mudar a compra exige outra referência. O servidor guarda a intenção antes de reservar e devolve o mesmo pedido para uma tentativa concluída.

## Contas de compradores

Contas e sessões pertencem a uma loja. A senha usa scrypt com salt; apenas o hash do token de sessão é persistido. Cookie próprio `gerar_buyer_<slug>`, HttpOnly, SameSite=Strict e caminho `/api/stores/<slug>`, separado do administrador. Validade: sete dias. Não há confirmação de e-mail ou recuperação de senha nesta demonstração.

| Método e rota                        | Contrato                                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /stores/:slug/customers`       | `{ name, email, password }`, nome 2–80, e-mail até 254, senha 8–128 caracteres. Retorna `{ id, name, email }` e inicia sessão. E-mail duplicado na loja: 409. |
| `POST /stores/:slug/customer-login`  | `{ email, password }`, retorna perfil e cookie; credenciais inválidas: 401.                                                                                   |
| `GET /stores/:slug/customer-session` | Perfil da conta atual ou 401.                                                                                                                                 |
| `POST /stores/:slug/customer-logout` | Revoga sessão e limpa cookie.                                                                                                                                 |
| `GET /stores/:slug/customer-orders`  | Até 100 pedidos exclusivamente da conta autenticada, incluindo recusados.                                                                                     |

## Cupons cadastrados

Exigem `coupons`. Listagem e mutações exigem sessão administrativa da loja.

| Método e rota                        | Contrato                                                                                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /stores/:slug/coupons`          | Lista cupons administrativos.                                                                                                                                                                                 |
| `PUT /stores/:slug/coupons/:code`    | Cria ou atualiza `{ percentage, minimumInCents, active, expiresAt }`. Código 3–40 caracteres, letras/números/hífen/sublinhado, normalizado para maiúsculas. Percentual inteiro 1–100. Validade ISO ou `null`. |
| `DELETE /stores/:slug/coupons/:code` | Remove o código.                                                                                                                                                                                              |
| `POST /stores/:slug/coupon-quote`    | Público, `{ coupon, subtotalInCents }`; retorna cotação e percentual para a prévia da sacola. Checkout recalcula preços e valida o cupom no servidor.                                                         |

## Chat de produtos e imagens

`POST /stores/:slug/chat` exige `aiAssistant`, mas não login. Recebe `{ message, history? }`, mensagem de até 1500 caracteres e até seis mensagens anteriores `{ role, text }`. Responde `{ text, source: 'gemini', products: [{ id, name, priceInCents, url }] }`. Somente IDs existentes no catálogo da loja produzem links. O agente público não tem ferramentas de pedidos, vendas ou dados pessoais. Sem configuração: 503; falha do provedor: 502.

`GET /stores/:slug/assistant-status` exige administração e retorna `{ configured, message }` sem credenciais. O agente administrativo continua em `POST /stores/:slug/assistant`.

Fotos usam `image` e `imageFrame`; capas usam `cover` e `coverFrame`. Enquadramento: `{ fit: 'cover' | 'contain', x: 0..100, y: 0..100, zoom: 1..3 }`. A interface aceita arquivos até 2 MB e os otimiza para WebP com lado máximo de 1200 pixels. O limite total de JSON no Nginx e NestJS é 32 MB. Links precisam ser HTTPS e diretos; a prévia e a vitrine mostram fallback se não carregarem. Geração de produtos acrescenta fotos ilustrativas conhecidas do Unsplash, com `imageSource: 'illustrative'`, sem afirmar que retratam o item real.

## Avaliações e saúde

`GET /stores/:slug/reviews/:productId` e `POST` na mesma rota exigem o opcional `reviews`. A leitura é pública. A publicação recebe apenas `{ "rating": 5, "comment": "Comentário" }` e exige sessão de comprador da loja e uma compra aprovada daquele produto. Sem login: 401; sem compra aprovada: 403. O nome do autor vem da conta autenticada; `author` e `customerId` enviados no corpo são ignorados. Notas válidas de 1 a 5. Cada comprador mantém uma avaliação por produto, atualizada nas próximas publicações. As novas avaliações retornam `verifiedPurchase: true`; avaliações anteriores são preservadas sem selo. `GET /stores/:slug/review-eligibility/:productId` exige comprador e retorna `{ purchased: boolean }`. Há limite de publicações por IP.

`GET /services` agrega a saúde dos cinco serviços internos. `GET /health` informa o gateway. Cada processo também disponibiliza Swagger em `/docs`; os DTOs detalhados por endpoint ainda precisam ser ampliados para o relatório final. Os exemplos e limites deste documento descrevem a validação implementada no código.
