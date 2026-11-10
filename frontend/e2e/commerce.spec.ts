import {
  test,
  expect,
  photo,
  adminPassword,
  buyerPassword,
  buyerEmail,
  json,
  setAuth,
  openProduct,
  addToBag,
} from './fixtures';

test('plataforma carrega categorias, fontes e ícones; busca e rotas de produto funcionam', async ({
  page,
  stores,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Seu negócio/ })).toBeVisible();
  for (const label of ['Eletrônicos', 'Construção', 'Roupas'])
    await expect(
      page.locator('.category-strip').getByRole('button', { name: new RegExp(label) }),
    ).toBeVisible();
  await page.getByLabel('Buscar lojas').fill(stores.complete.name);
  await expect(page.locator('.store-card').filter({ hasText: stores.complete.name })).toHaveCount(
    1,
  );
  await page.locator('.store-card').filter({ hasText: stores.complete.name }).click();
  await page.getByLabel('Buscar produtos').fill(stores.complete.products[0].name);
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.locator('.product-card h3 a').click();
  await expect(page).toHaveURL(new RegExp('/produto/' + stores.complete.products[0].id));
  await expect(
    page.getByRole('heading', { name: stores.complete.products[0].name, exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () =>
        document.fonts.check('16px Inter', 'Construção') &&
        document.fonts.check('20px Exo', 'Eletrônicos'),
    ),
  ).toBeTruthy();
  await page.screenshot({ path: test.info().outputPath('produto-desktop.png'), fullPage: true });
});

