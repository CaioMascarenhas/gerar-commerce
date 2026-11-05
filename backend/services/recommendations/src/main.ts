import 'reflect-metadata';
import { Controller, Get, Module, Param } from '@nestjs/common';
import { bootstrap, callService, healthController } from '@gerar/platform';
@Controller('stores/:slug/recommendations')
class RecommendationsController {
  @Get(':customerId') async recommend(
    @Param('slug') slug: string,
    @Param('customerId') customerId: string,
  ) {
    const [products, history] = await Promise.all([
      callService<any[]>('catalog', '/stores/' + slug + '/products'),
      callService<any[]>(
        'orders',
        '/internal/stores/' + slug + '/history/' + encodeURIComponent(customerId),
      ),
    ]);
    const bought = new Set(
      history.flatMap((order) => order.items.map((item: any) => item.productId)),
    );
    const categories = new Set(
      history.flatMap((order) => order.items.map((item: any) => item.category)),
    );
    const remaining = products.filter((p) => !bought.has(p.id));
    const related = remaining.filter((p) => categories.has(p.category));
    return {
      strategy: related.length ? 'history-category' : 'catalog-fallback',
      products: (related.length ? related : remaining).slice(0, 3),
    };
  }
}
@Module({
  controllers: [RecommendationsController, healthController('recommendations', 3004, 'none')],
})
class RecommendationsModule {}
await bootstrap(RecommendationsModule, 'Recomendações por loja', 3004);
