# Estado da implementação — 05/11/2026

## Implementado

- Plataforma Angular com páginas inicial, cadastro, `/loja/:slug` e `/admin/:slug`, temas por categoria e planos fictícios.
- Cadastro dinâmico com nome, descrição, capa, senha, endereço único e ao menos um produto.
- Framework com Template Method e `ConfiguredStore`, catálogo de features, core obrigatório, opcionais, tema, plano, desconto, entrega e pagamento simulado.
- PostgreSQL: schemas próprios para lojas/sessões, catálogo/avaliações, estoque/reservas e pedidos/tentativas; tabelas idempotentes e volume Docker.
- Login com scrypt, sessões persistidas em hash, cookie HttpOnly e associação por loja. Logout revoga sessão.
- CRUD administrativo de produtos e edição de estoque; proteção para manter ao menos um produto ativo.
- Carrinho por loja no navegador e checkout com preços oficiais, aprovação/recusa simuladas, reserva idempotente e controle de concorrência.
- Intenção durável anterior à reserva para retomar a confirmação da mesma compra após falha de comunicação. Pedido final e snapshot da cotação persistidos.
- Pedidos no painel e recomendações baseadas nas compras persistidas da loja.
- Cupons, avaliações, entrega local e agente de IA como opcionais com guarda no servidor.
- Geração de três produtos no cadastro via Gemini; sem configuração, retorna exemplos editáveis com origem identificada.
- Agente Mastra + Gemini com ferramentas de leitura limitadas ao estoque e vendas da loja autenticada.
- Compose com nove contêineres; frontend e backend com builds e instalações independentes; CI com PostgreSQL.

## Verificação realizada

Builds Angular e NestJS aprovados. **8 testes do framework e 35 verificações do smoke PostgreSQL aprovados**: cadastro, preços, categorias, login, isolamento, CRUD, compra simulada, idempotência, estoque concorrente, persistência após reinício e guardas dos opcionais. O smoke usa banco temporário e chave Gemini vazia.

O Compose foi compilado e executado neste ambiente. As rotas diretas de loja e administração responderam pelo Nginx e as APIs funcionaram entre contêineres. As portas da validação foram 4400 (interface), 3300 (gateway) e 5433 (PostgreSQL), pois 4200, 3000 e 5432 já estavam ocupadas por processos existentes. As portas padrão da aplicação continuam 4200/3000.

Também foram conferidos cookie HttpOnly/SameSite limitado à loja, envio e persistência de capa maior que 1 MB pelo Nginx, as três lojas de demonstração após recriação dos contêineres e a exportação de snapshot de uma loja existente. A documentação foi validada com 32 itens de backlog, sendo 27 vínculos remotos existentes e cinco novos itens locais.

A tentativa de inspeção visual automática terminou porque a ferramenta de controle não conseguiu confirmar a URL do navegador com segurança. A revisão visual de telas e responsividade permanece pendente; compilação e HTTP não substituem essa revisão.

## Limites e pendências reais

- Não foi realizada chamada real ao Gemini nesta entrega. A integração e os erros sem configuração foram testados; confirmar a resposta do provedor exige chave e modelo disponíveis.
- Relatórios acadêmicos finais, capturas de tela e ensaio da apresentação ainda estão no backlog.
- Schemas são separados por domínio, mas compartilham usuário PostgreSQL local. Não existe isolamento por credenciais de banco.
- Se uma tentativa de compra for abandonada após uma falha distribuída, sua retomada depende de repetir a mesma referência; não há worker periódico de reconciliação/expiração.
- O provisionamento tenta compensar falhas de cadastro; um processo interrompido durante a criação pode deixar cadastro inativo para inspeção manual.
- Atualização administrativa de produto e saldo usa duas APIs. Não existe transação distribuída entre os serviços.
- Fotos de capa pequenas ficam como data URL ou endereço HTTPS no cadastro; armazenamento de objetos e processamento de mídia não foram incluídos.
- Sem recuperação de senha, usuários compradores, assinatura financeira real ou pagamento real, conforme o escopo solicitado.
- Avaliações são de demonstração, sem comprovação de compra. Variações de SKU permanecem no backlog.

Os registros de gestão distinguem implementação, evidência automatizada e revisão manual pendente; os snapshots antigos preservam o estado histórico anterior.
