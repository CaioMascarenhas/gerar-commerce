import 'reflect-metadata';
import { Controller, Get, Module } from '@nestjs/common';
import { bootstrap, healthController } from '@gerar/platform';
import type { StockItem } from '@gerar/contracts';

@Controller('stock')
class InventoryController {
  @Get() list(): StockItem[] {
    return [
      { productId: 'caderno', available: 25 },
      { productId: 'caneca', available: 12 },
      { productId: 'ecobag', available: 8 },
      { productId: 'lapis', available: 30 },
    ];
  }
}

@Module({ controllers: [InventoryController, healthController('inventory', 3002)] })
class InventoryModule {}
await bootstrap(InventoryModule, 'Estoque', 3002);
