import 'reflect-metadata';
import { BadGatewayException, BadRequestException, Controller, Get } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Type } from '@nestjs/common';

export async function bootstrap(
  module: Type<unknown>,
  name: string,
  defaultPort: number,
): Promise<void> {
  const app = await NestFactory.create(module);
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  const configuration = new DocumentBuilder()
    .setTitle(`Gerar Commerce — ${name}`)
    .setDescription(
      'API educacional. Dados de demonstração em memória; persistência e checkout no backlog.',
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
  storage: 'none' | 'memory-demo' = 'memory-demo',
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
