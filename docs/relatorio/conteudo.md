# Gerar Commerce

Framework para sistemas de e-commerce usando microsserviços e componentes de software

Universidade Federal de Alagoas

Instituto de Computação

Disciplina: Reuso de Software e Metodologias Ágeis

Autor: Caio Mascarenhas Soares

Matrícula: 22111481

Repositório do projeto: [https://github.com/CaioMascarenhas/gerar-commerce](https://github.com/CaioMascarenhas/gerar-commerce)

Maceió, 2026

## 1 Enunciado do projeto

O Gerar Commerce é uma plataforma para criar lojas virtuais por configuração. Seu objetivo é reutilizar uma base de funcionalidades de e-commerce, permitindo que cada lojista escolha sua identidade visual, categoria e recursos opcionais. O projeto reúne um framework de domínio, componentes Angular e serviços NestJS executados em contêineres Docker. A composição é persistida no PostgreSQL e a loja fica disponível em uma rota própria.

O problema tratado é a repetição de regras e estruturas ao construir lojas semelhantes. Catálogo, estoque, sacola, pedidos, finalização e administração formam uma base comum. Cupons, avaliações, entrega local e agente de inteligência artificial são selecionados conforme a necessidade. As categorias Eletrônicos, Construção e Roupas modificam as cores e a apresentação sem duplicar as aplicações.

O lojista informa nome, descrição, capa, senha, categoria, opcionais e pelo menos um produto. Pode preencher os produtos manualmente ou solicitar três sugestões editáveis. O serviço de lojas valida esses dados e usa o framework para construir um blueprint: uma descrição da configuração e dos componentes habilitados. Depois do provisionamento de catálogo e estoque, a vitrine é publicada em `/loja/:slug`, e sua administração fica em `/admin/:slug`.

Os planos são fictícios: Essencial, por R$ 59,90 mensais, contém o núcleo; Completo, por R$ 79,90, acrescenta opcionais sem IA; Inteligente, por R$ 99,90, inclui o agente e permite os demais opcionais. Selecionar o agente determina o terceiro preço, mas não ativa automaticamente todos os outros recursos. Não há contratação, cobrança financeira ou processamento de cartão. O pagamento da compra também é simulado, com aprovação ou recusa explícita.

Este relatório apresenta modelagem e implementação de reuso, registros de planejamento, duas aplicações derivadas e o procedimento para construir outras lojas. A revisão técnica de referência é `be534c187ffa2d8baa5f21de7943fb6e406c299b`, integrada à branch principal em 10/11/2026. As capturas adicionais usam essa implementação com dados fictícios em ambiente isolado. Os trechos selecionados explicam o funcionamento do framework e a integração do agente com Mastra. O código-fonte completo é disponibilizado no GitHub, com links diretos na seção 10.

### 1.1 Escopo e restrições

A navegação é pública. Para finalizar uma compra, é necessário entrar em uma conta de comprador da própria loja. A administração utiliza a senha do estabelecimento. As sessões dos dois perfis são independentes. Recuperação de senha, confirmação de e-mail, pagamento real, emissão fiscal, integração logística e infraestrutura de produção não fazem parte da entrega.

As recomendações automáticas baseadas no histórico de compras existiram em uma revisão anterior e foram retiradas por mudança de escopo em 10/11/2026. O componente, suas rotas e seu contêiner não fazem parte da versão atual. O chat opcional de produtos com Gemini permanece e tem finalidade distinta. O backlog preserva essa evolução, sem apresentar o recurso removido como ativo.

## 2 Metodologia ágil escolhida

O desenvolvimento foi organizado com Kanban. O fluxo definido é Backlog, Pronto, Em andamento, Em revisão e Concluído. Um item pode iniciar quando descrição, dependências e critérios de aceite permitem execução e verificação. Para ser concluído, precisa da implementação aplicável, verificação, documentação coerente e evidência associada. O limite sugerido foi de dois itens em andamento e dois em revisão.

A escolha favoreceu o refinamento frequente: perfis estáticos evoluíram para cadastro dinâmico, seguido por compradores, cupons próprios e ajustes de experiência. A visualização do trabalho e as políticas explícitas são compatíveis com o Kanban Guide [1]. Não existe uma série de métricas de fluxo suficiente no repositório para calcular tempo de ciclo ou vazão de modo confiável.

Para atender à solicitação acadêmica de Product Backlog e Sprint Backlog, o planejamento foi agrupado em três ciclos. Sprint Backlog identifica os snapshots dos itens selecionados em cada período. Não representa a adoção de papéis, eventos ou compromissos formais de Scrum. Os registros permitem comparar o plano inicial com antecipações e mudanças reais.

| Ciclo | Período planejado em 2026 | Objetivo |
| --- | --- | --- |
| I1 | 04 a 05 de novembro | Fundação, framework, dois perfis e infraestrutura |
| I2 | 06 a 08 de novembro | Persistência, compra e administração |
| I3 | 09 a 10 de novembro | IA, testes em navegador, correções e relatórios |

A apresentação foi planejada para 11/11/2026. Os commits seguem Conventional Commits [2], com tipos como `feat`, `fix`, `test` e `docs`. Issues, pull requests e documentos de gestão preservam a rastreabilidade. Os estados locais da seção 5 não equivalem a uma nova sincronização do quadro remoto.

## 3 Técnicas de reuso de software utilizadas

### 3.1 Framework de domínio e Template Method

O pacote `@gerar/framework` reúne decisões reutilizáveis do domínio. A classe abstrata `CommerceApplication` concentra a construção do produto. Seu método `build()` configura a aplicação, valida restrições, registra componentes obrigatórios e opcionais, confere sua correspondência e calcula a política de entrega. As subclasses implementam os pontos de adaptação.

Essa organização aplica Template Method: a superclasse define a sequência do algoritmo e permite especializar passos específicos [3]. O reuso por herança é demonstrado por `EssentialStore` e `AssistedStore`. A composição operacional usa `ConfiguredStore`, que interpreta a definição cadastrada. As regras comuns não são copiadas para cada estabelecimento.

O fluxo de construção constitui o ponto estável por convenção. TypeScript não possui um modificador `final` que impeça toda sobrescrita de `build()`. Sua preservação depende do contrato de extensão. A implementação mantém `registerCore()` privado e os hotspots protegidos, distinguindo o núcleo dos pontos de variação.

### 3.2 Componentes e políticas

O registro de componentes relaciona cada feature ao responsável por executá-la, por meio de `ComponentDescriptor`. Ele descreve a composição; não instala plugins nem carrega código arbitrário. As implementações estão previamente disponíveis nos serviços e na interface.

As interfaces `ShippingPolicy`, `DiscountPolicy` e `PaymentProvider` permitem variar entrega, desconto e pagamento sem alterar o consumidor. `PickupShipping` oferece retirada gratuita; `FlatRateShipping` calcula R$ 15,00; `PercentageDiscount` usa o percentual do cupom persistido; `SimulatedPayment` interpreta aprovação ou recusa. `WelcomeDiscount` permanece exemplo didático de 10%, sem habilitar um cupom automático nas lojas.

Na interface, `FeaturePicker`, `ImageEditor`, `BuyerAccount`, `ShoppingChat` e `CategoryIcon` são reutilizados entre páginas e lojas. `StoreSessions` compartilha o estado de autenticação, mas a autorização efetiva permanece no backend. Contratos HTTP e tipos de dados delimitam a integração dos componentes distribuídos.

### 3.3 Microsserviços e família de produtos

Lojas, catálogo, estoque e pedidos executam em processos distintos, acompanhados por gateway e IA. A comunicação usa HTTP/JSON. A decomposição por capacidade de negócio se relaciona à arquitetura discutida por Lewis e Fowler [4]. Não são usados broker ou transportes de mensageria do NestJS.

As lojas compartilham os serviços e variam por `store_slug`. Não se cria um contêiner, banco ou build Angular por cadastro. O reuso ocorre nas bibliotecas e nas mesmas APIs consumidas por várias configurações. A família de produtos é configurada em tempo de execução, com isolamento lógico dos dados.

## 4 Desenvolvimento segundo a metodologia e as técnicas escolhidas

### 4.1 Fundação e cadastro dinâmico

O incremento de 04/11 estruturou repositório, contratos, framework e perfis Essencial e Assistida. A composição por herança demonstrou o mecanismo de reuso antes do cadastro operacional. Frontend e backend foram separados em projetos com instalações e arquivos de bloqueio próprios.

Em 05/11, o requisito evoluiu para uma plataforma na qual o lojista cadastra e publica sua loja. A ADR-009 substituiu a configuração de um perfil por implantação pela composição dinâmica. Persistência, administração, compra simulada e parte dos opcionais foram antecipadas. O snapshot dessa data registra essas mudanças, os testes executados e a revisão visual ainda pendente naquele momento.

### 4.2 Compradores e inteligência artificial

Na evolução de 09/11, compradores passaram a ter contas e sessões por loja. Pedidos passou a obter a identidade pela sessão validada, sem confiar no identificador enviado pelo navegador. Cupons configuráveis, fotos com enquadramento e chat público ampliaram os componentes. A sessão administrativa continuou separada da sessão do comprador.

Gemini foi validado com dados fictícios: consulta de estoque e vendas, geração de três produtos e chat com links locais. As evidências demonstram integração com o provedor; não garantem a disponibilidade externa nem a correção de toda resposta futura.

### 4.3 Verificação e revisão da experiência

Em 10/11, os E2E identificaram uma falha na referência de checkout em contexto HTTP sem `crypto.randomUUID()`. Foi incorporada uma alternativa com `crypto.getRandomValues()`, tratamento de falha e testes. A confirmação da compra também passou a aparecer na página individual do produto.

A revisão PB-043 corrigiu a coleção para `/loja/:slug#colecao`, retirou menus duplicados e passou a exigir compra aprovada para avaliar. O nome público da avaliação vem da conta. A mesma revisão removeu as recomendações e migrou composições antigas sem apagar cadastros. A integração terminou na pull request 46.

| Evidência versionada | Resultado e alcance |
| --- | --- |
| 2026-11-10-navegacao-avaliacoes.json | 8 testes de frontend, 15 de backend e 83 verificações de integração aprovados |
| E2E da revisão PB-043 | 15 aprovados; nenhum inesperado; 1 cenário de Gemini real ignorado na rodada sem chave |
| Navegadores | Chromium, Firefox e WebKit com emulação móvel; não substitui aparelho físico |
| 2026-11-10-e2e.json | Rodadas anteriores: 14 aprovados em cada modo, com e sem Gemini, e 1 cenário alternativo ignorado |
| 2026-11-09-gemini.json | Chamadas reais do agente e geração de produtos com dados fictícios |

Esses números pertencem às revisões registradas nas evidências. Não representam uma nova execução integral durante a redação. A rodada adicional das figuras verifica duas lojas, seus painéis, o seletor e a saúde dos serviços, sem chamar Gemini real. Tokens e credenciais não integram as capturas.

## 5 Product Backlog e Sprint Backlog

### 5.1 Product Backlog

O quadro reproduz os 43 itens do backlog local no fechamento da produção deste relatório. P0, P1 e P2 indicam prioridade, sem estimativas de esforço. Os estados distinguem implementação, revisão e aceite. PB-022 passa a Em revisão com o PDF produzido e verificado; sua entrega é registrada em um novo snapshot, sem encerrar as demais atividades acadêmicas.

{{backlog}}

PB-014 é histórico: a recomendação foi implementada e depois retirada por PB-043. PB-025 permanece evolução futura. Testes aprovados e documentação disponível não encerram automaticamente PB-018 e PB-019: o quadro conserva pendências de OpenAPI e revisão. A produção do relatório não transforma essas pendências em trabalho aceito.

### 5.2 Sprint Backlog do ciclo I1

Seleção inicial: PB-001 a PB-007 e PB-020. PB-027 acrescentou a separação dos projetos. A meta era demonstrar o framework, dois produtos e a infraestrutura. O registro de 04/11 documenta a fundação; o de 05/11 acrescenta Docker e a mudança para cadastro dinâmico.

| Itens | Resultado registrado |
| --- | --- |
| PB-001 e PB-002 | Repositório, gestão, arquitetura e rastreabilidade |
| PB-003 e PB-004 | Template Method, hotspots e dois perfis |
| PB-005 a PB-007 | Serviços, interface inicial e CI |
| PB-020 e PB-027 | Docker validado e dependências separadas |

### 5.3 Sprint Backlog do ciclo I2

A seleção inicial foi PB-008 a PB-014 e PB-017, para concluir compra persistida e administração. Em 05/11, esses trabalhos foram antecipados, juntamente com PB-024 e PB-026. PB-028 a PB-032 registraram composição dinâmica, onboarding, temas, geração e isolamento. O período planejado de I2 não corresponde à data real de toda implementação.

| Itens selecionados ou refinados | Resultado registrado |
| --- | --- |
| PB-008 a PB-010 | PostgreSQL, catálogo e reservas |
| PB-011 a PB-013 e PB-017 | Sacola, checkout, pedidos e administração |
| PB-014 | Recomendação histórica, depois retirada |
| PB-024, PB-026 e PB-028 a PB-032 | Opcionais antecipados e lojas dinâmicas; experiência parcialmente em revisão |

### 5.4 Sprint Backlog do ciclo I3

A seleção inicial incluiu PB-015, PB-016, PB-018, PB-019 e PB-021 a PB-023. PB-033 a PB-043 registraram refinamentos e correções. Os snapshots de 09 e 10/11 distinguem validação de Gemini, compradores, sessões, navegador e avaliações. PB-022 trata deste relatório, e PB-021 trata do relatório específico da LPS.

| Itens selecionados ou acrescentados | Situação evidenciada |
| --- | --- |
| PB-015 e PB-016 | Cadastro e validação do agente |
| PB-018 e PB-019 | Contratos e testes, com revisão preservada no quadro |
| PB-021 a PB-023 | Relatórios e ensaio como entregas distintas |
| PB-033 a PB-040 | Compradores, cupons, imagens, chat, sacola, perfis e foco |
| PB-041 e PB-042 | Fontes locais e ícones de categoria |
| PB-043 | Navegação, compra verificada e retirada da recomendação |

Os registros estão em `docs/gestao/ciclos.md`, `backlog.json`, `product-backlog.md` e `snapshots/`. Não foram reconstruídos tempos de execução, atribuições individuais ou cerimônias ausentes desses documentos.

## 6 Arquitetura e modelagem do sistema

### 6.1 Framework e contratos

O diagrama mostra classes efetivamente declaradas no framework. As setas com triângulo indicam generalização ou realização de interface. O registro contém descritores; o blueprint é o resultado. `ProductConfiguration`, `ComponentDescriptor` e `ApplicationBlueprint` estão em `@gerar/contracts`.

{{diagram:framework}}

O núcleo contém `catalog`, `inventory`, `cart`, `orders`, `checkout` e `administration`. Os responsáveis são, respectivamente, catálogo, estoque, frontend, pedidos, pedidos e frontend. O nome `storefront` no descritor representa a aplicação Angular; não é um sétimo processo NestJS.

| Hotspot | Contrato | Adaptação |
| --- | --- | --- |
| configure | ProductConfiguration | Identidade, features, cor e modalidades |
| shippingPolicy | ShippingPolicy | Retirada ou tarifa fixa |
| registerExtensions | Registro de descritores | IA, avaliações, cupons e entrega |
| ConfiguredStore | Construtor com StoreDefinition | Variação por dados, sem subclasse por lojista |

### 6.2 Código documentado do Template Method

`configure()` e `shippingPolicy()` são abstratos; `registerExtensions()` tem corpo vazio para permitir somente o núcleo. `build()` valida a seleção e a presença dos componentes. Uma extensão não pode registrar uma feature desabilitada. A listagem reproduz o controle e seus hotspots.

{{source:backend/packages/framework/src/core.ts|export abstract class CommerceApplication|/** Aplicação 1}}

`registerCore()` mantém o registro obrigatório. O resultado contém configuração, componentes e cotação da política. O framework não abre banco, inicia NestJS ou manipula Angular; essas dependências ficam nos consumidores.

O controle estabelece a mesma sequência para qualquer produto da família. As etapas seguintes explicam o efeito de cada chamada e a regra que ela preserva.

| Etapa de build | O que acontece | Por que é reutilizável |
| --- | --- | --- |
| configure | A subclasse fornece ProductConfiguration | A identidade e as opções variam sem copiar o algoritmo |
| validateConfiguration | Confere identificador, nome, duplicações, features conhecidas e obrigatórias, modalidades e cor | Uma aplicação inválida é rejeitada antes de produzir o blueprint |
| new ComponentRegistry | Cria um registro exclusivo para a construção | Componentes de uma composição não vazam para outra |
| registerCore | Registra os seis descritores obrigatórios | Toda loja recebe a mesma base funcional |
| registerExtensions | A subclasse registra seus opcionais | Recursos adicionais usam um ponto explícito de adaptação |
| Conferência dos componentes | Exige componente para cada feature e rejeita componentes desabilitados | Seleção e composição não podem divergir silenciosamente |
| shippingPolicy e retorno | Obtém a política e retorna configuração, componentes e frete | O consumidor recebe um contrato uniforme para qualquer variante |

Por exemplo, retirar `inventory` da configuração faz a validação falhar. Selecionar `aiAssistant` sem registrar seu componente também falha, mas na conferência de correspondência. Registrar duas vezes o mesmo ID é rejeitado por `ComponentRegistry`. Essas verificações são complementares: a configuração descreve o produto permitido, enquanto o registro comprova quais componentes foram associados a ele.

O blueprint não contém instâncias de controladores nem código executável enviado ao navegador. Ele transporta dados que orientam interface e APIs. Assim, o método de construção pode ser testado como biblioteca, sem subir NestJS, PostgreSQL ou Gemini. Os serviços consumidores continuam responsáveis por executar as funcionalidades registradas.

### 6.3 Duas aplicações construídas por herança

As subclasses abaixo reutilizam `build()`. `EssentialStore` adapta configuração e retirada. `AssistedStore` altera identidade e entrega e registra IA. Nenhuma copia o controle ou os serviços.

{{source:backend/packages/framework/src/core.ts|/** Aplicação 1|export function deriveProduct}}

`AssistedStore` usa tarifa fixa diretamente como exemplo de especialização, mas seu perfil didático registra apenas IA. Ele não equivale à seleção dinâmica de `delivery`. Nas lojas operacionais, o opcional define a política e o checkout confere sua habilitação.

Após instalar dependências e compilar os pacotes, é possível examinar os perfis no backend:

```javascript
// Salvar em backend/inspecionar.mjs e executar node inspecionar.mjs
import { deriveProduct } from '@gerar/framework';
console.log(JSON.stringify(deriveProduct('essencial'), null, 2));
console.log(JSON.stringify(deriveProduct('assistida'), null, 2));
```

Na versão atual, `npm run derive -- <slug>` exporta uma loja já cadastrada. Não publica uma loja nem recebe nomes de perfis estáticos como modo de geração.

### 6.4 Composição operacional das duas lojas

`ConfiguredStore` recebe `StoreDefinition` e interpreta categoria e opcionais nos hotspots. `composeStore()` acrescenta plano e tema. O trecho abaixo é usado pelo serviço de lojas no cadastro e nas configurações.

{{source:backend/packages/framework/src/dynamic.ts|export class ConfiguredStore|export interface DiscountPolicy}}

As telas da seção 9 demonstram uma loja essencial de Eletrônicos e uma inteligente de Roupas. As definições equivalentes abaixo explicitam sua variação. O cadastro real também inclui descrição, capa, senha e produtos para provisionamento.

```typescript
import { composeStore } from '@gerar/framework';
// Aplicação A: seis features obrigatórias e tema azul.
const essencial = composeStore({
  slug: 'aurora-eletronicos', name: 'Aurora Eletrônicos',
  category: 'eletronicos', options: [],
});
// Plano: 5990 centavos; retirada; sem opcionais.

// Aplicação B: mesmo núcleo, com agente e chat.
const inteligente = composeStore({
  slug: 'aurora-roupas', name: 'Aurora Roupas',
  category: 'roupas', options: ['aiAssistant'],
});
// Plano: 9990 centavos; tema rosa; retirada.
```

No cadastro, `stores` monta uma `StoreDefinition` com os dados validados e chama `composeStore()`. O resultado combina o blueprint de `build()`, o plano calculado e o tema. Essa composição é persistida junto da identidade da loja. Ao salvar configurações, o serviço a recompõe com a mesma função. O endereço continua fixo; as opções e a categoria podem mudar.

O Angular consulta essa definição para aplicar cores, apresentar a seleção e disponibilizar os controles pertinentes. As APIs também verificam a opção habilitada: ocultar um botão não é a regra de autorização. Por exemplo, selecionar `aiAssistant` associa o componente ao serviço de IA, mas a rota ainda precisa verificar a loja, a sessão quando administrativa e a configuração do provedor.

| Opcional | Registro em ConfiguredStore | Comportamento efetivo |
| --- | --- | --- |
| coupons | Serviço orders | Consulta cupom persistido e aplica PercentageDiscount no checkout |
| reviews | Serviço catalog | Consulta avaliações e exige conta com compra aprovada para publicar |
| delivery | Serviço orders | Habilita entrega e escolhe FlatRateShipping, com R$ 15,00 |
| aiAssistant | Serviço ai-assistant | Habilita chat e agente administrativo, condicionado ao Gemini configurado |

As políticas são aplicadas em momentos diferentes. `build()` calcula a tarifa da política de entrega. Depois, `quoteCheckout()` decide se há frete para a modalidade escolhida, valida o cupom recebido do domínio de pedidos e calcula o total em centavos. `SimulatedPayment` interpreta o resultado simulado. Portanto, o framework participa da construção da loja e do cálculo da compra; não se limita a produzir uma descrição visual.

Como exemplo, uma loja com `coupons` e `delivery` pertence ao plano Completo, por R$ 79,90. Em uma compra de R$ 100,00, um cupom válido de 10% e a entrega de R$ 15,00 produzem R$ 105,00. Se a opção `delivery` for retirada, uma tentativa de finalizar com entrega será rejeitada. Se o cupom estiver expirado ou não existir na definição consultada, não há desconto autorizado.

### 6.5 Tutorial para criar outra aplicação

Primeiro, importa-se a API do framework e define-se o produto. Uma loja de Construção com cupons e entrega usa componentes existentes, sem alterar a classe base:

```typescript
import { composeStore, quoteCheckout } from '@gerar/framework';
const loja = composeStore({
  slug: 'casa-nova', name: 'Casa Nova Construção',
  category: 'construcao', options: ['coupons', 'delivery'],
});
const cotacao = quoteCheckout(
  loja, 10000, 'OBRA10', 'delivery',
  { code: 'OBRA10', percentage: 10, minimumInCents: 0,
    active: true, expiresAt: null },
);
// 10000 - 1000 + 1500 = 10500 centavos.
```

Segundo, a publicação efetiva ocorre pelo cadastro. O exemplo seguinte pode ser executado no console do navegador aberto na plataforma. Uma capa simples é criada em PNG pelo canvas. A senha é exclusivamente ilustrativa.

```javascript
const canvas = document.createElement('canvas');
canvas.width = 800; canvas.height = 500;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#fff3df'; ctx.fillRect(0, 0, 800, 500);
ctx.fillStyle = '#b45309';
ctx.font = 'bold 48px sans-serif';
ctx.fillText('Casa Nova Construção', 110, 260);
const resposta = await fetch('/api/stores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    slug: 'casa-nova', name: 'Casa Nova Construção',
    description: 'Materiais para pequenos projetos.',
    cover: canvas.toDataURL('image/png'),
    password: 'exemplo-academico-2026',
    category: 'construcao', options: ['coupons', 'delivery'],
    products: [{ name: 'Kit de ferramentas',
      description: 'Produto fictício de demonstração.',
      priceInCents: 12990, stock: 10, image: '' }],
  }),
});
const resultado = await resposta.json();
if (!resposta.ok) throw new Error(resultado.message);
location.assign('/loja/' + resultado.slug);
```

Terceiro, entra-se em `/admin/casa-nova` com a senha e cadastra-se OBRA10 no painel. O objeto de cupom do primeiro trecho demonstra somente o cálculo isolado: o checkout consulta o cupom persistido. A compra exige conta de comprador, produto existente e estoque disponível.

Uma categoria nova exige ampliar `categories` e a apresentação no frontend. Uma feature inédita exige também contrato, catálogo, validação, registro, comportamento no serviço, guardas e testes. Acrescentar um descritor não implementa a funcionalidade. Para especializar por código, uma subclasse implementa os hotspots e pode retornar outra política que satisfaça `ShippingPolicy`, preservando o controle de `build()`.

### 6.6 Classes e interfaces de cada componente

O registro liga a composição abstrata aos componentes implementados. A figura explicita essa ligação: os descritores indicam o serviço responsável, enquanto as instâncias dos controladores são criadas pelo NestJS em processos próprios. O framework não instancia esses controladores.

{{diagram:composition}}

As interfaces de políticas são tipos TypeScript reais. Elas permitem variar o comportamento mantendo uma operação estável para o consumidor.

{{diagram:policies}}

Nos diagramas distribuídos, “contrato HTTP” identifica uma interface de comunicação documentada, não uma interface TypeScript adicional. Controladores e tipos usam nomes reais. A persistência usa funções de `platform`; não existem classes de repositório ou entidades ORM implícitas nesses desenhos.

{{diagram:stores}}

`StoresController` controla cadastro, composição, ativação e sessão administrativa. Registra a loja inativa, provisiona catálogo e estoque e então a ativa. Em falha, tenta compensar os dados. `CustomersController` gerencia compradores e sessões. `ConfiguredStore` mantém as regras de composição no framework.

{{diagram:catalog}}

`CatalogController` gerencia produtos e avaliações. A elegibilidade consulta a identidade em lojas e a compra aprovada em pedidos. Cada comprador mantém uma avaliação por produto, atualizável. Registros legados permanecem sem selo de compra verificada. A exclusão de produto é lógica para preservar o histórico.

{{diagram:inventory}}

`InventoryController` oferece saldos, ajuste, reserva, confirmação e liberação. Reserva usa transação, atualização condicional e referência por loja. A restrição `available >= 0` complementa a validação. Confirmar ou liberar uma referência repetida é idempotente. O ajuste administrativo informa diretamente o saldo disponível; não há reconciliação adicional de reservas nesse endpoint.

{{diagram:orders}}

`OrdersController` coordena preços, composição, cupom, entrega, pagamento e estoque. `CouponsController` mantém códigos por loja. O checkout registra a intenção antes da reserva e usa lock por referência. Repetir uma compra concluída devolve o mesmo pedido; referência igual com conteúdo diferente é rejeitada. Não há transação distribuída única entre domínios.

{{diagram:assistant}}

`AssistantController` usa `Agent` e `createTool` do Mastra. A geração inicial devolve três produtos ou exemplos explicitamente identificados sem chave. O chat público recebe catálogo e saldos, sem ferramentas de vendas ou dados pessoais. O servidor filtra IDs antes de montar links. O agente administrativo consulta estoque e pedidos somente da loja associada. A documentação do Mastra fundamenta agentes e ferramentas [5].

{{diagram:gateway}}

`GatewayController` centraliza as rotas do navegador, cookies por loja, limites por IP e a verificação administrativa. `callService()` acrescenta credencial interna e timeout. Os domínios também validam operações relevantes, como identidade no checkout e compra aprovada para avaliar.

{{diagram:frontend}}

No Angular, `FeaturePicker` é reutilizado em cadastro e configurações; `ImageEditor` e `CommerceImage` compartilham enquadramento e exibição. `ShoppingChat` e `BuyerAccount` atendem as vitrines parametrizadas. `StoreSessions` compartilha sessões confirmadas pela API. A decomposição segue o modelo de componentes do Angular [6].

### 6.7 Arquitetura de microsserviços e persistência

{{diagram:architecture}}

Nginx entrega o Angular na porta 4200 e encaminha `/api` ao gateway. O gateway distribui chamadas aos cinco serviços internos. Lojas provisiona catálogo e estoque; pedidos consulta lojas e catálogo e coordena reservas; IA consulta domínios e Gemini. Os serviços se comunicam por HTTP/JSON.

Há uma instância física de PostgreSQL 17 e um usuário compartilhado. Os schemas `stores`, `catalog`, `inventory` e `orders` separam os domínios. Cada serviço consulta seu schema e usa API para os demais. A separação é lógica, sem barreira de credencial por serviço. Schemas são espaços de nomes, e seus privilégios dependem da configuração do PostgreSQL [7].

| Schema | Tabelas principais | Dados |
| --- | --- | --- |
| stores | shops, sessions, customers, customer_sessions | Lojas, contas e sessões |
| catalog | products, reviews | Produtos e avaliações |
| inventory | stock, reservations | Saldos e reservas |
| orders | purchases, attempts, coupons | Pedidos, tentativas e cupons |

O volume `commerce-data` preserva o banco ao recriar contêineres. A remoção explícita do volume apaga os dados e não integra o uso normal. A sacola usa `localStorage` por loja no navegador; não existe tabela de carrinho no servidor.

### 6.8 Especificação documentada da API gateway

Todas as rotas usam `/api`. O gateway recebe JSON e preserva os erros dos serviços. A tabela apresenta o contrato público; a implementação completa pode ser consultada no GitHub pela seção 10. Swagger está em `/docs` de cada processo, com DTOs ainda parcialmente detalhados. Na tabela, `L` abrevia `/stores/:slug`, apenas para leitura.

{{gateway-api}}

Slugs têm de 2 a 50 caracteres, começam por letra e usam minúsculas, números e hífens. Valores monetários são centavos inteiros. Checkout recebe de 1 a 30 linhas, quantidade de 1 a 1000 e referência de até 80 caracteres. Preços, plano e identidade enviados pelo navegador não são autoridade para o servidor.

A entrada de checkout extrai o token do cookie de comprador e o encaminha ao serviço de pedidos, que valida a sessão no serviço de lojas. O Angular não lê esse cookie HttpOnly; o navegador o envia na mesma origem. Esse contrato permite reutilizar o cálculo do framework sem confiar em identidade ou preço fornecidos pelo cliente.

Erros relevantes: 400 para dados inválidos; 401 para sessão inválida; 403 para operação ou feature não autorizada; 404 para recurso inexistente; 409 para conflito como estoque insuficiente; 429 para limite por IP; 502 ou 503 para falha ou indisponibilidade de dependência. IA sem configuração retorna 503; falha de provedor retorna 502.

### 6.9 Especificação de cada microsserviço

As rotas internas também têm `/api` e exigem `x-service-key`. Aqui, `S` abrevia `/internal/stores/:slug`. Os endpoints diretos não são publicados no host pelo Compose. O bootstrap comum configura prefixo, JSON, origem, chave interna e Swagger.

{{service-api}}

A publicação de avaliações no catálogo usa a rota interna, protegida pela chave de serviço. O gateway injeta o token do comprador; o controlador valida a conta e a compra pelas APIs de lojas e pedidos. A tabela descreve os caminhos efetivos. Os links da seção 10 permitem consultar os controladores e os auxiliares compartilhados diretamente no código-fonte.

### 6.10 Serviços em execução e portas

{{image:servicos-ativos.png|Resposta real de /api/services em 10/11/2026, com JSON formatado para leitura no navegador. Os cinco serviços internos responderam com status ok e suas portas.|380}}

O gateway é o sexto processo NestJS: recebe a consulta e agrega as cinco respostas. A implantação tem oito contêineres: seis NestJS, Nginx/Angular e PostgreSQL. A tabela distingue portas internas e publicadas.

| Processo | Porta interna | Porta padrão no host |
| --- | --- | --- |
| Angular em Nginx | 80 | 4200 |
| Gateway | 3000 | 3000 |
| Catálogo | 3001 | Não publicada |
| Estoque | 3002 | Não publicada |
| Pedidos | 3003 | Não publicada |
| IA | 3005 | Não publicada |
| Lojas e contas | 3006 | Não publicada |
| PostgreSQL | 5432 | 5433 em 127.0.0.1 |

A porta 3004 ficou livre após a remoção de recomendações. No desenvolvimento local, as portas dos serviços são usadas diretamente. `FRONTEND_PORT`, `GATEWAY_PORT` e `POSTGRES_PORT` ajustam a publicação sem mudar a comunicação interna.

### 6.11 Integração da inteligência artificial com Mastra

O framework da família decide quando a feature `aiAssistant` faz parte da loja. Mastra implementa a interação com o modelo dentro do serviço de IA. São responsabilidades diferentes: `ConfiguredStore` compõe o produto; a classe `Agent`, de `@mastra/core/agent`, recebe instruções, modelo e ferramentas e executa a geração. Gemini fornece o modelo de linguagem. NestJS continua responsável pelas rotas HTTP e pelo tratamento das requisições.

Na versão entregue, a dependência é `@mastra/core` 1.82.0. O serviço importa `createTool` de `@mastra/core/tools` e usa Zod para declarar entradas das ferramentas. Não existe um servidor Mastra separado: a biblioteca é utilizada diretamente no processo NestJS da porta 3005. A documentação oficial apresenta agentes como consumidores de modelos e ferramentas [5] e descreve ferramentas como operações de código acessíveis ao agente [13].

O sistema possui três usos de IA. Eles compartilham o provedor, mas recebem contextos e permissões diferentes.

| Uso | Entrada e contexto | Saída e acesso |
| --- | --- | --- |
| Geração no cadastro | Nome e categoria da futura loja | Três rascunhos editáveis; disponível no onboarding antes de existir uma loja |
| Consultor público | Mensagem, histórico curto, catálogo e disponibilidade da loja | Texto e links locais; exige aiAssistant, sem login de comprador |
| Agente administrativo | Pergunta do lojista e ferramentas de estoque e pedidos | Resposta textual sobre a própria loja; exige sessão administrativa e aiAssistant |

Cada operação cria uma instância de `Agent` no atendimento da requisição. Não há memória persistente de Mastra, índice vetorial, RAG, workflow cadastrado ou coordenação entre múltiplos agentes nessa implementação. O chat público envia seu histórico recente no próprio contexto, e a pergunta administrativa é processada com os dados obtidos pelas ferramentas daquela chamada.

#### 6.11.1 Ferramentas do agente administrativo

Uma ferramenta combina identificação, descrição, contrato de entrada e uma função de execução. O modelo recebe a descrição para decidir quando solicitá-la; o código executa a operação permitida. No projeto, `stock` consulta produtos e saldos; `sales` consulta os pedidos simulados. O trecho abaixo contém as definições efetivamente utilizadas.

{{source:backend/services/ai-assistant/src/main.ts|    const stock = createTool({|    const agent = new Agent({}}

`z.object({})` declara que a ferramenta não precisa receber parâmetros de negócio. O `slug` é capturado no contexto da requisição, e não escolhido pelo modelo. A função `execute` constrói os caminhos das APIs com esse valor. O agente não recebe uma ferramenta de SQL, uma URL arbitrária ou uma operação de alteração de estoque. A chave interna permanece no cliente HTTP do backend.

| Campo de createTool | Função no projeto |
| --- | --- |
| id | Nome estável da operação, como estoque-da-loja |
| description | Explica ao modelo quando consultar a ferramenta e seu escopo |
| inputSchema | Valida a entrada; objeto vazio porque a loja já está definida no servidor |
| execute | Consulta APIs reais e devolve dados para a geração da resposta |

O método de pedidos retorna até 100 registros recentes, incluindo aprovações e recusas. Uma análise de vendas aprovadas precisa distinguir o status `paid`. A ferramenta não fornece uma estatística global de todo o histórico quando houver mais de 100 pedidos; esse limite deve ser considerado ao interpretar a resposta. O agente auxilia a leitura dos dados retornados, sem substituir uma rotina contábil determinística.

#### 6.11.2 Criação do Agent e ciclo de execução

Depois de definir as ferramentas, o serviço constrói o agente e informa o modelo no formato `google/<modelo>`. As instruções exigem português brasileiro, consulta de ferramentas, valores em centavos e reconhecimento do pagamento simulado. O ID utiliza a loja para identificar a instância; esse ID, isoladamente, não é uma barreira de autorização.

{{source:backend/services/ai-assistant/src/main.ts|    const agent = new Agent({|    try {|  @Post('stores/:slug/query')}}

O controlador executa a geração e devolve `response.text` ao frontend. O limite de quatro passos controla o ciclo da execução; não significa quatro ferramentas obrigatórias nem quatro perguntas ao usuário [14].

```typescript
// Chamada efetiva no controlador; message já foi validada.
const response = await agent.generate(message, { maxSteps: 4 });
return { text: response.text, source: 'gemini' };
```

Para uma pergunta como “Quais produtos têm poucas unidades e como estão as vendas aprovadas?”, o fluxo esperado é: gateway valida a sessão administrativa; o serviço confirma a feature e a configuração; Gemini interpreta a pergunta e pode solicitar `stock` e `sales`; Mastra executa as funções; o modelo recebe os resultados e gera o texto. A ordem e o conjunto de chamadas são decididos durante a execução, conforme a pergunta e o modelo. A aplicação não codifica a obrigação de chamar ambas em toda mensagem.

{{diagram:mastra}}

O gateway limita essa rota por IP e encaminha somente chamadas administrativas autenticadas. A operação interna também exige a chave entre serviços. As ferramentas ficam restritas às APIs de leitura da loja capturada. A autorização é aplicada por esses mecanismos de aplicação, não pela obediência do modelo às instruções.

#### 6.11.3 Consultor público e construção de links

O chat público segue outro fluxo. Antes de chamar o modelo, o serviço consulta catálogo e estoque e monta uma lista com ID, nome, descrição, preço em centavos e saldo. Esse contexto é enviado como JSON juntamente com a mensagem e até seis entradas anteriores. Cada mensagem atual tem limite de 1.500 caracteres; cada entrada de histórico, de 3.000. Não são registradas ferramentas de pedidos ou vendas nesse agente.

As instruções pedem uma resposta JSON com `text` e `productIds`. A aplicação remove cercas Markdown quando presentes, faz `JSON.parse`, valida o texto e a lista e cruza os IDs com o catálogo consultado. Somente os produtos encontrados, limitados a seis, geram links locais no formato `/loja/:slug/produto/:id`. URLs produzidas livremente pelo modelo não são utilizadas como destino dos cartões.

```typescript
// Estrutura solicitada ao modelo; exemplo ilustrativo de conteúdo.
{ text: 'Encontrei uma opção dentro do seu orçamento.',
  productIds: ['id-existente-no-catalogo'] }

// Depois da validação, o servidor constrói o link do cartão.
url: '/loja/' + slug + '/produto/' + encodeURIComponent(product.id)
```

Esse processamento é validação posterior a uma saída textual. O serviço não usa a opção de saída estruturada de Mastra para impor um schema ao modelo. Uma resposta JSON inválida gera erro de integração. Filtrar IDs evita cartões para produtos inexistentes, mas não comprova a correção de toda afirmação no texto livre.

#### 6.11.4 Geração de produtos no cadastro

O gerador recebe o nome e uma das três categorias. Seu `Agent` solicita exatamente três produtos fictícios com nome, descrição, preço inteiro em centavos, estoque e imagem vazia. A resposta é interpretada como JSON; o servidor exige três itens e passa cada um pela validação `productInput()`. Em seguida, acrescenta imagens ilustrativas conhecidas por `withIllustration()`.

As fotos não são geradas pelo modelo e não comprovam correspondência com o item sugerido. O resultado volta como rascunho para o formulário: o usuário pode revisar, editar ou substituir antes de cadastrar a loja. A geração não cria o estabelecimento, não publica produtos por conta própria e não exige que o futuro lojista selecione o agente como opcional para usar o auxílio inicial.

Quando não há chave ou modelo configurado, esse fluxo devolve três exemplos locais com `source: 'examples'` e mensagem explícita. Quando Gemini está configurado e falha, o serviço retorna erro, sem trocar silenciosamente uma resposta real por exemplos. Nos chats público e administrativo, a ausência de configuração gera indisponibilidade, pois não há uma conversa simulada de substituição.

#### 6.11.5 Configuração operacional e limites

`GOOGLE_API_KEY` e `GEMINI_MODEL` são lidas no backend. `configured()` verifica apenas a presença dos dois valores; não executa uma validação antecipada de credencial, quota ou acesso ao modelo. Uma configuração preenchida ainda pode falhar durante `generate()`. O endpoint de status informa presença de configuração sem devolver segredos. A seção 10 explica como recriar o contêiner após alterar o ambiente.

`callService()` aplica timeout de 60 segundos à comunicação com IA e 15 segundos aos demais domínios. O retorno do agente é aguardado e enviado como uma resposta JSON; não há streaming de tokens no frontend. O painel exibe a resposta recebida e envia somente a pergunta atual em cada consulta administrativa. Não há memória persistente configurada no Mastra nem contexto de perguntas anteriores nesse fluxo.

As consultas das ferramentas são de leitura, mas os dados são encaminhados ao provedor para elaboração da resposta. O chat público recebe somente o contexto de produtos; o agente administrativo pode receber os campos devolvidos pelas APIs de pedidos. Não existe, nessa ferramenta, uma etapa adicional de anonimização ou redução explícita desses documentos. A demonstração com Gemini utiliza dados fictícios.

As instruções para tratar entradas como dados ajudam a orientar o comportamento, porém não constituem uma garantia contra manipulação por prompt. O escopo fixado nas funções, as guardas de acesso e a validação de links são controles concretos da implementação. Não foram implantados filtros adicionais de conteúdo, auditoria persistente de chamadas ou avaliação contínua de qualidade no Mastra.

#### 6.11.6 Uso e evidências verificadas

Para usar o agente, o lojista habilita `aiAssistant` nas configurações, entra no painel e abre o agente. Perguntas objetivas, como “Liste os produtos e seus saldos” e “Considere apenas pedidos aprovados e informe o total em reais”, tornam a finalidade da consulta mais clara. O comprador usa o botão do consultor na vitrine para comparar produtos da própria loja e abrir os cartões retornados.

A evidência `2026-11-09-gemini.json` registra resposta real do agente com Módulo Aurora, oito unidades, e Sensor Horizonte, três unidades, além de um pedido aprovado e total de 12.345 centavos. O chat retornou um link pertencente ao catálogo fictício e a geração produziu três rascunhos. Esses resultados foram comparados com a massa do teste. Eles validam esses cenários, sem constituir medição ampla de acurácia, latência ou custo.

## 7 Tecnologias da implementação com microsserviços

Os serviços usam TypeScript em Node.js 24. O intervalo de `engines` exige Node a partir de 24.15 e anterior a 25. NestJS organiza controladores e módulos HTTP [8]. As versões abaixo são declaradas pelo projeto, não recomendações de atualização automática.

| Serviço | Linguagem e estrutura | Banco e acesso |
| --- | --- | --- |
| gateway | TypeScript, NestJS 12.3.3 | Sem banco próprio; limites em memória |
| stores | TypeScript, NestJS 12.3.3, crypto scrypt | PostgreSQL 17, schema stores, pg |
| catalog | TypeScript, NestJS 12.3.3 | PostgreSQL 17, schema catalog, pg |
| inventory | TypeScript, NestJS 12.3.3 | PostgreSQL 17, schema inventory, transações |
| orders | TypeScript, NestJS 12.3.3 | PostgreSQL 17, schema orders, JSONB e locks |
| ai-assistant | TypeScript, NestJS 12.3.3, Mastra 1.82.0 e Zod 4.6.7 | Sem banco próprio; APIs e Gemini externo |

O driver `pg` mantém o pool. Migrações SQL idempotentes criam e adaptam tabelas durante a inicialização. Não há ORM. JSONB armazena configurações e documentos de produto/pedido, combinado com chaves e restrições relacionais. O isolamento de lojas é aplicado pelo identificador do estabelecimento em cada operação.

Docker Compose define imagens, rede, saúde, ambiente e volume, permitindo reproduzir a composição declarada [9]. O backend usa Node 24; o banco, `postgres:17-alpine`; o frontend é compilado e servido em Nginx. O CI verifica builds, testes e documentos e executa E2E sem chave real por padrão.

## 8 Tecnologias do framework e das aplicações

O framework usa TypeScript 6.0.3 e módulos ECMAScript. `contracts` reúne tipos; `framework`, composição e políticas; `platform`, bootstrap, HTTP, validação e banco. Workspaces locais permitem compartilhar a implementação sem copiar regras entre processos.

O frontend usa Angular 22.2.4, CLI/build 22.2.6, RxJS 7.8.2, formulários, roteamento, componentes standalone e signals. Inter e Exo são fontes locais com licenças versionadas. Os ícones SVG de categoria são próprios. Eletrônicos usa azul; Construção, âmbar; Roupas, rosa.

| Camada | Reuso aplicado | Localização |
| --- | --- | --- |
| Contratos | Configuração, features e descritores | backend/packages/contracts/src |
| Framework | Template Method, subclasses e políticas | backend/packages/framework/src |
| Infraestrutura | HTTP, bootstrap, banco e validação | backend/packages/platform/src |
| Serviços | Mesma API para várias lojas | backend/services/*/src |
| Interface | Páginas e componentes parametrizados | frontend/src/app |
| Verificação | Regras, integração e navegador | packages/*/test, scripts/smoke.mjs e frontend/e2e |

As variantes são configurações persistidas, renderizadas pelo mesmo Angular. O snapshot exportado permite examinar a composição sem senha ou sessão. O reuso reduz duplicação e exige que todas as operações preservem o escopo da loja.

## 9 Funcionamento e aplicações derivadas

### 9.1 Plataforma e cadastro

{{image:plataforma.png|Plataforma com lojas fictícias. Angular consulta o gateway, que obtém os cadastros ativos no serviço stores.|310}}

A página inicial oferece categorias, busca e planos. Em `/criar`, o lojista preenche identidade, capa e senha. O seletor mantém o núcleo marcado e permite escolher os opcionais. O preço é uma prévia: o servidor recalcula o plano.

{{image:selecao-features.png|Seletor do cadastro com o núcleo obrigatório e os quatro opcionais. Selecionar IA determina o preço de R$ 99,90.|360}}

A etapa de produtos exige ao menos um item válido. A geração consulta IA pelo gateway e devolve três rascunhos. Sem chave, a origem é identificada como exemplos; uma falha do provedor configurado não é apresentada como sucesso. Fotos sugeridas são ilustrativas.

Ao concluir, lojas compõe o blueprint, persiste o cadastro inativo, provisiona produtos e saldos e então ativa a loja. Senhas usam hash scrypt com salt; somente hashes dos tokens de sessão são persistidos. O endereço se mantém nas alterações de identidade e opções.

### 9.2 Aplicação A com plano Essencial

A aplicação A tem seis features e plano de R$ 59,90. O comprador consulta produtos, abre detalhes e usa a sacola. A modalidade é retirada. Cupons, avaliações, entrega e IA não estão habilitados por essa configuração.

{{image:essential-vitrine.png|Aplicação essencial de Eletrônicos, com options vazio. Reutiliza o núcleo e o tema azul sem chat opcional.|310}}

{{image:essential-admin.png|Painel essencial. O gateway reúne dados de lojas, catálogo, estoque e pedidos para a interface administrativa.|310}}

Após login em `/admin/:slug`, o lojista administra produtos, saldos, pedidos e configurações. O plano vem do blueprint do servidor. A mesma estrutura atende outras lojas, com controles condicionados às opções. Remover um produto preserva o histórico; o último produto ativo não pode ser excluído.

### 9.3 Aplicação B com plano Inteligente

A aplicação B usa Roupas e `aiAssistant`. Tema rosa e acesso ao chat diferenciam a vitrine. Seu plano é R$ 99,90. O chat consulta catálogo e disponibilidade da loja e pode devolver links existentes. Essa seleção não acrescenta automaticamente os demais opcionais.

{{image:intelligent-vitrine.png|Aplicação inteligente de Roupas. A feature aiAssistant acrescenta o consultor de produtos ao mesmo núcleo.|310}}

{{image:intelligent-admin.png|Painel inteligente com acesso ao agente. A resposta real do modelo depende da configuração no serviço de IA.|310}}

O agente administrativo pode usar ferramentas de estoque e vendas. A rota exige administração e feature habilitada. As capturas foram feitas sem chave real e demonstram composição e controles, não uma nova resposta Gemini. A execução real está documentada nas evidências de 09 e 10/11 citadas na seção 4.

### 9.4 Compra e avaliação

O comprador adiciona itens e entra ou cria sua conta para finalizar. Lojas valida sua identidade; pedidos consulta preços do catálogo; o framework calcula desconto e frete; estoque reserva. Aprovação confirma a reserva e recusa a libera. O histórico pessoal usa a conta autenticada.

{{image:compra-movel.png|Sacola em emulação móvel, capturada na validação E2E anterior de 10/11. O fluxo envolve contas, catálogo, pedidos e estoque.|365}}

Com `reviews`, somente uma conta com compra aprovada do produto pode publicar nota e comentário. O nome vem da conta, e um autor forjado é ignorado. A coleção mantém a rota da loja e a vitrine apresenta apenas seu menu, conforme PB-043.

### 9.5 Limites da entrega

IA depende do provedor e pode errar. Restringir ferramentas e filtrar links não prova segurança contra toda entrada adversarial. Não há worker de reconciliação automática para tentativas abandonadas; a retomada depende da mesma referência. O limitador por IP é local ao gateway, e os serviços compartilham uma credencial de banco.

Detalhamento de DTOs Swagger, revisão dos itens abertos, ensaio e relatório específico da LPS permanecem entregas distintas. Esses limites delimitam o alcance acadêmico da implementação e suas evidências.

## 10 Repositório e instruções de execução

O projeto está em https://github.com/CaioMascarenhas/gerar-commerce. A revisão de referência é https://github.com/CaioMascarenhas/gerar-commerce/tree/be534c187ffa2d8baa5f21de7943fb6e406c299b. O Kanban está em https://github.com/users/CaioMascarenhas/projects/3/views/2. O acesso ao conteúdo depende da permissão no repositório.

O código completo é consultado pelos links diretos abaixo. As listagens do relatório ficam concentradas nos pontos que explicam composição, extensão, políticas e integração da IA.

{{source-links}}

### 10.1 Docker Compose

São necessários Git, Docker com motor ativo e Compose v2. O build em contêiner dispensa Node no host. Executar:

```powershell
git clone https://github.com/CaioMascarenhas/gerar-commerce.git
cd gerar-commerce
docker compose up --build -d --wait
docker compose ps
```

A plataforma fica em `http://localhost:4200`; a saúde do gateway, em `http://localhost:3000/api/health`. O cadastro em `/criar` publica a loja. `docker compose logs -f gateway` acompanha requisições e `docker compose logs -f ai-assistant` auxilia no diagnóstico da IA. `docker compose stop` e `docker compose start` preservam o banco.

Para portas ocupadas, definir as variáveis antes de iniciar. A comunicação interna não muda:

```powershell
$env:FRONTEND_PORT = '4400'
$env:GATEWAY_PORT = '3300'
$env:POSTGRES_PORT = '5433'
docker compose up --build -d --wait
```

### 10.2 Inteligência artificial

O arquivo opcional `backend/.env` é lido pelo Compose para `ai-assistant`. São exigidas `GOOGLE_API_KEY` e `GEMINI_MODEL`, com chave válida e modelo disponível à conta. A chave não deve ser incluída no Git, frontend ou relatório.

```dotenv
GOOGLE_API_KEY=preencher-localmente
GEMINI_MODEL=preencher-com-modelo-disponivel
```

Após corrigir os valores, recria-se o contêiner para atualizar o ambiente. Mudar somente essas variáveis não exige recompilar a imagem:

```powershell
docker compose up -d --force-recreate ai-assistant
```

A loja também precisa do opcional selecionado. Sem credenciais, o e-commerce funciona, a geração oferece exemplos identificados e os chats informam indisponibilidade. Selecionar o plano não configura o provedor.

### 10.3 Desenvolvimento local e verificação

Fora dos contêineres, usar Node 24 compatível com `engines`. As instalações são independentes. O banco deve estar ativo e `backend/.env` pode ajustar conexão e endereços conforme o arquivo de exemplo.

```powershell
# Terminal 1, na raiz
docker compose up -d postgres
cd backend
npm ci
npm run dev

# Terminal 2, na raiz
cd frontend
npm ci
npm start
```

O smoke usa banco temporário e não chama Gemini. Os E2E criam um projeto Compose isolado, com dados fictícios e limpeza própria. Comandos:

```powershell
# Em backend/
npm test
npm run build
npm run smoke

# Em frontend/
npm test
npm run build
npm run test:e2e:types
npm run test:e2e

# Opcional, com provedor real configurado
npm run test:e2e -- --ai
```

Para exportar a composição, executar em `backend/`: `npm run derive -- casa-nova`. Os dados públicos ficam em `backend/output/products/casa-nova/`. A loja operacional permanece no PostgreSQL.

## 11 Referências bibliográficas

[1] KANBAN GUIDES. The Kanban Guide. Versão maio de 2025. Disponível em: https://kanbanguides.org/the-kanban-guide/2025.5/. Acesso em: 10 nov. 2026.

[2] CONVENTIONAL COMMITS. Conventional Commits 1.0.0. Disponível em: https://www.conventionalcommits.org/pt-br/v1.0.0/. Acesso em: 10 nov. 2026.

[3] REFACTORING.GURU. Template Method. Disponível em: https://refactoring.guru/design-patterns/template-method. Acesso em: 10 nov. 2026.

[4] LEWIS, James; FOWLER, Martin. Microservices. 25 mar. 2014. Disponível em: https://martinfowler.com/articles/microservices.html. Acesso em: 10 nov. 2026.

[5] MASTRA. Agents. Documentação oficial. Disponível em: https://mastra.ai/docs/agents/overview. Acesso em: 10 nov. 2026.

[6] ANGULAR. What is Angular? Documentação oficial. Disponível em: https://angular.dev/overview. Acesso em: 10 nov. 2026.

[7] POSTGRESQL GLOBAL DEVELOPMENT GROUP. PostgreSQL 17 Documentation: Schemas. Disponível em: https://www.postgresql.org/docs/17/ddl-schemas.html. Acesso em: 10 nov. 2026.

[8] NESTJS. Documentation. Disponível em: https://docs.nestjs.com/. Acesso em: 10 nov. 2026.

[9] DOCKER. Why use Compose? Documentação oficial. Disponível em: https://docs.docker.com/compose/intro/features-uses/. Acesso em: 10 nov. 2026.

[10] UNIVERSIDADE FEDERAL DE ALAGOAS. Identidade Visual. Marca da capa obtida no portal institucional, versão brasão com sigla. Disponível em: https://ufal.br/ufal/comunicacao/identidade-visual. Arquivo: https://ufal.br/ufal/comunicacao/identidade-visual/brasao/sigla/png.png. Acesso em: 10 nov. 2026.

[11] UNIVERSIDADE FEDERAL DE ALAGOAS. Elementos do Relatório do Projeto: Reuso de Software e Metodologias Ágeis. Modelo fornecido para 2026.2. Arquivo: projeto_docs/Modelo-Relatorio-2026-2-reuso.pdf.

[12] SOARES, Caio Mascarenhas. Gerar Commerce. Código-fonte, documentação e evidências. Revisão be534c187ffa2d8baa5f21de7943fb6e406c299b. Disponível em: https://github.com/CaioMascarenhas/gerar-commerce. Acesso em: 10 nov. 2026.

[13] MASTRA. Tools. Documentação oficial de ferramentas para agentes. Disponível em: https://mastra.ai/docs/agents/tools. Acesso em: 10 nov. 2026.

[14] MASTRA. Agent.generate(). Referência de geração e limite de passos. Disponível em: https://mastra.ai/reference/agents/generate. Acesso em: 10 nov. 2026.
