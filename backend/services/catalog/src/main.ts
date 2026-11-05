import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Post,
  Put,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  bootstrap,
  database,
  migrate,
  transaction,
  healthController,
  productInput,
  text,
  integer,
} from '@gerar/platform';
await migrate(
  'CREATE SCHEMA IF NOT EXISTS catalog; CREATE TABLE IF NOT EXISTS catalog.products (store_slug text NOT NULL, id text NOT NULL, data jsonb NOT NULL, active boolean NOT NULL DEFAULT true, PRIMARY KEY(store_slug,id)); CREATE TABLE IF NOT EXISTS catalog.reviews (id uuid PRIMARY KEY, store_slug text NOT NULL, product_id text NOT NULL, author text NOT NULL, rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5), comment text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());',
);
async function find(slug: string, id: string) {
  const result = await database.query(
    'SELECT data FROM catalog.products WHERE store_slug=$1 AND id=$2 AND active=true',
    [slug, id],
  );
  if (!result.rowCount) throw new NotFoundException('Produto não encontrado nesta loja.');
  return result.rows[0].data;
}
@Controller()
class CatalogController {
  @Get('stores/:slug/products') async list(@Param('slug') slug: string) {
    return (
      await database.query(
        'SELECT data FROM catalog.products WHERE store_slug=$1 AND active=true ORDER BY id',
        [slug],
      )
    ).rows.map((row) => row.data);
  }
  @Post('internal/stores/:slug/seed') async seed(@Param('slug') slug: string, @Body() body: any) {
    return transaction(async (client) => {
      const products = [];
      for (const draft of body.products) {
        const { stock: _, ...input } = productInput(draft);
        const product = { ...input, category: body.category, id: randomUUID() };
        await client.query('INSERT INTO catalog.products(store_slug,id,data) VALUES ($1,$2,$3)', [
          slug,
          product.id,
          product,
        ]);
        products.push(product);
      }
      return products;
    });
  }
  @Delete('internal/stores/:slug') async cleanup(@Param('slug') slug: string) {
    await database.query('DELETE FROM catalog.products WHERE store_slug=$1', [slug]);
    return { ok: true };
  }
  @Post('internal/stores/:slug/products') async create(
    @Param('slug') slug: string,
    @Body() body: any,
  ) {
    const { stock: _, ...input } = productInput(body);
    const product = { ...input, id: randomUUID(), category: body.category };
    await database.query('INSERT INTO catalog.products(store_slug,id,data) VALUES ($1,$2,$3)', [
      slug,
      product.id,
      product,
    ]);
    return product;
  }
  @Put('internal/stores/:slug/products/:id') async update(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const previous = await find(slug, id);
    const { stock: _, ...input } = productInput(body);
    const product = { ...previous, ...input };
    await database.query('UPDATE catalog.products SET data=$3 WHERE store_slug=$1 AND id=$2', [
      slug,
      id,
      product,
    ]);
    return product;
  }
  @Delete('internal/stores/:slug/products/:id') async remove(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    return transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['catalog:' + slug]);
      const result = await client.query(
        'SELECT id FROM catalog.products WHERE store_slug=$1 AND active=true FOR UPDATE',
        [slug],
      );
      if (!result.rows.some((row) => row.id === id))
        throw new NotFoundException('Produto não encontrado.');
      if (result.rowCount! <= 1)
        throw new BadRequestException('A loja precisa manter pelo menos um produto.');
      await client.query('UPDATE catalog.products SET active=false WHERE store_slug=$1 AND id=$2', [
        slug,
        id,
      ]);
      return { ok: true };
    });
  }
  @Get('stores/:slug/reviews/:id') async reviews(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    await find(slug, id);
    return (
      await database.query(
        'SELECT id,author,rating,comment,created_at AS "createdAt" FROM catalog.reviews WHERE store_slug=$1 AND product_id=$2 ORDER BY created_at DESC LIMIT 30',
        [slug, id],
      )
    ).rows;
  }
  @Post('internal/stores/:slug/reviews/:id') async review(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    await find(slug, id);
    return (
      await database.query(
        'INSERT INTO catalog.reviews(id,store_slug,product_id,author,rating,comment) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,author,rating,comment',
        [
          randomUUID(),
          slug,
          id,
          text(body?.author, 'Seu nome', 60),
          integer(body?.rating, 'Nota', 1, 5),
          text(body?.comment, 'Comentário', 500),
        ],
      )
    ).rows[0];
  }
}
@Module({ controllers: [CatalogController, healthController('catalog', 3001, 'postgres')] })
class CatalogModule {}
await bootstrap(CatalogModule, 'Catálogo e avaliações', 3001);
