import {
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from 'node:crypto';
import { promisify } from 'node:util';
import {
  Body,
  Controller,
  Param,
  Post,
  Delete,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { database, migrate, text, slugInput } from '@gerar/platform';

const scrypt = promisify(scryptCallback);
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
await migrate(`
  CREATE SCHEMA IF NOT EXISTS stores;
  CREATE TABLE IF NOT EXISTS stores.customers (
    id uuid PRIMARY KEY, store_slug text NOT NULL, name text NOT NULL,
    email text NOT NULL, password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(store_slug,email)
  );
  CREATE TABLE IF NOT EXISTS stores.customer_sessions (
    token_hash text PRIMARY KEY, customer_id uuid NOT NULL REFERENCES stores.customers(id),
    expires_at timestamptz NOT NULL
  );
`);
function credentials(body: any) {
  const email = text(body?.email, 'E-mail', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new BadRequestException('Informe um e-mail válido.');
  const password = text(body?.password, 'Senha', 128, 8);
  return { email, password };
}
async function requireStore(slug: string) {
  slugInput(slug);
  if (
    !(await database.query('SELECT 1 FROM stores.shops WHERE slug=$1 AND active=true', [slug]))
      .rowCount
  )
    throw new NotFoundException('Loja não encontrada.');
}
async function session(customer: { id: string; name: string; email: string }) {
  const token = randomBytes(32).toString('hex');
  await database.query('DELETE FROM stores.customer_sessions WHERE expires_at < now()');
  await database.query(
    "INSERT INTO stores.customer_sessions VALUES ($1,$2,now()+interval '7 days')",
    [digest(token), customer.id],
  );
  return { token, customer: { id: customer.id, name: customer.name, email: customer.email } };
}
@Controller('internal/stores/:slug')
export class CustomersController {
  @Post('customers') async register(@Param('slug') slug: string, @Body() body: any) {
    await requireStore(slug);
    const { email, password } = credentials(body);
    const name = text(body?.name, 'Nome', 80, 2);
    const salt = randomBytes(16).toString('hex');
    const passwordHash =
      salt + ':' + ((await scrypt(password, salt, 64)) as Buffer).toString('hex');
    const customer = { id: randomUUID(), name, email };
    try {
      await database.query(
        'INSERT INTO stores.customers(id,store_slug,name,email,password_hash) VALUES ($1,$2,$3,$4,$5)',
        [customer.id, slug, name, email, passwordHash],
      );
    } catch (error) {
      if ((error as any).code === '23505')
        throw new ConflictException('Este e-mail já possui conta nesta loja. Entre com sua senha.');
      throw error;
    }
    return session(customer);
  }
  @Post('customer-login') async login(@Param('slug') slug: string, @Body() body: any) {
    await requireStore(slug);
    const { email, password } = credentials(body);
    const customer = (
      await database.query(
        'SELECT id,name,email,password_hash FROM stores.customers WHERE store_slug=$1 AND email=$2',
        [slug, email],
      )
    ).rows[0];
    // Calcula o hash também quando o e-mail não existe.
    const [salt, expected] = (customer?.password_hash ?? 'inexistente:' + '0'.repeat(128)).split(
      ':',
    );
    const supplied = (await scrypt(password, salt, 64)) as Buffer;
    if (!customer || !timingSafeEqual(supplied, Buffer.from(expected, 'hex')))
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    return session(customer);
  }
  @Post('customer-session') async current(@Param('slug') slug: string, @Body() body: any) {
    slugInput(slug);
    if (typeof body?.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token))
      throw new UnauthorizedException('Entre ou crie sua conta para comprar nesta loja.');
    const customer = (
      await database.query(
        `SELECT c.id,c.name,c.email FROM stores.customers c
      JOIN stores.customer_sessions s ON s.customer_id=c.id
      WHERE c.store_slug=$1 AND s.token_hash=$2 AND s.expires_at>now()`,
        [slug, digest(body.token)],
      )
    ).rows[0];
    if (!customer) throw new UnauthorizedException('Sua sessão expirou. Entre novamente.');
    return customer;
  }
  @Delete('customer-session') async logout(@Param('slug') slug: string, @Body() body: any) {
    if (typeof body?.token === 'string')
      await database.query(
        `DELETE FROM stores.customer_sessions s USING stores.customers c
      WHERE s.customer_id=c.id AND c.store_slug=$1 AND s.token_hash=$2`,
        [slugInput(slug), digest(body.token)],
      );
    return { ok: true };
  }
}
