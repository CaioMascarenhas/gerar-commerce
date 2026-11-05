import 'reflect-metadata';
import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpException,
  Module,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { bootstrap, getJson, healthController, safeCustomerId } from '@gerar/backend';
import { deriveProduct, hasFeature } from '@gerar/framework';

const blueprint = deriveProduct(process.env['PRODUCT_PROFILE'] ?? 'essencial');
const services = {
  catalog: process.env['CATALOG_URL'] ?? 'http://127.0.0.1:3001',
  inventory: process.env['INVENTORY_URL'] ?? 'http://127.0.0.1:3002',
  orders: process.env['ORDERS_URL'] ?? 'http://127.0.0.1:3003',
  recommendations: process.env['RECOMMENDATIONS_URL'] ?? 'http://127.0.0.1:3004',
  assistant: process.env['AI_ASSISTANT_URL'] ?? 'http://127.0.0.1:3005',
};

@Controller()
class GatewayController {
  @Get('configuration') configuration() {
    return blueprint;
  }
  @Get('derivations/:profile') derive(@Param('profile') profile: string) {
    try {
      return deriveProduct(profile);
    } catch {
      throw new BadRequestException('Perfil inválido. Use essencial ou assistida.');
    }
  }
  @Get('products') products() {
    return getJson(services.catalog, '/products');
  }
  @Get('stock') stock() {
    return getJson(services.inventory, '/stock');
  }
  @Get('orders/summary') summary() {
    return getJson(services.orders, '/orders/summary');
  }
  @Get('recommendations/:customerId') recommendations(@Param('customerId') customerId: string) {
    return getJson(
      services.recommendations,
      '/recommendations/' + encodeURIComponent(safeCustomerId(customerId)),
    );
  }
  @Get('services')
  async health() {
    const enabled = Object.entries(services).filter(
      ([name]) => name !== 'assistant' || hasFeature(blueprint, 'aiAssistant'),
    );
    return Promise.all(
      enabled.map(async ([name, url]) => {
        try {
          return { name, ...(await getJson<Record<string, unknown>>(url, '/health')) };
        } catch {
          return { name, status: 'unavailable' };
        }
      }),
    );
  }
  @Post('assistant/query')
  async query(@Body() body: { message?: unknown }, @Headers('x-demo-admin') adminToken?: string) {
    if (!hasFeature(blueprint, 'aiAssistant'))
      throw new NotFoundException('Assistente desabilitado nesta loja.');
    if (adminToken !== (process.env['DEMO_ADMIN_TOKEN'] ?? 'gerar-demo'))
      throw new ForbiddenException('Ative a sessão administrativa de demonstração.');
    if (
      typeof body?.message !== 'string' ||
      body.message.trim().length < 1 ||
      body.message.length > 1500
    )
      throw new BadRequestException('Informe uma pergunta de até 1.500 caracteres.');
    const response = await fetch(services.assistant + '/api/assistant/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-demo-admin': adminToken },
      body: JSON.stringify({ message: body.message }),
      signal: AbortSignal.timeout(45000),
    }).catch(() => {
      throw new BadGatewayException('O assistente está indisponível.');
    });
    const result: unknown = await response.json();
    if (!response.ok)
      throw new HttpException(
        typeof result === 'object' && result !== null ? result : 'Erro no assistente.',
        response.status,
      );
    return result;
  }
}

@Module({ controllers: [GatewayController, healthController('gateway', 3000, 'none')] })
class GatewayModule {}
await bootstrap(GatewayModule, 'API Gateway', 3000);
