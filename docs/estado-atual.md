# Estado da implementação — 10/11/2026

## Implementado

- Tipografia global com Inter nos textos/controles e Exo nos títulos; fontes variáveis e licenças incluídas na aplicação.
- Ícones SVG originais das categorias, com componente visual reutilizável e cores por tema; aplicados também às lojas existentes.

- Correção de perfis e login: cabeçalho identifica loja/comprador e oferece logout independente. A conta fica acima do próprio fundo e mantém o foco durante a saída animada da sacola, que é retomada ao fechar o login. [Evidências](gestao/snapshots/2026-11-09-sessoes-e-foco.md).

- Evolução de 09/11: contas de compradores, checkout autenticado, histórico pessoal, cupons cadastrados, chat público com links de produtos, sacola flutuante animada e fotos com enquadramento. Veja o [snapshot atual](gestao/snapshots/2026-11-09-compradores-e-experiencia.md).

- Plataforma Angular com páginas inicial, cadastro, `/loja/:slug` e `/admin/:slug`, temas por categoria e planos fictícios.
- Cadastro dinâmico com nome, descrição, capa, senha, endereço único e ao menos um produto.
- Framework com Template Method e `ConfiguredStore`, catálogo de features, core obrigatório, opcionais, tema, plano, desconto, entrega e pagamento simulado.
- PostgreSQL: schemas próprios para lojas/sessões, catálogo/avaliações, estoque/reservas e pedidos/tentativas; tabelas idempotentes e volume Docker.
- Login com scrypt, sessões persistidas em hash, cookie HttpOnly e associação por loja. Logout revoga sessão.
- CRUD administrativo de produtos e edição de estoque; proteção para manter ao menos um produto ativo.
- Carrinho por loja no navegador e checkout com preços oficiais, aprovação/recusa simuladas, reserva idempotente e controle de concorrência.
- Intenção durável anterior à reserva para retomar a confirmação da mesma compra após falha de comunicação. Pedido final e snapshot da cotação persistidos.
- Pedidos no painel, com histórico pessoal por conta de comprador.
- Cupons, avaliações, entrega local e agente de IA como opcionais com guarda no servidor.
- Geração de três produtos no cadastro via Gemini; sem configuração, retorna exemplos editáveis com origem identificada.
- Agente Mastra + Gemini com ferramentas de leitura limitadas ao estoque e vendas da loja autenticada.
- Compose com nove contêineres; frontend e backend com builds e instalações independentes; CI com PostgreSQL.

## Verificação realizada

Em 10/11, a validação foi ampliada para **oito testes de frontend, 15 testes do backend e 75 verificações de integração PostgreSQL**, todos aprovados. A suíte Playwright executou **14 E2E sem chave** e **14 com Gemini real**, em Chromium, Firefox e WebKit móvel; cada rodada ignora apenas o cenário incompatível com a presença/ausência da chave. Foram corrigidos o checkout em HTTP fora de `localhost` e a confirmação na página do produto. [Snapshot dos testes e evidências](gestao/snapshots/2026-11-10-validacao-e2e.md).

Na evolução de 09/11, o Docker foi reconstruído e executado nas portas 4200/3000/5433, preservando a loja já cadastrada. O chat Gemini retornou resposta real e link válido de um produto do catálogo. As verificações descritas abaixo sobre portas alternativas e capa maior que 1 MB pertencem ao incremento de 05/11.

