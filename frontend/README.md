# Frontend — Angular

Interface da plataforma de criação de lojas, vitrine e painel de administração. Requisito: Node.js `>=24.15 <25`.

```powershell
npm.cmd ci
npm.cmd run dev
```

Abra http://localhost:4200. O backend precisa estar em execução na porta 3000. O proxy encaminha `/api` para o gateway; no Docker essa função pertence ao Nginx.

| Rota           | Tela                                                               |
| -------------- | ------------------------------------------------------------------ |
| `/`            | Apresentação, categorias, busca de lojas e planos fictícios        |
| `/criar`       | Cadastro em três etapas: identidade, funcionalidades e produtos    |
| `/loja/:slug`  | Loja com tema da categoria, catálogo, carrinho e checkout simulado |
| `/admin/:slug` | Login, produtos/estoque, pedidos, configurações e agente opcional  |

`src/app/routes.ts` declara as rotas. `pages/` contém as telas; `components/features.ts` é o seletor reutilizável; `models/commerce.ts` descreve os contratos HTTP e `api.ts` centraliza as chamadas. A senha não é salva no navegador; o servidor mantém uma sessão em cookie HttpOnly, limitada à loja. O carrinho fica no localStorage, com chave própria por loja.

O frontend não importa pacotes npm do backend. O cálculo exibido no cadastro serve como prévia; o servidor valida a composição, calcula o plano e usa preços oficiais no checkout.

```powershell
npm.cmd run build
```

A saída fica em `dist/browser/`. O Dockerfile compila Angular e usa Nginx com fallback para rotas como `/loja/minha-loja` e `/admin/minha-loja`. As chaves do Gemini pertencem somente ao backend.
