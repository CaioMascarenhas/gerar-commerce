import { test, expect, setAuth, json, adminPassword, photo } from './fixtures';

test('capturas acadêmicas de duas aplicações e serviços ativos', async ({ page, stores }) => {
  test.setTimeout(90000);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Seu negócio/ })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('plataforma.png') });
  for (const key of ['essential', 'intelligent'] as const) {
    const store = stores[key];
    await page.goto('/loja/' + store.slug);
    await expect(page.getByRole('link', { name: /Explorar a coleção/ })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(key + '-vitrine.png') });
    await setAuth(page, stores.adminState, store.slug);
    await page.goto('/admin/' + store.slug);
    await expect(page.locator('.admin-stats')).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(key + '-admin.png') });
  }
  await page.goto('/criar');
  await page.getByLabel('Nome da loja').fill('Nova Aurora');
  await page.getByLabel('Descrição', { exact: true }).fill('Loja fictícia para demonstrar o reuso.');
  await page.locator('image-editor input[type=file]').setInputFiles({ name: 'capa.png', mimeType: 'image/png', buffer: photo() });
  await page.getByLabel('Senha de administração').fill(adminPassword);
  await page.getByRole('button', { name: 'Continuar →', exact: true }).click();
  await expect(page.locator('.core-grid input:checked:disabled')).toHaveCount(6);
  await page.getByRole('checkbox', { name: /Agente de IA/ }).check();
  await page.screenshot({ path: test.info().outputPath('selecao-features.png'), fullPage: true });
  const services = await json(page.request, '/services');
  expect(services).toHaveLength(5);
  for (const service of services) expect(service.status).toBe('ok');
  await page.setViewportSize({ width: 720, height: 740 });
  await page.goto('/api/services');
  await page.locator('body').evaluate((body) => {
    const pre = body.querySelector('pre')!;
    pre.textContent = JSON.stringify(JSON.parse(pre.textContent!), null, 2);
    pre.style.font = '16px/1.35 monospace';
    body.style.margin = '16px';
  });
  await page.screenshot({ path: test.info().outputPath('servicos-ativos.png') });
});
