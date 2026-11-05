import 'reflect-metadata';
import { Controller, Get, Module, Param } from '@nestjs/common';
import { bootstrap, getJson, healthController, safeCustomerId } from '@gerar/platform';
import type { Product } from '@gerar/contracts';

interface HistoricalOrder {
  items: { productId: string; quantity: number }[];
}
const catalogUrl = process.env['CATALOG_URL'] ?? 'http://127.0.0.1:3001';
const ordersUrl = process.env['ORDERS_URL'] ?? 'http://127.0.0.1:3003';

@Controller('recommendations')
class RecommendationsController {
  @Get(':customerId')
  async recommend(@Param('customerId') customerId: string) {
    const [products, history] = await Promise.all([
      getJson<Product[]>(catalogUrl, '/products'),
      getJson<HistoricalOrder[]>(
        ordersUrl,
        '/orders/history/' + encodeURIComponent(safeCustomerId(customerId)),
      ),
    ]);
    const bought = new Set(history.flatMap((order) => order.items.map((item) => item.productId)));
    const categories = new Set(
      products.filter((product) => bought.has(product.id)).map((product) => product.category),
    );
    const byHistory = products.filter(
      (product) => !bought.has(product.id) && categories.has(product.category),
    );
    const fallback = products.filter((product) => !bought.has(product.id));
    return {
      customerId,
      strategy: byHistory.length ? 'history-category' : 'catalog-fallback',
      products: (byHistory.length ? byHistory : fallback).slice(0, 3),
      source: 'demo-history',
    };
  }
}

@Module({
  controllers: [RecommendationsController, healthController('recommendations', 3004, 'none')],
})
class RecommendationsModule {}
await bootstrap(RecommendationsModule, 'Recomendação por histórico', 3004);
