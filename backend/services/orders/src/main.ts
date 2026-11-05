import 'reflect-metadata';
import { Controller, Get, Module, Param } from '@nestjs/common';
import { bootstrap, healthController, safeCustomerId } from '@gerar/platform';
import type { OrderSummary } from '@gerar/contracts';

/** Fixtures explícitas. Não representam vendas reais nem implementação de checkout. */
const demoOrders = [
  {
    id: 'demo-001',
    customerId: 'cliente-demo',
    status: 'paid',
    totalInCents: 2490,
    items: [{ productId: 'caderno', quantity: 1 }],
  },
  {
    id: 'demo-002',
    customerId: 'outro-cliente',
    status: 'paid',
    totalInCents: 3990,
    items: [{ productId: 'caneca', quantity: 1 }],
  },
];

@Controller('orders')
class OrdersController {
  @Get() list() {
    return demoOrders;
  }
  @Get('summary') summary(): OrderSummary {
    return {
      count: demoOrders.length,
      totalInCents: demoOrders.reduce((total, order) => total + order.totalInCents, 0),
      source: 'demo',
    };
  }
  @Get('history/:customerId') history(@Param('customerId') customerId: string) {
    return demoOrders.filter((order) => order.customerId === safeCustomerId(customerId));
  }
}

@Module({ controllers: [OrdersController, healthController('orders', 3003)] })
class OrdersModule {}
await bootstrap(OrdersModule, 'Pedidos', 3003);
