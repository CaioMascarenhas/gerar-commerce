import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { BadRequestException, Body, Controller, Get, Module, Param, Post } from '@nestjs/common';
import {
  bootstrap,
  database,
  migrate,
  transaction,
  callService,
  healthController,
  integer,
  text,
} from '@gerar/platform';
import { quoteCheckout, SimulatedPayment } from '@gerar/framework';
import { CouponsController, couponDefinition } from './coupons.js';

await migrate(
  'CREATE SCHEMA IF NOT EXISTS orders; CREATE TABLE IF NOT EXISTS orders.purchases (store_slug text NOT NULL, reference text NOT NULL, data jsonb NOT NULL, request_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(store_slug,reference)); CREATE TABLE IF NOT EXISTS orders.attempts (store_slug text NOT NULL, reference text NOT NULL, data jsonb NOT NULL, request_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(store_slug,reference));',
);

async function prepare(
  slug: string,
  body: any,
  items: any[],
  reference: string,
  customerId: string,
  requestHash: string,
) {
  const existing = await database.query(
    'SELECT request_hash FROM orders.attempts WHERE store_slug=$1 AND reference=$2',
    [slug, reference],
  );
  if (existing.rowCount) {
    if (existing.rows[0].request_hash !== requestHash)
      throw new BadRequestException('Esta referência já foi usada por outra compra.');
    return;
  }
  const [store, products] = await Promise.all([
    callService('stores', '/stores/' + slug),
    callService<any[]>('catalog', '/stores/' + slug + '/products'),
  ]);
  const lines = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product)
      throw new BadRequestException('Um produto não pertence a esta loja ou foi removido.');
    return {
      ...item,
      name: product.name,
      category: product.category,
      priceInCents: product.priceInCents,
    };
  });
  let quote;
  try {
    quote = quoteCheckout(
      store.blueprint,
      lines.reduce((sum, item) => sum + item.priceInCents * item.quantity, 0),
      body.coupon,
      body.fulfillment,
      await couponDefinition(slug, body.coupon),
    );
  } catch (error) {
    throw new BadRequestException((error as Error).message);
  }
  const order = {
    id: randomUUID(),
    reference,
    customerId,
    items: lines,
    ...quote,
    status: new SimulatedPayment().authorize(body.payment),
    fulfillment: body.fulfillment,
    createdAt: new Date().toISOString(),
  };
  // A intenção é durável antes da chamada distribuída: retries reutilizam exatamente esta cotação.
  await database.query(
    'INSERT INTO orders.attempts(store_slug,reference,data,request_hash) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
    [slug, reference, order, requestHash],
  );
}

@Controller()
class OrdersController {
  @Get('internal/stores/:slug/customer-orders/:customerId') async customerOrders(
    @Param('slug') slug: string,
    @Param('customerId') id: string,
  ) {
    return (
      await database.query(
        "SELECT data FROM orders.purchases WHERE store_slug=$1 AND data->>'customerId'=$2 ORDER BY created_at DESC LIMIT 100",
        [slug, id],
      )
    ).rows.map((row) => row.data);
  }
  @Get('internal/stores/:slug/orders') async list(@Param('slug') slug: string) {
    return (
      await database.query(
        'SELECT data FROM orders.purchases WHERE store_slug=$1 ORDER BY created_at DESC LIMIT 100',
        [slug],
      )
    ).rows.map((row) => row.data);
  }
  @Get('internal/stores/:slug/purchases/:customerId/:productId') async purchased(
    @Param('slug') slug: string,
    @Param('customerId') customerId: string,
    @Param('productId') productId: string,
  ) {
    const result = await database.query(
      "SELECT EXISTS (SELECT 1 FROM orders.purchases p WHERE p.store_slug=$1 AND p.data->>'customerId'=$2 AND p.data->>'status'='paid' AND EXISTS (SELECT 1 FROM jsonb_array_elements(p.data->'items') AS item WHERE item->>'productId'=$3)) AS purchased",
      [slug, customerId, productId],
    );
    return { purchased: result.rows[0].purchased };
  }
  @Post('internal/stores/:slug/checkout') async checkout(
    @Param('slug') slug: string,
    @Body() body: any,
  ) {
    const customer = await callService(
      'stores',
      '/internal/stores/' + slug + '/customer-session',
      'POST',
      { token: body?.customerToken },
    );
    const customerId = customer.id;
    const reference = text(body?.reference, 'Referência', 80);
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30)
      throw new BadRequestException('Carrinho inválido.');
    const items = body.items.map((item: any) => ({
      productId: text(item?.productId, 'Produto', 80),
      quantity: integer(item?.quantity, 'Quantidade', 1, 1000),
    }));
    if (new Set(items.map((i: any) => i.productId)).size !== items.length)
      throw new BadRequestException('Produtos duplicados no carrinho.');
    if (!['approved', 'declined'].includes(body.payment))
      throw new BadRequestException('Selecione o resultado do pagamento simulado.');
    if (!['pickup', 'delivery'].includes(body.fulfillment))
      throw new BadRequestException('Modalidade de entrega inválida.');
    const requestHash = JSON.stringify({
      customerId,
      items,
      payment: body.payment,
      coupon: body.coupon || '',
      fulfillment: body.fulfillment,
    });
    await prepare(slug, body, items, reference, customerId, requestHash);
    return transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        'checkout:' + slug + ':' + reference,
      ]);
      const attempt = (
        await client.query(
          'SELECT data,request_hash FROM orders.attempts WHERE store_slug=$1 AND reference=$2',
          [slug, reference],
        )
      ).rows[0];
      if (attempt.request_hash !== requestHash)
        throw new BadRequestException('Esta referência já foi usada por outra compra.');
      const previous = await client.query(
        'SELECT data FROM orders.purchases WHERE store_slug=$1 AND reference=$2',
        [slug, reference],
      );
      if (previous.rowCount) return previous.rows[0].data;
      const order = attempt.data;
      const reservation = await callService(
        'inventory',
        '/internal/stores/' + slug + '/reserve',
        'POST',
        { reference, items },
      );
      if (reservation.state === 'released' && order.status === 'paid')
        throw new BadRequestException('Tentativa encerrada. Inicie uma nova compra.');
      await callService(
        'inventory',
        '/internal/stores/' +
          slug +
          '/reservations/' +
          encodeURIComponent(reference) +
          (order.status === 'paid' ? '/confirm' : '/release'),
        'POST',
        {},
      );
      await client.query(
        'INSERT INTO orders.purchases(store_slug,reference,data,request_hash) VALUES ($1,$2,$3,$4)',
        [slug, reference, order, requestHash],
      );
      return order;
    });
  }
}
@Module({
  controllers: [OrdersController, CouponsController, healthController('orders', 3003, 'postgres')],
})
class OrdersModule {}
await bootstrap(OrdersModule, 'Pedidos e checkout simulado', 3003);
