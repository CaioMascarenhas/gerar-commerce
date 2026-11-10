import {
  Body,
  Controller,
  Param,
  Get,
  Post,
  Put,
  Delete,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { database, migrate, callService, text, integer } from '@gerar/platform';
import { quoteCheckout, type CouponDefinition } from '@gerar/framework';
await migrate(`CREATE SCHEMA IF NOT EXISTS orders;
  CREATE TABLE IF NOT EXISTS orders.coupons (store_slug text NOT NULL, code text NOT NULL, data jsonb NOT NULL, PRIMARY KEY(store_slug,code));`);
export async function couponDefinition(
  slug: string,
  code: unknown,
): Promise<CouponDefinition | undefined> {
  if (!code) return undefined;
  const normalized = text(code, 'Cupom', 40).toUpperCase();
  const result = await database.query(
    'SELECT data FROM orders.coupons WHERE store_slug=$1 AND code=$2',
    [slug, normalized],
  );
  if (!result.rowCount) throw new BadRequestException('Cupom não encontrado nesta loja.');
  return result.rows[0].data;
}
async function enabled(slug: string) {
  const store = await callService('stores', '/stores/' + slug);
  if (!store.options.includes('coupons'))
    throw new ForbiddenException('Cupons desativados nesta loja.');
  return store;
}
@Controller('internal/stores/:slug')
export class CouponsController {
  @Get('coupons') async list(@Param('slug') slug: string) {
    await enabled(slug);
    return (
      await database.query('SELECT data FROM orders.coupons WHERE store_slug=$1 ORDER BY code', [
        slug,
      ])
    ).rows.map((row) => row.data);
  }
  @Put('coupons/:code') async save(
    @Param('slug') slug: string,
    @Param('code') raw: string,
    @Body() body: any,
  ) {
    await enabled(slug);
    const code = text(raw, 'Código', 40, 3).toUpperCase();
    if (!/^[A-Z0-9_-]+$/.test(code))
      throw new BadRequestException('Use letras, números, hífens ou sublinhados no cupom.');
    const expiresAt = body?.expiresAt ? text(body.expiresAt, 'Validade', 40) : null;
    if (expiresAt && !Number.isFinite(Date.parse(expiresAt)))
      throw new BadRequestException('Validade inválida.');
    if (typeof body?.active !== 'boolean')
      throw new BadRequestException('Informe se o cupom está ativo.');
    const data: CouponDefinition = {
      code,
      percentage: integer(body.percentage, 'Desconto', 1, 100),
      minimumInCents: integer(body.minimumInCents, 'Compra mínima'),
      active: body.active,
      expiresAt,
    };
    await database.query(
      'INSERT INTO orders.coupons VALUES ($1,$2,$3) ON CONFLICT(store_slug,code) DO UPDATE SET data=$3',
      [slug, code, data],
    );
    return data;
  }
  @Delete('coupons/:code') async remove(@Param('slug') slug: string, @Param('code') code: string) {
    await enabled(slug);
    if (
      !(
        await database.query('DELETE FROM orders.coupons WHERE store_slug=$1 AND code=$2', [
          slug,
          code.toUpperCase(),
        ])
      ).rowCount
    )
      throw new NotFoundException('Cupom não encontrado.');
    return { ok: true };
  }
  @Post('coupon-quote') async quote(@Param('slug') slug: string, @Body() body: any) {
    const store = await enabled(slug);
    const definition = await couponDefinition(slug, body?.coupon);
    if (!definition) throw new BadRequestException('Informe um cupom.');
    try {
      return {
        ...quoteCheckout(
          store.blueprint,
          integer(body.subtotalInCents, 'Subtotal', 1, 1000000000),
          body.coupon,
          'pickup',
          definition,
        ),
        code: definition.code,
        percentage: definition.percentage,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }
}
