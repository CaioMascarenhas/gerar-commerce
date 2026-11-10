import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

type AuthState = Awaited<ReturnType<APIRequestContext['storageState']>>;
export interface FixtureStore {
  slug: string;
  name: string;
  category: string;
  options: string[];
  products: {
    id: string;
    name: string;
    description: string;
    priceInCents: number;
    image: string;
    category: string;
  }[];
}
interface Stores {
  essential: FixtureStore;
  complete: FixtureStore;
  intelligent: FixtureStore;
  adminState: AuthState;
  buyerState: AuthState;
}
export const adminPassword = 'loja-e2e-2026';
export const buyerPassword = 'comprador-e2e-2026';
export const buyerEmail = 'comprador@example.test';

// PNG determinístico e válido para os uploads; nenhuma imagem pessoal é usada.
export function photo() {
  const crc = (buffer: Buffer) => {
    let value = 0xffffffff;
    for (const byte of buffer) {
      value ^= byte;
      for (let i = 0; i < 8; i++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
    return (value ^ 0xffffffff) >>> 0;
  };
  const chunk = (name: string, data: Buffer) => {
    const tag = Buffer.from(name),
      size = Buffer.alloc(4),
      sum = Buffer.alloc(4);
    size.writeUInt32BE(data.length);
    sum.writeUInt32BE(crc(Buffer.concat([tag, data])));
    return Buffer.concat([size, tag, data, sum]);
  };
  const width = 240,
    height = 160,
    header = Buffer.alloc(13),
    pixels = Buffer.alloc((width * 3 + 1) * height);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const offset = y * (width * 3 + 1) + 1 + x * 3;
      pixels[offset] = 40 + (x % 160);
      pixels[offset + 1] = 80 + (y % 130);
      pixels[offset + 2] = 180;
    }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
export async function json(
  request: APIRequestContext,
  path: string,
  method = 'GET',
  data?: unknown,
) {
  const response = await request.fetch('/api' + path, {
    method,
    ...(data === undefined ? {} : { data }),
  });
  expect(
    response.ok(),
    method + ' ' + path + ' → ' + response.status() + ' ' + (await response.text()),
  ).toBeTruthy();
  return response.json();
}
export async function setAuth(page: Page, state: AuthState, slug: string) {
  await page
    .context()
    .addCookies(state.cookies.filter((cookie) => cookie.path === '/api/stores/' + slug));
}
export async function openProduct(page: Page, store: FixtureStore, index = 0) {
  await page.goto('/loja/' + store.slug + '/produto/' + store.products[index].id);
  await expect(
    page.getByRole('heading', { name: store.products[index].name, exact: true }),
  ).toBeVisible();
}
export async function addToBag(page: Page) {
  await page.getByRole('button', { name: 'Adicionar à sacola', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Sua sacola', exact: true });
  await expect(drawer).toBeVisible();
  return drawer;
}
export const test = base.extend<{ runtimeErrors: void }, { stores: Stores }>({
  runtimeErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await use();
      expect(errors, 'Erros JavaScript na página').toEqual([]);
    },
    { auto: true },
  ],
  stores: [
    async ({ playwright }, use, worker) => {
      const baseURL = process.env.E2E_BASE_URL ?? '';
      if (process.env.E2E_ISOLATED !== '1' || new URL(baseURL).hostname !== 'storefront')
        throw new Error('Use npm run test:e2e: os dados devem ficar no projeto Docker isolado.');
      // O Playwright recria o worker depois de uma falha. Reutilizar a mesma massa
      // impede que erros de interface sejam mascarados pelo limite de cadastros.
      const fixturePath = join(tmpdir(), 'gerar-e2e-fixtures-' + worker.project.name + '.json');
      if (existsSync(fixturePath)) {
        await use(JSON.parse(readFileSync(fixturePath, 'utf8')) as Stores);
        return;
      }
      const request = await playwright.request.newContext({ baseURL });
      const admin = await playwright.request.newContext({ baseURL });
      const buyer = await playwright.request.newContext({ baseURL });
      const result: Partial<Stores> = {};
      const configurations =
        worker.project.name === 'chromium'
          ? ([
              ['essential', 'eletronicos', []],
              ['complete', 'construcao', ['coupons', 'reviews', 'delivery']],
              ['intelligent', 'roupas', ['aiAssistant']],
            ] as const)
          : ([['complete', 'construcao', ['coupons', 'reviews', 'delivery']]] as const);
      for (const [key, category, options] of configurations) {
        const slug = 'e2e-' + worker.project.name + '-' + randomUUID().slice(0, 8) + '-' + key;
        const name = 'Loja E2E ' + key;
        const store = await json(request, '/stores', 'POST', {
          slug,
          name,
          description: 'Loja exclusivamente fictícia de validação E2E.',
          category,
          options: [...options],
          password: adminPassword,
          cover: 'data:image/png;base64,' + photo().toString('base64'),
          products: [
            {
              name: 'Produto Álamo',
              description: 'Produto principal fictício.',
              priceInCents: 10000,
              stock: 20,
              image: '',
            },
            {
              name: 'Produto Âmbar',
              description: 'Produto complementar fictício.',
              priceInCents: 5000,
              stock: 10,
              image: '',
            },
          ],
        });
        result[key] = { ...store, products: await json(request, '/stores/' + slug + '/products') };
        result[key]!.products.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        await json(admin, '/stores/' + slug + '/login', 'POST', { password: adminPassword });
        await json(buyer, '/stores/' + slug + '/customers', 'POST', {
          name: 'Comprador E2E',
          email: buyerEmail,
          password: buyerPassword,
        });
        if (options.some((option) => option === 'coupons'))
          await json(admin, '/stores/' + slug + '/coupons/E2E10', 'PUT', {
            percentage: 10,
            minimumInCents: 0,
            active: true,
            expiresAt: null,
          });
      }
      result.adminState = await admin.storageState();
      result.buyerState = await buyer.storageState();
      writeFileSync(fixturePath, JSON.stringify(result));
      await use(result as Stores);
      await Promise.all([request.dispose(), admin.dispose(), buyer.dispose()]);
    },
    { scope: 'worker' },
  ],
});
export { expect };
