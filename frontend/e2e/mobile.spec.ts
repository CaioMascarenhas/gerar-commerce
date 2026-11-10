import {
  test,
  expect,
  setAuth,
  openProduct,
  addToBag,
  buyerEmail,
  buyerPassword,
} from './fixtures';

test('vitrine e login mantêm foco, enquadramento e largura da tela', async ({
  page,
  stores,
  isMobile,
}) => {
  const store = stores.complete;
  await openProduct(page, store);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  const header = page.locator('.shop-header').getByRole('button', { name: 'Entrar / Criar conta' });
  if (isMobile) await header.tap();
  else await header.click();
  const account = page.getByRole('dialog', { name: 'Sua conta de comprador' });
  await expect(account.getByLabel('E-mail')).toBeFocused();
  expect(
    await account.getByLabel('E-mail').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return (
        document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === element
      );
    }),
  ).toBeTruthy();
  await page.screenshot({ path: test.info().outputPath('login.png') });
  await account.getByLabel('E-mail').fill(buyerEmail);
  await account.getByLabel('Senha', { exact: false }).fill(buyerPassword);
  await account.getByRole('button', { name: 'Entrar na minha conta', exact: true }).click();
  await expect(account).toHaveCount(0);
  await expect(page.locator('.shop-header .buyer-account-button')).toContainText('Comprador');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  await page.screenshot({ path: test.info().outputPath('vitrine.png') });
});

test('sacola abre e fecha com contador, movimento reduzido e itens preservados', async ({
  page,
  stores,
}) => {
  const store = stores.complete;
  await setAuth(page, stores.buyerState, store.slug);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openProduct(page, store);
  let drawer = await addToBag(page);
  await expect(page.getByRole('button', { name: 'Abrir sacola com 1 item' })).toBeVisible();
  await expect(drawer).toBeInViewport();
  await page.screenshot({ path: test.info().outputPath('sacola.png') });
  await drawer.getByRole('button', { name: 'Fechar sacola' }).click();
  await expect(drawer).toHaveCount(0);
  await page.getByRole('button', { name: 'Abrir sacola com 1 item' }).click();
  drawer = page.getByRole('dialog', { name: 'Sua sacola' });
  await expect(drawer).toContainText(store.products[0].name);
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Abrir sacola com 1 item' }).click();
  await expect(page.getByRole('dialog', { name: 'Sua sacola' })).toContainText(
    store.products[0].name,
  );
});