A auditoria da [PR #29](https://github.com/CaioMascarenhas/gerar-commerce/pull/29) também validou o agente administrativo Gemini com ferramentas reais e dados fictícios em banco temporário. O agente confirmou oito unidades do Módulo Aurora, três do Sensor Horizonte, um pedido aprovado e R$ 123,45 em vendas. Geração de três produtos e chat com link interno também foram aprovados. [Evidência estruturada](gestao/evidencias/2026-11-09-gemini.json).

Na verificação de 09/11, builds Angular e NestJS e **9 testes do framework, 6 testes de frontend e 75 verificações do smoke PostgreSQL** foram aprovados: cadastro, preços, categorias, login, isolamento, CRUD, compra simulada, idempotência, estoque concorrente, persistência após reinício, guardas dos opcionais, logout independente, camadas e foco dos diálogos. Os testes de frontend dessa etapa usam DOM simulado. O smoke usa banco temporário e chave Gemini vazia.

O Compose foi compilado e executado neste ambiente. As rotas diretas de loja e administração responderam pelo Nginx e as APIs funcionaram entre contêineres. As portas da validação foram 4400 (interface), 3300 (gateway) e 5433 (PostgreSQL), pois 4200, 3000 e 5432 já estavam ocupadas por processos existentes. As portas padrão da aplicação continuam 4200/3000.

Também foram conferidos cookie HttpOnly/SameSite limitado à loja, envio e persistência de capa maior que 1 MB pelo Nginx, as três lojas de demonstração após recriação dos contêineres e a exportação de snapshot de uma loja existente. Os 42 itens do backlog possuem vínculos remotos no GitHub: 31 concluídos, seis em revisão, quatro prontos e um no backlog. [Auditoria](gestao/snapshots/2026-11-09-sincronizacao-e-merge.md).

A tentativa anterior de inspeção com controle do navegador foi bloqueada pela ferramenta. Em 10/11, testes Playwright em contêineres separados validaram navegação, foco e largura móvel, com capturas conferidas de cadastro, produto, login e sacola. A aprovação final da experiência e testes em aparelhos físicos continuam pendentes.

## Limites e pendências reais

- A aprovação final da experiência permanece em revisão, agora apoiada por E2E em três navegadores, capturas e chamadas reais ao Gemini. Dispositivos móveis físicos não foram testados.
- Os relatórios de [Reuso](relatorio/relatorio-reuso.pdf) e [LPS](relatorio-lps/relatorio-lps.pdf) estão produzidos, com fontes editáveis e capturas; PB-022 e PB-021 estão em revisão. O ensaio e os demais itens mantêm critérios próprios. O relatório de LPS referencia a versão posterior do GitHub com recomendações restauradas, descrita no [snapshot](gestao/snapshots/2026-11-10-relatorio-lps.md).
- Schemas são separados por domínio, mas compartilham usuário PostgreSQL local. Não existe isolamento por credenciais de banco.
- Se uma tentativa de compra for abandonada após uma falha distribuída, sua retomada depende de repetir a mesma referência; não há worker periódico de reconciliação/expiração.
- O provisionamento tenta compensar falhas de cadastro; um processo interrompido durante a criação pode deixar cadastro inativo para inspeção manual.
- Atualização administrativa de produto e saldo usa duas APIs. Não existe transação distribuída entre os serviços.
- Fotos de capa pequenas ficam como data URL ou endereço HTTPS no cadastro; armazenamento de objetos e processamento de mídia não foram incluídos.
- Compradores agora possuem conta por loja. Permanecem ausentes recuperação de senha, confirmação de e-mail, assinatura financeira real e pagamento real.
- Avaliações novas exigem comprador conectado e compra aprovada do produto, usando o nome da conta. Registros antigos são preservados sem selo de compra verificada. Variações de SKU permanecem no backlog.

Os registros de gestão distinguem implementação, evidência automatizada e revisão manual pendente; os snapshots antigos preservam o estado histórico anterior.

## Revisão de navegação e avaliações — PB-043

A vitrine usa somente o menu da loja. O link da coleção mantém a rota e a âncora corretas. Avaliar exige sessão de comprador e compra aprovada, usando o nome confirmado pelo servidor. Recomendações automáticas foram retiradas do core, das APIs e do Compose. Blueprints antigos são atualizados sem apagar os dados da loja.

Verificação desta revisão: 8 testes de frontend, 15 de backend, 83 verificações PostgreSQL e 15 E2E aprovados, com um cenário de Gemini real ignorado por não usar chave nesta rodada. Capturas em desktop e celular foram inspecionadas. Consulte o [snapshot](gestao/snapshots/2026-11-10-navegacao-avaliacoes.md).

## Recomendações restauradas

O microsserviço de recomendações (porta 3004) voltou ao core, com ranking por categoria, cestas da loja, popularidade e faixa de preço, e motivo exibido em cada sugestão. Build, 16 testes do backend, smoke PostgreSQL e testes do frontend passaram; a revisão visual da vitrine e a suíte E2E em navegador ainda precisam ser reexecutadas. Ver ADR-011 em [arquitetura](arquitetura.md).
