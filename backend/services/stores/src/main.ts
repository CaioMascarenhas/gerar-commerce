import 'reflect-metadata';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import {
  BadRequestException,
  ConflictException,
  Controller,
  Get,
  Module,
  NotFoundException,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import {
  bootstrap,
  database,
  migrate,
  callService,
  healthController,
  text,
  image,
  imageFrame,
  productInput,
  slugInput,
} from '@gerar/platform';
import { categories, composeStore, featureCatalog, validateOptions } from '@gerar/framework';
import { CustomersController } from './customers.js';
const scrypt = promisify(scryptCallback);
await migrate(
  'CREATE SCHEMA IF NOT EXISTS stores; CREATE TABLE IF NOT EXISTS stores.shops (slug text PRIMARY KEY, data jsonb NOT NULL, password_hash text NOT NULL, active boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()); CREATE TABLE IF NOT EXISTS stores.sessions (token_hash text PRIMARY KEY, slug text NOT NULL REFERENCES stores.shops(slug) ON DELETE CASCADE, expires_at timestamptz NOT NULL);',
);
function configuration(body: any, slug: string) {
  if (!body || !Object.hasOwn(categories, body.category))
    throw new BadRequestException('Selecione Eletrônicos, Construção ou Roupas.');
  let options;
  try {
    options = validateOptions(body.options);
  } catch (error) {
    throw new BadRequestException((error as Error).message);
  }
  const store = {
    slug,
    name: text(body.name, 'Nome da loja', 80, 2),
    description: text(body.description, 'Descrição da loja', 600),
    cover: image(body.cover, true),
    coverFrame: imageFrame(body.coverFrame ?? { fit: 'cover', x: 50, y: 50, zoom: 1 }),
    category: body.category,
    options,
  };
  return { ...store, blueprint: composeStore(store) };
}
// Atualiza apenas a composição antiga, preservando cadastros, senhas, fotos e produtos.
for (const row of (
  await database.query(
    "SELECT slug,data FROM stores.shops WHERE data#>'{blueprint,configuration,features}' ? 'recommendations'",
  )
).rows) {
  await database.query(
    "UPDATE stores.shops SET data=jsonb_set(data,'{blueprint}',$2::jsonb) WHERE slug=$1 AND data=$3::jsonb",
    [row.slug, JSON.stringify(composeStore(row.data)), JSON.stringify(row.data)],
  );
}
async function shop(slug: string) {
  slugInput(slug);
  const result = await database.query(
    'SELECT data FROM stores.shops WHERE slug=$1 AND active=true',
    [slug],
  );
  if (!result.rowCount) throw new NotFoundException('Loja não encontrada.');
  return result.rows[0].data;
}
function hash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
@Controller()
class StoresController {
  @Get('features') features() {
    return { features: featureCatalog, categories };
  }
  @Get('stores') async list() {
    return (
      await database.query(
        'SELECT data FROM stores.shops WHERE active=true ORDER BY created_at DESC LIMIT 30',
      )
    ).rows.map((row) => row.data);
  }
  @Get('stores/:slug') get(@Param('slug') slug: string) {
    return shop(slug);
  }
  @Post('internal/stores') async create(@Body() body: any) {
    const slug = slugInput(body?.slug);
    const data = configuration(body, slug);
    const password = text(body.password, 'Senha', 128, 6);
    if (!Array.isArray(body.products) || body.products.length < 1 || body.products.length > 30)
      throw new BadRequestException('Adicione de 1 a 30 produtos para criar a loja.');
    const products = body.products.map(productInput);
    const salt = randomBytes(16).toString('hex');
    const passwordHash =
      salt + ':' + ((await scrypt(password, salt, 64)) as Buffer).toString('hex');
    try {
      await database.query('INSERT INTO stores.shops(slug,data,password_hash) VALUES ($1,$2,$3)', [
        slug,
        data,
        passwordHash,
      ]);
    } catch (error) {
      if ((error as any).code === '23505')
        throw new ConflictException('Este endereço já está em uso. Escolha outro.');
      throw error;
    }
    try {
      const created = await callService<any[]>(
        'catalog',
        '/internal/stores/' + slug + '/seed',
        'POST',
        { products, category: data.category },
      );
      await callService('inventory', '/internal/stores/' + slug + '/seed', 'POST', {
        products: created.map((p, i) => ({ id: p.id, stock: products[i].stock })),
      });
      await database.query('UPDATE stores.shops SET active=true WHERE slug=$1', [slug]);
      return data;
    } catch (error) {
      try {
        await callService('catalog', '/internal/stores/' + slug, 'DELETE');
        await callService('inventory', '/internal/stores/' + slug, 'DELETE');
        await database.query('DELETE FROM stores.shops WHERE slug=$1 AND active=false', [slug]);
      } catch {
        console.error('Provisionamento pendente de limpeza para a loja:', slug);
      }
      throw error;
    }
  }
  @Put('internal/stores/:slug') async update(@Param('slug') slug: string, @Body() body: any) {
    await shop(slug);
    const data = configuration(body, slug);
    await database.query('UPDATE stores.shops SET data=$2 WHERE slug=$1 AND active=true', [
      slug,
      data,
    ]);
    return data;
  }
  @Post('internal/stores/:slug/login') async login(@Param('slug') slug: string, @Body() body: any) {
    await shop(slug);
    const password = text(body?.password, 'Senha', 128, 6);
    const result = await database.query('SELECT password_hash FROM stores.shops WHERE slug=$1', [
      slug,
    ]);
    const [salt, expected] = result.rows[0].password_hash.split(':');
    const supplied = (await scrypt(password, salt, 64)) as Buffer;
    if (!timingSafeEqual(supplied, Buffer.from(expected, 'hex')))
      throw new UnauthorizedException('Senha incorreta.');
    const token = randomBytes(32).toString('hex');
    await database.query('DELETE FROM stores.sessions WHERE expires_at < now()');
    await database.query(
      "INSERT INTO stores.sessions(token_hash,slug,expires_at) VALUES ($1,$2,now()+interval '7 days')",
      [hash(token), slug],
    );
    return { token };
  }
  @Post('internal/stores/:slug/session') async session(
    @Param('slug') slug: string,
    @Body() body: any,
  ) {
    if (typeof body?.token !== 'string' || body.token.length !== 64)
      throw new UnauthorizedException('Faça login para administrar esta loja.');
    const result = await database.query(
      'SELECT 1 FROM stores.sessions WHERE token_hash=$1 AND slug=$2 AND expires_at>now()',
      [hash(body.token), slug],
    );
    if (!result.rowCount) throw new UnauthorizedException('Sessão expirada. Entre novamente.');
    return { authenticated: true };
  }
  @Delete('internal/stores/:slug/session') async logout(
    @Param('slug') slug: string,
    @Body() body: any,
  ) {
    if (typeof body?.token === 'string')
      await database.query('DELETE FROM stores.sessions WHERE token_hash=$1 AND slug=$2', [
        hash(body.token),
        slug,
      ]);
    return { ok: true };
  }
}
@Module({
  controllers: [
    StoresController,
    CustomersController,
    healthController('stores', 3006, 'postgres'),
  ],
})
class StoresModule {}
await bootstrap(StoresModule, 'Lojas e sessões administrativas', 3006);
