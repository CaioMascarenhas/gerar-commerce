import 'reflect-metadata';
import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Post,
  Put,
  ConflictException,
} from '@nestjs/common';
import {
  bootstrap,
  database,
  migrate,
  transaction,
  healthController,
  integer,
} from '@gerar/platform';
await migrate(
  'CREATE SCHEMA IF NOT EXISTS inventory; CREATE TABLE IF NOT EXISTS inventory.stock (store_slug text NOT NULL, product_id text NOT NULL, available integer NOT NULL CHECK(available>=0), PRIMARY KEY(store_slug,product_id)); CREATE TABLE IF NOT EXISTS inventory.reservations (store_slug text NOT NULL, reference text NOT NULL, items jsonb NOT NULL, state text NOT NULL, PRIMARY KEY(store_slug,reference));',
);
@Controller()
class InventoryController {
  @Get('stores/:slug/stock') async list(@Param('slug') slug: string) {
    return (
      await database.query(
        'SELECT product_id AS "productId",available FROM inventory.stock WHERE store_slug=$1',
        [slug],
      )
    ).rows;
  }
  @Post('internal/stores/:slug/seed') async seed(@Param('slug') slug: string, @Body() body: any) {
    await transaction(async (client) => {
      for (const product of body.products)
        await client.query(
          'INSERT INTO inventory.stock(store_slug,product_id,available) VALUES ($1,$2,$3)',
          [slug, product.id, integer(product.stock, 'Estoque', 0, 1000000)],
        );
    });
    return { ok: true };
  }
  @Delete('internal/stores/:slug') async cleanup(@Param('slug') slug: string) {
    await database.query('DELETE FROM inventory.stock WHERE store_slug=$1', [slug]);
    return { ok: true };
  }
  @Put('internal/stores/:slug/stock/:id') async update(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    await database.query(
      'INSERT INTO inventory.stock(store_slug,product_id,available) VALUES ($1,$2,$3) ON CONFLICT(store_slug,product_id) DO UPDATE SET available=$3',
      [slug, id, integer(body?.available, 'Estoque', 0, 1000000)],
    );
    return { ok: true };
  }
  @Post('internal/stores/:slug/reserve') async reserve(
    @Param('slug') slug: string,
    @Body() body: any,
  ) {
    return transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        slug + ':' + body.reference,
      ]);
      const existing = await client.query(
        'SELECT state,items FROM inventory.reservations WHERE store_slug=$1 AND reference=$2',
        [slug, body.reference],
      );
      if (existing.rowCount) {
        const saved = existing.rows[0].items;
        if (
          saved.length !== body.items.length ||
          saved.some(
            (item: any, index: number) =>
              item.productId !== body.items[index]?.productId ||
              item.quantity !== body.items[index]?.quantity,
          )
        )
          throw new ConflictException('Referência de reserva já usada com outros produtos.');
        return { state: existing.rows[0].state };
      }
      for (const item of [...body.items].sort((a: any, b: any) =>
        a.productId.localeCompare(b.productId),
      )) {
        const quantity = integer(item.quantity, 'Quantidade', 1, 1000);
        const result = await client.query(
          'UPDATE inventory.stock SET available=available-$3 WHERE store_slug=$1 AND product_id=$2 AND available >= $3 RETURNING available',
          [slug, item.productId, quantity],
        );
        if (!result.rowCount)
          throw new ConflictException('Estoque insuficiente para um dos produtos.');
      }
      await client.query(
        "INSERT INTO inventory.reservations(store_slug,reference,items,state) VALUES ($1,$2,$3,'reserved')",
        [slug, body.reference, JSON.stringify(body.items)],
      );
      return { state: 'reserved' };
    });
  }
  @Post('internal/stores/:slug/reservations/:reference/:action') async finish(
    @Param('slug') slug: string,
    @Param('reference') reference: string,
    @Param('action') action: string,
  ) {
    return transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [slug + ':' + reference]);
      const result = await client.query(
        'SELECT items,state FROM inventory.reservations WHERE store_slug=$1 AND reference=$2 FOR UPDATE',
        [slug, reference],
      );
      const row = result.rows[0];
      if (!row || row.state !== 'reserved') return { ok: true };
      if (action === 'release')
        for (const item of row.items)
          await client.query(
            'UPDATE inventory.stock SET available=available+$3 WHERE store_slug=$1 AND product_id=$2',
            [slug, item.productId, item.quantity],
          );
      await client.query(
        'UPDATE inventory.reservations SET state=$3 WHERE store_slug=$1 AND reference=$2',
        [slug, reference, action === 'release' ? 'released' : 'confirmed'],
      );
      return { ok: true };
    });
  }
}
@Module({ controllers: [InventoryController, healthController('inventory', 3002, 'postgres')] })
class InventoryModule {}
await bootstrap(InventoryModule, 'Estoque e reservas', 3002);
