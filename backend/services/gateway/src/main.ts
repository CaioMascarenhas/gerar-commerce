import 'reflect-metadata';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Module,
  Param,
  Post,
  Put,
  Req,
  Res,
  HttpException,
} from '@nestjs/common';
import {
  bootstrap,
  callService,
  healthController,
  productInput,
  slugInput,
  text,
} from '@gerar/platform';
const attempts = new Map<string, { count: number; until: number }>();
function throttle(key: string, limit: number) {
  if (attempts.size > 10000)
    for (const [id, entry] of attempts) if (entry.until < Date.now()) attempts.delete(id);
  let entry = attempts.get(key);
  if (!entry || entry.until < Date.now()) {
    entry = { count: 0, until: Date.now() + 60000 };
    attempts.set(key, entry);
  }
  if (++entry.count > limit) throw new HttpException('Muitas tentativas. Aguarde um minuto.', 429);
}
function token(req: any, slug: string, buyer = false) {
  const name = (buyer ? 'gerar_buyer_' : 'gerar_') + slug + '=';
  return (
    (req.headers.cookie || '')
      .split(';')
      .map((v: string) => v.trim())
      .find((v: string) => v.startsWith(name))
      ?.slice(name.length) ?? ''
  );
}
async function admin(req: any, slug: string) {
  slugInput(slug);
  await callService('stores', '/internal/stores/' + slug + '/session', 'POST', {
    token: token(req, slug),
  });
}
async function store(slug: string) {
  slugInput(slug);
  return callService('stores', '/stores/' + slug);
}
function path(slug: string, tail = '') {
  return '/stores/' + slugInput(slug) + tail;
}
function cookie(slug: string, value: string, maxAge: number, buyer = false) {
  return (
    (buyer ? 'gerar_buyer_' : 'gerar_') +
    slug +
    '=' +
    value +
    '; HttpOnly; SameSite=Strict; Path=/api/stores/' +
    slug +
    '; Max-Age=' +
    maxAge +
    (process.env['COOKIE_SECURE'] === 'true' ? '; Secure' : '')
  );
}
@Controller()
class GatewayController {
  @Post('stores/:slug/customers') async registerCustomer(
    @Param('slug') slug: string,
    @Body() body: any,
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    throttle('buyer-register:' + req.ip, 10);
    const result = await callService(
      'stores',
      '/internal' + path(slug, '/customers'),
      'POST',
      body,
    );
    res.setHeader('Set-Cookie', cookie(slug, result.token, 604800, true));
    return result.customer;
  }
  @Post('stores/:slug/customer-login') async loginCustomer(
    @Param('slug') slug: string,
    @Body() body: any,
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    throttle('buyer-login:' + req.ip + ':' + slug, 10);
    const result = await callService(
      'stores',
      '/internal' + path(slug, '/customer-login'),
      'POST',
      body,
    );
    res.setHeader('Set-Cookie', cookie(slug, result.token, 604800, true));
    return result.customer;
  }
  @Get('stores/:slug/customer-session') customerSession(
    @Param('slug') slug: string,
    @Req() req: any,
  ) {
    return callService('stores', '/internal' + path(slug, '/customer-session'), 'POST', {
      token: token(req, slug, true),
    });
  }
  @Post('stores/:slug/customer-logout') async logoutCustomer(
    @Param('slug') slug: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    await callService('stores', '/internal' + path(slug, '/customer-session'), 'DELETE', {
      token: token(req, slug, true),
    });
    res.setHeader('Set-Cookie', cookie(slug, '', 0, true));
    return { ok: true };
  }
  @Get('stores/:slug/customer-orders') async customerOrders(
    @Param('slug') slug: string,
    @Req() req: any,
  ) {
    const customer = await this.customerSession(slug, req);
    return callService('orders', '/internal' + path(slug, '/customer-orders/' + customer.id));
  }
  @Get('stores/:slug/products/:id') async product(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    await store(slug);
    return callService('catalog', path(slug, '/products/' + encodeURIComponent(id)));
  }
  @Get('stores/:slug/recommendations') async suggestions(
    @Param('slug') slug: string,
    @Req() req: any,
  ) {
    await store(slug);
    let id = 'visitante';
    if (token(req, slug, true)) {
      try {
        id = (await this.customerSession(slug, req)).id;
      } catch (error) {
        if (!(error instanceof HttpException) || error.getStatus() !== 401) throw error;
      }
    }
    return callService('recommendations', path(slug, '/recommendations/' + id));
  }
  @Post('stores/:slug/chat') async chat(
    @Param('slug') slug: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const shop = await store(slug);
    if (!shop.options.includes('aiAssistant'))
      throw new ForbiddenException('Chat de IA desativado nesta loja.');
    throttle('shopping-chat:' + req.ip, 12);
    return callService('ai', '/internal' + path(slug, '/shopping-chat'), 'POST', body);
  }
  @Get('stores/:slug/assistant-status') async assistantStatus(
    @Param('slug') slug: string,
    @Req() req: any,
  ) {
    await admin(req, slug);
    return callService('ai', '/internal/status');
  }
  @Get('stores/:slug/coupons') async coupons(@Param('slug') slug: string, @Req() req: any) {
    await admin(req, slug);
    return callService('orders', '/internal' + path(slug, '/coupons'));
  }
  @Put('stores/:slug/coupons/:code') async saveCoupon(
    @Param('slug') slug: string,
    @Param('code') code: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    await admin(req, slug);
    return callService(
      'orders',
      '/internal' + path(slug, '/coupons/' + encodeURIComponent(code)),
      'PUT',
      body,
    );
  }
  @Delete('stores/:slug/coupons/:code') async deleteCoupon(
    @Param('slug') slug: string,
    @Param('code') code: string,
    @Req() req: any,
  ) {
    await admin(req, slug);
    return callService(
      'orders',
      '/internal' + path(slug, '/coupons/' + encodeURIComponent(code)),
      'DELETE',
    );
  }
  @Post('stores/:slug/coupon-quote') async quoteCoupon(
    @Param('slug') slug: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    throttle('coupon:' + req.ip, 60);
    await store(slug);
    return callService('orders', '/internal' + path(slug, '/coupon-quote'), 'POST', body);
  }
  @Get('features') features() {
    return callService('stores', '/features');
  }
  @Get('stores') list() {
    return callService('stores', '/stores');
  }
  @Post('stores') create(@Body() body: any, @Req() req: any) {
    throttle('create:' + req.ip, 10);
    return callService('stores', '/internal/stores', 'POST', body);
  }
  @Post('generate-products') generate(@Body() body: any, @Req() req: any) {
    throttle('generate:' + req.ip, 6);
    return callService('ai', '/internal/generate-products', 'POST', body);
  }
  @Get('stores/:slug') get(@Param('slug') slug: string) {
    return store(slug);
  }
  @Get('stores/:slug/products') async products(@Param('slug') slug: string) {
    await store(slug);
    return callService('catalog', path(slug, '/products'));
  }
  @Get('stores/:slug/stock') async stock(@Param('slug') slug: string) {
    await store(slug);
    return callService('inventory', path(slug, '/stock'));
  }
  @Get('stores/:slug/recommendations/:customerId') async recommendations(
    @Param('slug') slug: string,
    @Param('customerId') id: string,
    @Req() req: any,
  ) {
    await store(slug);
    text(id, 'Cliente', 80);
    const customer = await this.customerSession(slug, req);
    if (customer.id !== id) throw new ForbiddenException('Histórico restrito à sua conta.');
    return callService('recommendations', path(slug, '/recommendations/' + encodeURIComponent(id)));
  }
  @Post('stores/:slug/checkout') async checkout(
    @Param('slug') slug: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    throttle('checkout:' + req.ip, 30);
    await store(slug);
    return callService('orders', '/internal' + path(slug, '/checkout'), 'POST', {
      ...body,
      customerToken: token(req, slug, true),
    });
  }
  @Post('stores/:slug/login') async login(
    @Param('slug') slug: string,
    @Body() body: any,
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    throttle('login:' + req.ip + ':' + slug, 10);
    slugInput(slug);
    const result = await callService('stores', '/internal' + path(slug, '/login'), 'POST', body);
    res.setHeader('Set-Cookie', cookie(slug, result.token, 604800));
    return { authenticated: true };
  }
  @Get('stores/:slug/session') async session(@Param('slug') slug: string, @Req() req: any) {
    await admin(req, slug);
    return { authenticated: true };
  }
  @Post('stores/:slug/logout') async logout(
    @Param('slug') slug: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    slugInput(slug);
    await callService('stores', '/internal' + path(slug, '/session'), 'DELETE', {
      token: token(req, slug),
    });
    res.setHeader('Set-Cookie', cookie(slug, '', 0));
    return { ok: true };
  }
  @Put('stores/:slug/settings') async settings(
    @Param('slug') slug: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    await admin(req, slug);
    return callService('stores', '/internal' + path(slug), 'PUT', body);
  }
  @Get('stores/:slug/orders') async orders(@Param('slug') slug: string, @Req() req: any) {
    await admin(req, slug);
    return callService('orders', '/internal' + path(slug, '/orders'));
  }
  @Post('stores/:slug/products') async add(
    @Param('slug') slug: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    await admin(req, slug);
    const shop = await store(slug);
    const input = productInput(body);
    const product = await callService('catalog', '/internal' + path(slug, '/products'), 'POST', {
      ...input,
      category: shop.category,
    });
    await callService('inventory', '/internal' + path(slug, '/stock/' + product.id), 'PUT', {
      available: input.stock,
    });
    return product;
  }
  @Put('stores/:slug/products/:id') async update(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    await admin(req, slug);
    const input = productInput(body);
    const product = await callService(
      'catalog',
      '/internal' + path(slug, '/products/' + encodeURIComponent(id)),
      'PUT',
      input,
    );
    await callService(
      'inventory',
      '/internal' + path(slug, '/stock/' + encodeURIComponent(id)),
      'PUT',
      { available: input.stock },
    );
    return product;
  }
  @Delete('stores/:slug/products/:id') async remove(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    await admin(req, slug);
    return callService(
      'catalog',
      '/internal' + path(slug, '/products/' + encodeURIComponent(id)),
      'DELETE',
    );
  }
  @Get('stores/:slug/reviews/:id') async reviews(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    const shop = await store(slug);
    if (!shop.options.includes('reviews'))
      throw new ForbiddenException('Avaliações desabilitadas.');
    return callService('catalog', path(slug, '/reviews/' + encodeURIComponent(id)));
  }
  @Post('stores/:slug/reviews/:id') async review(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    throttle('review:' + req.ip, 10);
    const shop = await store(slug);
    if (!shop.options.includes('reviews'))
      throw new ForbiddenException('Avaliações desabilitadas.');
    return callService(
      'catalog',
      '/internal' + path(slug, '/reviews/' + encodeURIComponent(id)),
      'POST',
      { rating: body?.rating, comment: body?.comment, customerToken: token(req, slug, true) },
    );
  }
  @Get('stores/:slug/review-eligibility/:id') async reviewEligibility(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const shop = await store(slug);
    if (!shop.options.includes('reviews'))
      throw new ForbiddenException('Avaliações desabilitadas.');
    return callService(
      'catalog',
      '/internal' + path(slug, '/review-eligibility/' + encodeURIComponent(id)),
      'POST',
      { customerToken: token(req, slug, true) },
    );
  }
  @Post('stores/:slug/assistant') async query(
    @Param('slug') slug: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    await admin(req, slug);
    throttle('assistant:' + req.ip, 10);
    return callService('ai', '/internal' + path(slug, '/query'), 'POST', body);
  }
  @Get('services') async services() {
    return Promise.all(
      ['stores', 'catalog', 'inventory', 'orders', 'recommendations', 'ai'].map(async (name) => {
        try {
          return await callService(name as any, '/health');
        } catch {
          return { service: name, status: 'unavailable' };
        }
      }),
    );
  }
}
@Module({ controllers: [GatewayController, healthController('gateway', 3000, 'none')] })
class GatewayModule {}
await bootstrap(GatewayModule, 'Gateway da plataforma', 3000);
