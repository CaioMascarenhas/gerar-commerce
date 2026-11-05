import 'reflect-metadata';
import { BadGatewayException, BadRequestException, Controller, Get } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Type } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
export * from './database.js';
export * from './commerce.js';

export async function bootstrap(
  module: Type<unknown>,
  name: string,
  defaultPort: number,
): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(module);
  app.useBodyParser('json', { limit: '6mb' });
  app.use((req: any, res: any, next: () => void) => {
    if (
      req.url.startsWith('/api/internal') &&
      req.headers['x-service-key'] !== (process.env['INTERNAL_API_KEY'] ?? 'gerar-local-internal')
    ) {
      res.status(403).json({ message: 'Acesso interno não autorizado.' });
      return;
    }
    if (req.method !== 'GET' && req.headers['sec-fetch-site'] === 'cross-site') {
      res.status(403).json({ message: 'Origem da requisição não permitida.' });
      return;
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  const configuration = new DocumentBuilder()
    .setTitle(`Gerar Commerce — ${name}`)
    .setDescription(
      'Plataforma educacional de lojas dinâmicas. PostgreSQL por domínio; pagamento e planos fictícios.',
    )
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, configuration);
  SwaggerModule.setup('docs', app, document);
  const port = Number(process.env['PORT'] ?? defaultPort);
  await app.listen(port, process.env['HOST'] ?? '127.0.0.1');
}

export function healthController(
  service: string,
  defaultPort: number,
  storage: 'none' | 'memory-demo' | 'postgres' = 'none',
) {
  @Controller('health')
  class HealthController {
    @Get() health() {
      return { service, status: 'ok', port: Number(process.env['PORT'] ?? defaultPort), storage };
    }
  }
  return HealthController;
}

/** Cliente HTTP entre serviços, com timeout e erro explícito; sem acesso ao banco alheio. */
export async function getJson<T>(baseUrl: string, path: string): Promise<T> {
  try {
    const response = await fetch(`${baseUrl}/api${path}`, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } catch {
    throw new BadGatewayException('Um serviço dependente está indisponível.');
  }
}

export function safeCustomerId(value: string): string {
  if (!/^[a-zA-Z0-9_-]{1,60}$/.test(value))
    throw new BadRequestException('Identificador de demonstração inválido.');
  return value;
}
