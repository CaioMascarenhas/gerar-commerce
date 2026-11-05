import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { deriveProduct } from '@gerar/framework';

const profile = process.argv[2] ?? 'essencial';
const blueprint = deriveProduct(profile);
const directory = resolve('..', 'output', 'products', blueprint.configuration.id);
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, 'blueprint.json'), JSON.stringify(blueprint, null, 2) + '\n');
await writeFile(
  resolve(directory, 'product.env'),
  `PRODUCT_PROFILE=${blueprint.configuration.id}\n`,
);
await writeFile(
  resolve(directory, 'compose.yaml'),
  `# Execute na raiz do repositório com os comandos do README gerado.\ninclude:\n  - path: ../../../compose.yaml\n`,
);
await writeFile(
  resolve(directory, 'README.md'),
  `# ${blueprint.configuration.name}\n\nAplicação derivada pelo Template Method de @gerar/framework.\n\nExecute na raiz do repositório. Para Assistida, crie backend/.env a partir do exemplo antes de usar Docker.\n\n\`\`\`powershell\n$env:PRODUCT_PROFILE='${blueprint.configuration.id}'\ndocker compose ${profile === 'assistida' ? '--env-file backend/.env --profile ai ' : ''}up --build\n\`\`\`\n\nSem Docker, use dois terminais na raiz do repositório. Backend:\n\n\`\`\`powershell\n$env:PRODUCT_PROFILE='${blueprint.configuration.id}'\nnpm run dev:backend\n\`\`\`\n\nFrontend, em outro terminal:\n\n\`\`\`powershell\nnpm run dev:frontend\n\`\`\`\n\nBlueprint descreve composição, não conclusão de todas as funcionalidades. Veja docs/estado-atual.md.\n`,
);
console.log(`Produto validado e derivado: ${directory}`);
