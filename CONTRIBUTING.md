# Contribuição

Use pt-BR correto nas interfaces e na documentação. Frontend Angular, backend NestJS e execução dos microsserviços por Docker conforme `AGENTS.md`.

Selecione uma issue no [Kanban](https://github.com/users/CaioMascarenhas/projects/3/views/2), respeite o limite de trabalho em andamento e registre bloqueios. Crie branch `feat/pb-011-carrinho`, `fix/...` ou `docs/...`.

Use Conventional Commits, por exemplo:

```text
feat(framework): adiciona política de entrega por retirada
feat(checkout): confirma pedido com pagamento simulado
fix(inventory): impede reserva acima do saldo
docs(arquitetura): atualiza diagrama de componentes
```

Inclua `Refs #11` ou `Closes #11` no corpo do commit/PR quando aplicável. Antes do merge, execute os checks pertinentes: build, testes do domínio alterado e smoke quando modificar integração. Não crie testes que apenas repitam detalhes de implementação.

Ao alterar funcionalidades opcionais, atualize configuração, validação, composição, interface, testes de ausência/presença, diagramas e backlog. Não importe repositórios de banco de um serviço em outro.

Não versionar `.env`, chaves ou dados reais. Para a entrega educacional, usar os dados e personas de demonstração. Manter `docs/estado-atual.md` fiel ao que funciona.
