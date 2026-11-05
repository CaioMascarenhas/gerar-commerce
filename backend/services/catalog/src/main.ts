import 'reflect-metadata';
import { Controller, Get, Module } from '@nestjs/common';
import { bootstrap, healthController } from '@gerar/platform';
import type { Product } from '@gerar/contracts';

const products: Product[] = [
  {
    id: 'caderno',
    name: 'Caderno de ideias',
    category: 'papelaria',
    description: 'Para rascunhos, planos e novas descobertas.',
    priceInCents: 2490,
  },
  {
    id: 'caneca',
    name: 'Caneca Gerar',
    category: 'casa',
    description: 'Uma pausa para pensar na próxima ideia.',
    priceInCents: 3990,
  },
  {
    id: 'ecobag',
    name: 'Ecobag do campus',
    category: 'acessórios',
    description: 'Leve seus projetos para todos os lugares.',
    priceInCents: 3290,
  },
  {
    id: 'lapis',
    name: 'Kit de lápis',
    category: 'papelaria',
    description: 'O começo de qualquer grande projeto.',
    priceInCents: 1290,
  },
];

@Controller('products')
class CatalogController {
  @Get() list(): Product[] {
    return products.map((product) => ({ ...product }));
  }
}

@Module({ controllers: [CatalogController, healthController('catalog', 3001)] })
class CatalogModule {}
await bootstrap(CatalogModule, 'Catálogo', 3001);
