# Frontend — Angular

Interface da plataforma de criação de lojas, vitrine e painel de administração. Requisito: Node.js `>=24.15 <25`.

Tipografia: Inter nos textos e controles; Exo nos títulos. Fontes variáveis e licenças OFL ficam em `public/fonts/` e são servidas pela própria aplicação.

Ícones originais das categorias em `public/icons/categories.svg`, renderizados pelo componente reutilizável `CategoryIcon`: núcleo orbital para Eletrônicos, estrutura modular para Construção e tecido em movimento para Roupas. O SVG herda a cor da categoria e é usado na plataforma, cadastro e vitrine, inclusive em lojas já cadastradas. Os nomes das categorias continuam visíveis para identificação e acessibilidade.

```powershell
npm.cmd ci
npm.cmd run dev
```

Abra http://localhost:4200. O backend precisa estar em execução na porta 3000. O proxy encaminha `/api` para o gateway; no Docker essa função pertence ao Nginx.

| Rota                             | Tela                                                               |
| -------------------------------- | ------------------------------------------------------------------ |
| `/`                              | Apresentação, categorias, busca de lojas e planos fictícios        |
| `/criar`                         | Cadastro em três etapas: identidade, funcionalidades e produtos    |
| `/loja/:slug`                    | Loja com tema da categoria, catálogo, carrinho e checkout simulado |
| `/minha-loja`                    | Acesso ao painel e à vitrine pelo endereço da loja                 |
| `/loja/:slug/produto/:productId` | Página individual do produto                                       |
| `/admin/:slug`                   | Login, produtos/estoque, pedidos, configurações e agente opcional  |

`src/app/routes.ts` declara as rotas. `pages/` contém as telas; `components/` contém seletor de funcionalidades, fotos ajustáveis, diálogo de conta, foco acessível e chat de produtos; `models/commerce.ts` descreve os contratos HTTP e `api.ts` centraliza as chamadas. A senha não é salva no navegador; o servidor mantém uma sessão em cookie HttpOnly, limitada à loja. O carrinho fica no localStorage, com chave própria por loja.

O frontend não importa pacotes npm do backend. O cálculo exibido no cadastro serve como prévia; o servidor valida a composição, calcula o plano e usa preços oficiais no checkout.

```powershell
npm.cmd run build
```

A saída fica em `dist/browser/`. O Dockerfile compila Angular e usa Nginx com fallback para rotas como `/loja/minha-loja` e `/admin/minha-loja`. As chaves do Gemini pertencem somente ao backend.

Execute `npm.cmd test` para os testes de regressão de sessões, camadas e foco dos diálogos. Eles compilam componentes com o Angular e usam DOM simulado; não substituem a revisão visual em navegador. O CI executa os mesmos testes.

O cabeçalho identifica separadamente a loja e o comprador conectados, com logout próprio para cada perfil. Ao solicitar login na finalização, a sacola é pausada e retomada depois de fechar a conta, preservando os itens.

**Entrar para comprar** fica no cabeçalho principal e abre a conta de comprador na loja atual sem sair da página de produto. O parâmetro `conta=1` abre o diálogo e é removido ao fechar, permitindo novo acesso pelo mesmo botão. Sem contexto de loja, `/entrar` oferece seleção por nome ou endereço. Quando o comprador está autenticado, o botão exibe **Minha conta**.

O comprador pode navegar e montar a sacola sem login; a finalização exige conta por loja. O botão flutuante mostra a quantidade, e a sacola usa animações de entrada e saída com alternativa de movimento reduzido. O chat público aparece com o opcional de IA. Capas e produtos aceitam upload ou link direto HTTPS, com enquadramento e fallback para falhas.