test('onboarding cria uma loja pela interface com produto, upload e enquadramento', async ({
  page,
}) => {
  await page.goto('/criar');
  const slug = 'e2e-interface-' + Date.now();
  await page.getByLabel('Nome da loja').fill('Ateliê E2E');
  await page.locator('input[name="slug"]').fill(slug);
  await page
    .getByLabel('Descrição', { exact: true })
    .fill('Loja criada do início ao fim pela interface.');
  await page.getByRole('button', { name: /Roupas/ }).click();
  await page
    .locator('image-editor input[type=file]')
    .setInputFiles({ name: 'capa.png', mimeType: 'image/png', buffer: photo() });
  await expect(page.locator('image-editor img')).toHaveAttribute('src', /^data:image\/webp/);
  await page.getByLabel('Senha de administração').fill(adminPassword);
  await page.getByRole('button', { name: 'Continuar →', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Combine possibilidades.' })).toBeVisible();
  await expect(page.locator('.core-grid input:checked:disabled')).toHaveCount(6);
  await page.getByRole('checkbox', { name: /Cupons de desconto/ }).check();
  await page.getByRole('checkbox', { name: /Avaliações/ }).check();
  await page.getByRole('button', { name: 'Continuar →', exact: true }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Peça Âmbar');
  await page
    .getByLabel('Descrição', { exact: true })
    .fill('Peça fictícia para validar o cadastro.');
  await page.getByLabel('Preço (R$)').fill('123.45');
  await page.getByLabel('Estoque inicial').fill('9');
  await page
    .locator('image-editor input[type=file]')
    .setInputFiles({ name: 'produto.png', mimeType: 'image/png', buffer: photo() });
  await page.getByLabel('Encaixe').selectOption('cover');
  await page.getByRole('slider', { name: 'Zoom da foto', exact: true }).focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Criar minha loja ↗', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: /Ateliê E2E.*está de portas abertas/ }),
  ).toBeVisible();
  const created = await json(page.request, '/stores/' + slug);
  expect(created.options).toEqual(['coupons', 'reviews']);
  expect(created.blueprint.plan.monthlyInCents).toBe(7990);
  const products = await json(page.request, '/stores/' + slug + '/products');
  expect(products[0].image).toMatch(/^data:image\/webp/);
  expect(products[0].imageFrame.zoom).toBeCloseTo(1.5);
  await page.getByRole('link', { name: 'Visitar minha loja ↗' }).click();
  await page.getByRole('link', { name: 'Peça Âmbar', exact: true }).click();
  await expect(page.locator('.product-detail-image img')).toHaveCSS('object-fit', 'cover');
  await page.goto('/admin/' + slug);
  await page.getByLabel('Senha de administração').fill(adminPassword);
  await page.getByRole('button', { name: /Entrar no painel/ }).click();
  await expect(page.getByRole('button', { name: 'Excluir', exact: true })).toBeDisabled();
  expect(
    (await page.request.delete('/api/stores/' + slug + '/products/' + products[0].id)).status(),
  ).toBe(400);
  await page.goto('/loja/' + slug + '/produto/' + products[0].id);
  await page.screenshot({ path: test.info().outputPath('loja-criada.png'), fullPage: true });
});

test('comprador cria conta na finalização e compra com cupom e entrega na página do produto', async ({
  page,
  stores,
}) => {
  const store = stores.complete;
  const stock = await json(page.request, '/stores/' + store.slug + '/stock');
  await openProduct(page, store);
  let drawer = await addToBag(page);
  await drawer.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await drawer.getByRole('button', { name: 'Entrar para finalizar compra' }).click();
  const account = page.getByRole('dialog', { name: 'Sua conta de comprador' });
  await expect(account).toBeVisible();
  await expect(account.getByLabel('E-mail')).toBeFocused();
  expect(
    await account.getByLabel('E-mail').evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === el;
    }),
  ).toBeTruthy();
  await account.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await account.getByLabel('Seu nome').fill('Pessoa E2E');
  await account.getByLabel('E-mail').fill('pessoa-e2e@example.test');
  await account.getByLabel('Senha', { exact: false }).fill(buyerPassword);
  await account.getByRole('button', { name: 'Criar conta e entrar', exact: true }).click();
  drawer = page.getByRole('dialog', { name: 'Sua sacola' });
  await expect(drawer).toBeVisible();
  await drawer.getByLabel('Cupom de desconto').fill('e2e10');
  await drawer.getByRole('button', { name: 'Aplicar cupom', exact: true }).click();
  await expect(drawer.getByText(/Cupom E2E10 aplicado/)).toBeVisible();
  await drawer.getByLabel('Recebimento').selectOption('delivery');
  await expect(drawer.locator('.cart-total')).toContainText('195,00');
  await drawer.getByRole('button', { name: /Finalizar compra simulada/ }).click();
  await expect(page.getByText('Compra simulada confirmada!', { exact: true })).toBeVisible();
  const orders = await json(page.request, '/stores/' + store.slug + '/customer-orders');
  expect(orders).toHaveLength(1);
  expect(orders[0].totalInCents).toBe(19500);
  const updated = await json(page.request, '/stores/' + store.slug + '/stock');
  expect(updated.find((s: any) => s.productId === store.products[0].id).available).toBe(
    stock.find((s: any) => s.productId === store.products[0].id).available - 2,
  );
  await page
    .locator('.shop-header')
    .getByRole('button', { name: /Minha conta/ })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Minha conta' }).getByText('195,00', { exact: false }),
  ).toBeVisible();
});

test('login pelo cabeçalho mantém o produto e os perfis têm logout independente', async ({
  page,
  stores,
}) => {
  const store = stores.essential;
  await setAuth(page, stores.adminState, store.slug);
  // O logout deste teste deve revogar apenas sua própria sessão, não a da massa compartilhada.
  await json(page.request, '/stores/' + store.slug + '/login', 'POST', { password: adminPassword });
  await openProduct(page, store);
  await expect(page.locator('.platform-header')).toHaveCount(0);
  await expect(page.locator('.session-profiles')).toHaveCount(0);
  await expect(page.locator('.shop-header .buyer-account-button')).toHaveCount(1);
  const original = new URL(page.url()).pathname;
  await page.locator('.shop-header').getByRole('button', { name: 'Entrar / Criar conta' }).click();
  expect(new URL(page.url()).pathname).toBe(original);
  const account = page.getByRole('dialog', { name: 'Sua conta de comprador' });
  await account.getByLabel('E-mail').fill(buyerEmail);
  await account.getByLabel('Senha', { exact: false }).fill('incorreta123');
  await account.getByRole('button', { name: 'Entrar na minha conta', exact: true }).click();
  await expect(account.getByRole('alert')).toContainText('E-mail ou senha incorretos.');
  await account.getByLabel('Senha', { exact: false }).fill(buyerPassword);
  await account.getByRole('button', { name: 'Entrar na minha conta', exact: true }).click();
  await expect(page.locator('.shop-header .buyer-account-button')).toContainText('Comprador');
  await page.goto('/admin/' + store.slug);
  await expect(page.locator('.customer-profile')).toContainText('Comprador E2E');
  await expect(page.locator('.owner-profile')).toBeVisible();
  await page
    .locator('.owner-profile')
    .getByRole('button', { name: 'Sair da loja', exact: true })
    .click();
  await expect(page.locator('.owner-profile')).toHaveCount(0);
  await expect(page.locator('.customer-profile')).toBeVisible();
  expect((await page.request.get('/api/stores/' + store.slug + '/orders')).status()).toBe(401);
  await page
    .locator('.customer-profile')
    .getByRole('button', { name: 'Sair do comprador', exact: true })
    .click();
  await expect(page.locator('.customer-profile')).toHaveCount(0);
  expect((await page.request.get('/api/stores/' + store.slug + '/customer-session')).status()).toBe(
    401,
  );
});

