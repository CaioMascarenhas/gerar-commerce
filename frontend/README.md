# Frontend — Angular

Esta pasta contém a interface executada no navegador: vitrine, prévia de configuração da loja, painel de saúde dos serviços e tela do assistente no perfil Assistida.

## Executar

Abra um terminal nesta pasta:

```powershell
npm ci
npm run dev
```

Acesse http://127.0.0.1:4200. A interface pode ser compilada sem instalar ou compilar o backend. Para exibir os dados, o gateway precisa estar em execução na porta 3000.

```powershell
npm run build
```

O resultado da compilação fica em `dist/browser/`.

## Onde fica cada coisa

- `src/main.ts`: inicia o Angular e configura HTTP e idioma pt-BR.
- `src/app/app.ts`: carrega dados das APIs e controla as telas atuais.
- `src/app/app.html`: estrutura visual das telas.
- `src/styles.css`: aparência e adaptação a telas menores.
- `src/app/models/api.ts`: tipos dos JSONs recebidos pela interface.
- `proxy.conf.json`: encaminha `/api` para o gateway durante o desenvolvimento.
- `angular.json` e `tsconfig.app.json`: configuração de build e TypeScript do frontend.
- `package.json`, `package-lock.json` e `node_modules/`: dependências exclusivas do frontend.
- `Dockerfile` e `nginx.conf`: compilam e servem a interface no Docker.

Angular, suas ferramentas de build e TypeScript pertencem a esta instalação. Não há dependência npm dos serviços NestJS ou do framework do backend. Os formatos em `models/api.ts` descrevem o contrato HTTP; mudanças nesse contrato precisam ser refletidas no cliente.

Chaves do Gemini ficam em `backend/.env`. A interface chama o gateway e não acessa diretamente o provedor de IA.
