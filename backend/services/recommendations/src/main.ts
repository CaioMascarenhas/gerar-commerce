import 'reflect-metadata';
import { Controller, Get, Module, Param } from '@nestjs/common';
import { bootstrap, callService, healthController } from '@gerar/platform';

type Product = { id: string; category: string; priceInCents: number };
type Line = { productId: string; category?: string; priceInCents?: number };

// Pesos do ranking. A pontuação final soma sinais do histórico do comprador e da loja.
const weights = { category: 3, coPurchase: 2, popularity: 0.5, price: 0.5 };

function rank(products: Product[], history: { items: Line[] }[], baskets: string[][]) {
  const bought = new Set(history.flatMap((order) => order.items.map((item) => item.productId)));
  const lines = history.flatMap((order) => order.items);
  const categoryShare = new Map<string, number>();
  for (const line of lines)
    if (line.category)
      categoryShare.set(line.category, (categoryShare.get(line.category) ?? 0) + 1 / lines.length);
  const prices = lines.map((line) => line.priceInCents ?? 0).filter(Boolean);
  const averagePrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const names = new Map(products.map((p: any) => [p.id, p.name as string]));

  return products
    .filter((product) => !bought.has(product.id))
    .map((product) => {
      // Cestas da loja que contêm o candidato e algo que este comprador já levou.
      const together = baskets.filter(
        (basket) => basket.includes(product.id) && basket.some((id) => bought.has(id)),
      );
      const popularity = baskets.filter((basket) => basket.includes(product.id)).length;
      const category = categoryShare.get(product.category) ?? 0;
      const priceFit = averagePrice
        ? 1 - Math.min(1, Math.abs(product.priceInCents - averagePrice) / averagePrice)
        : 0;
      const anchor = together
        .flatMap((basket) => basket.filter((id) => bought.has(id)))
        .map((id) => names.get(id))
        .find(Boolean);
      const score =
        weights.category * category +
        weights.coPurchase * (together.length / Math.max(1, baskets.length)) * 10 +
        weights.popularity * (popularity / Math.max(1, baskets.length)) * 10 +
        weights.price * priceFit;
      const reason = together.length
        ? 'Quem comprou ' + (anchor ?? 'um item parecido') + ' também levou este.'
        : category > 0
          ? 'Combina com as categorias das suas compras.'
          : popularity > 0
            ? 'Um dos mais comprados da loja.'
            : 'Escolha da coleção para começar.';
      return { product, score, reason, personal: together.length > 0 || category > 0 };
    })
    .sort((a, b) => b.score - a.score);
}

@Controller('stores/:slug/recommendations')
class RecommendationsController {
  @Get(':customerId') async recommend(
    @Param('slug') slug: string,
    @Param('customerId') customerId: string,
  ) {
    const [products, stock, history, baskets] = await Promise.all([
      callService<Product[]>('catalog', '/stores/' + slug + '/products'),
      callService<{ productId: string; available: number }[]>(
        'inventory',
        '/stores/' + slug + '/stock',
      ),
      callService<{ items: Line[] }[]>(
        'orders',
        '/internal/stores/' + slug + '/history/' + encodeURIComponent(customerId),
      ),
      callService<string[][]>('orders', '/internal/stores/' + slug + '/baskets'),
    ]);
    const available = new Set(stock.filter((row) => row.available > 0).map((row) => row.productId));
    const ranked = rank(
      products.filter((product) => available.has(product.id)),
      history,
      baskets,
    ).slice(0, 3);
    return {
      strategy: ranked.some((entry) => entry.personal)
        ? 'history-category'
        : baskets.length
          ? 'store-popularity'
          : 'catalog-fallback',
      products: ranked.map((entry) => ({ ...entry.product, reason: entry.reason })),
    };
  }
}
@Module({
  controllers: [RecommendationsController, healthController('recommendations', 3004, 'none')],
})
class RecommendationsModule {}
await bootstrap(RecommendationsModule, 'Recomendações por loja', 3004);