test('lojista administra produto, foto e estoque e remove um item do catálogo', async ({
  page,
  stores,
}) => {
  const store = stores.essential;
  await setAuth(page, stores.adminState, store.slug);
  await page.goto('/admin/' + store.slug);
  await expect(page.getByRole('heading', { name: 'Seu catálogo.' })).toBeVisible();
  await page.getByRole('button', { name: /Novo produto/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Editar produto' });
  await dialog.getByLabel('Nome', { exact: true }).fill('Produto editável E2E');
  await dialog
    .getByLabel('Descrição', { exact: true })
    .fill('Produto fictício para teste de edição.');
  await dialog.getByLabel('Preço (R$)').fill('19.99');
  await dialog.getByLabel('Estoque disponível').fill('4');
  await dialog
    .locator('input[type=file]')
    .setInputFiles({ name: 'produto.png', mimeType: 'image/png', buffer: photo() });
  await expect(dialog.locator('commerce-image img')).toHaveAttribute('src', /^data:image\/webp/);
  await dialog.getByRole('button', { name: 'Salvar produto', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'Produto editável E2E' });
  await expect(row).toContainText('19,99');
  await expect(row).toContainText('4 un.');
  await row.getByRole('button', { name: 'Editar', exact: true }).click();
  await dialog.getByLabel('Estoque disponível').fill('7');
  await dialog.getByRole('button', { name: 'Salvar produto', exact: true }).click();
  await expect(row).toContainText('7 un.');
  await row.getByRole('button', { name: 'Excluir', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Excluir produto' })
    .getByRole('button', { name: 'Excluir produto', exact: true })
    .click();
  await expect(row).toHaveCount(0);
});

test('foto por link HTTPS é renderizada e uma falha de rede mostra alternativa acessível', async ({
  page,
  stores,
}) => {
  const store = stores.essential;
  const product = store.products[1];
  await setAuth(page, stores.adminState, store.slug);
  const balances = await json(page.request, '/stores/' + store.slug + '/stock');
  const url = 'https://photos.example.test/produto.png';
  await json(page.request, '/stores/' + store.slug + '/products/' + product.id, 'PUT', {
    ...product,
    stock: balances.find((item: any) => item.productId === product.id).available,
    image: url,
    imageFrame: { fit: 'cover', x: 20, y: 80, zoom: 1.2 },
  });
  await page.route(url, (route) => route.fulfill({ contentType: 'image/png', body: photo() }));
  await openProduct(page, store, 1);
  const image = page.locator('.product-detail-image img');
  await expect(image).toHaveAttribute('src', url);
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBe(240);
  await expect(image).toHaveCSS('object-position', '20% 80%');
  await page.unroute(url);
  await page.route(url, (route) => route.abort());
  await page.reload();
  await expect(
    page.getByRole('img', { name: product.name + ': imagem indisponível', exact: true }),
  ).toBeVisible();
});

test('painel cadastra, edita e exclui cupom com condições próprias', async ({ page, stores }) => {
  const store = stores.complete;
  await setAuth(page, stores.adminState, store.slug);
  await page.goto('/admin/' + store.slug);
  await page.getByRole('button', { name: 'Cupons', exact: true }).click();
  await page.getByLabel('Código', { exact: true }).fill('e2e25');
  await page.getByLabel('Desconto (%)').fill('25');
  await page.getByLabel('Compra mínima (R$)').fill('50');
  await page.getByRole('button', { name: 'Salvar cupom', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'E2E25' });
  await expect(row).toContainText('25%');
  await expect(row).toContainText('50,00');
  await row.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Cupom ativo' }).uncheck();
  await page.getByRole('button', { name: 'Salvar cupom', exact: true }).click();
  await expect(row).toContainText('Desativado');
  await row.getByRole('button', { name: 'Excluir', exact: true }).click();
  await expect(row).toHaveCount(0);
});

test('pagamento recusado mantém sacola e saldo e produto de outra loja é rejeitado', async ({
  page,
  stores,
}) => {
  const store = stores.essential;
  await setAuth(page, stores.buyerState, store.slug);
  const before = await json(page.request, '/stores/' + store.slug + '/stock');
  await openProduct(page, store);
  const drawer = await addToBag(page);
  await drawer.getByLabel('Pagamento simulado').selectOption('declined');
  await drawer.getByRole('button', { name: /Finalizar compra simulada/ }).click();
  await expect(page.getByText('Pagamento simulado recusado.', { exact: true })).toBeVisible();
  expect(await json(page.request, '/stores/' + store.slug + '/stock')).toEqual(before);
  await page.getByRole('button', { name: /Abrir sacola com 1 item/ }).click();
  await expect(page.getByRole('dialog', { name: 'Sua sacola' })).toContainText(
    store.products[0].name,
  );
  const response = await page.request.post('/api/stores/' + store.slug + '/checkout', {
    data: {
      reference: crypto.randomUUID(),
      items: [{ productId: stores.complete.products[0].id, quantity: 1 }],
      payment: 'approved',
      fulfillment: 'pickup',
      coupon: '',
    },
  });
  expect(response.status()).toBe(400);
});

test('avaliações exigem conta e compra aprovada e usam o nome da conta', async ({
  page,
  stores,
}) => {
  await openProduct(page, stores.essential);
  await expect(page.getByRole('button', { name: /Dicas com IA/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Ver avaliações/ })).toHaveCount(0);
  expect(
    (
      await page.request.post('/api/stores/' + stores.essential.slug + '/chat', {
        data: { message: 'Sugira um produto' },
      })
    ).status(),
  ).toBe(403);
  await openProduct(page, stores.complete);
  await page.getByRole('button', { name: /Ver avaliações e avaliar/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Avaliações do produto' });
  await expect(dialog.getByRole('button', { name: 'Entrar para avaliar' })).toBeVisible();
  await expect(dialog.getByLabel('Comentário')).toHaveCount(0);
  const reviewPath =
    '/stores/' + stores.complete.slug + '/reviews/' + stores.complete.products[0].id;
  const reviewPayload = {
    author: 'Autor forjado',
    rating: 4,
    comment: 'Avaliação criada pelo teste E2E.',
  };
  expect((await page.request.post('/api' + reviewPath, { data: reviewPayload })).status()).toBe(
    401,
  );
  await json(page.request, '/stores/' + stores.complete.slug + '/customers', 'POST', {
    name: 'Avaliador E2E',
    email: 'avaliador-' + Date.now() + '@example.test',
    password: buyerPassword,
  });
  await page.reload();
  await page.getByRole('button', { name: /Ver avaliações e avaliar/ }).click();
  await expect(dialog).toContainText('após uma compra aprovada');
  expect((await page.request.post('/api' + reviewPath, { data: reviewPayload })).status()).toBe(
    403,
  );
  await json(page.request, '/stores/' + stores.complete.slug + '/checkout', 'POST', {
    reference: crypto.randomUUID(),
    items: [{ productId: stores.complete.products[0].id, quantity: 1 }],
    payment: 'approved',
    fulfillment: 'pickup',
    coupon: '',
  });
  await page.reload();
  await page.getByRole('button', { name: /Ver avaliações e avaliar/ }).click();
  await expect(dialog.locator('.review-author')).toContainText('Avaliador E2E');
  await expect(dialog.getByLabel('Seu nome')).toHaveCount(0);
  await dialog.getByLabel('Sua nota').selectOption({ label: '★★★★ · Muito bom' });
  await dialog.getByLabel('Comentário').fill('Avaliação criada pelo teste E2E.');
  await dialog.getByRole('button', { name: 'Publicar avaliação' }).click();
  await expect(dialog.getByText('Avaliação criada pelo teste E2E.')).toBeVisible();
  await expect(dialog.getByText('Compra verificada', { exact: true })).toBeVisible();
  const forged = await json(page.request, reviewPath, 'POST', reviewPayload);
  expect(forged.author).toBe('Avaliador E2E');
  const foreign = await page.request.get(
    '/api/stores/' + stores.essential.slug + '/products/' + stores.complete.products[0].id,
  );
  expect(foreign.status()).toBe(404);
});

test('coleção permanece na loja e a vitrine tem somente um menu de conta', async ({
  page,
  stores,
}) => {
  const store = stores.complete;
  await page.goto('/loja/' + store.slug);
  await expect(page.locator('.platform-header')).toHaveCount(0);
  await expect(page.locator('.session-profiles')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Acessar minha loja', exact: true })).toHaveCount(1);
  await expect(page.locator('.buyer-account-button')).toHaveCount(1);
  await page.getByRole('link', { name: 'Explorar a coleção ↗', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('/loja/' + store.slug + '#colecao$'));
  await expect(page.getByRole('heading', { name: 'Nossa coleção.' })).toBeInViewport();
  await openProduct(page, store);
  await page.getByRole('link', { name: 'Coleção', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('/loja/' + store.slug + '#colecao$'));
  await expect(page.getByRole('heading', { name: 'Nossa coleção.' })).toBeInViewport();
});

test('IA sem configuração informa indisponibilidade sem inventar resposta', async ({
  page,
  stores,
}) => {
  test.skip(process.env.E2E_REAL_AI === '1', 'Esta rodada usa o provedor real.');
  await page.goto('/loja/' + stores.intelligent.slug);
  await page.getByRole('button', { name: 'Abrir chat de produtos com IA' }).click();
  const chat = page.getByRole('dialog', { name: 'Consultor de produtos com Gemini' });
  await chat.getByLabel('Sua mensagem').fill('Quais produtos você recomenda?');
  await chat.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(chat.getByRole('alert')).toContainText('precisa configurar o Gemini');
  await expect(chat.locator('.chat-product-link')).toHaveCount(0);
});

test('Gemini real consulta estoque e recomenda links da loja fictícia', async ({
  page,
  stores,
}) => {
  test.skip(
    process.env.E2E_REAL_AI !== '1',
    'Execute npm run test:e2e -- --ai para chamadas reais.',
  );
  test.setTimeout(120000);
  const store = stores.intelligent;
  await page.goto('/loja/' + store.slug);
  await page.getByRole('button', { name: 'Abrir chat de produtos com IA' }).click();
  const chat = page.getByRole('dialog', { name: 'Consultor de produtos com Gemini' });
  await chat
    .getByLabel('Sua mensagem')
    .fill('Sugira um produto disponível desta loja e mostre seu link.');
  await chat.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(chat.locator('.chat-product-link').first()).toBeVisible({ timeout: 65000 });
  await chat.locator('.chat-product-link').first().click();
  await expect(page).toHaveURL(new RegExp('/loja/' + store.slug + '/produto/'));
  await setAuth(page, stores.adminState, store.slug);
  await page.goto('/admin/' + store.slug);
  await page.getByRole('button', { name: 'Abrir agente', exact: true }).click();
  await page
    .getByLabel('Sua pergunta')
    .fill('Consulte as ferramentas e informe os nomes dos produtos e seus saldos disponíveis.');
  await page.getByRole('button', { name: /Consultar agente/ }).click();
  await expect(page.locator('.answer')).toContainText('Álamo', { timeout: 65000 });
  await expect(page.locator('.answer')).toContainText('20');
});
