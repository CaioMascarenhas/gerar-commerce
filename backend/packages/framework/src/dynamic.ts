import { coreFeatures } from '@gerar/contracts';
import type {
  ApplicationBlueprint,
  Feature,
  OptionalFeature,
  ProductConfiguration,
} from '@gerar/contracts';
import {
  CommerceApplication,
  ComponentRegistry,
  FlatRateShipping,
  PickupShipping,
} from './core.js';

export const categories = {
  eletronicos: { name: 'Eletrônicos', accent: '#2563eb', surface: '#eaf0ff', icon: '⌘' },
  construcao: { name: 'Construção', accent: '#b45309', surface: '#fff3df', icon: '▧' },
  roupas: { name: 'Roupas', accent: '#a33265', surface: '#fbeaf2', icon: '✳' },
} as const;
export type StoreCategory = keyof typeof categories;
export const featureCatalog = [
  {
    id: 'catalog',
    name: 'Catálogo de produtos',
    description: 'Produtos, preços e descrições.',
    core: true,
  },
  {
    id: 'inventory',
    name: 'Controle de estoque',
    description: 'Saldo atualizado a cada compra.',
    core: true,
  },
  { id: 'cart', name: 'Carrinho', description: 'Escolha produtos e quantidades.', core: true },
  { id: 'checkout', name: 'Checkout', description: 'Compra com pagamento simulado.', core: true },
  {
    id: 'orders',
    name: 'Gestão de pedidos',
    description: 'Histórico de compras da sua loja.',
    core: true,
  },
  {
    id: 'administration',
    name: 'Painel administrativo',
    description: 'Produtos, pedidos e configurações.',
    core: true,
  },
  {
    id: 'coupons',
    name: 'Cupons de desconto',
    description: 'Cadastre cupons e percentuais de desconto para sua loja.',
    core: false,
  },
  {
    id: 'reviews',
    name: 'Avaliações',
    description: 'Compradores conectados avaliam produtos de compras aprovadas.',
    core: false,
  },
  {
    id: 'delivery',
    name: 'Entrega local',
    description: 'Entrega com tarifa fixa de R$ 15,00, além da retirada.',
    core: false,
  },
  {
    id: 'aiAssistant',
    name: 'Agente de IA',
    description: 'Chat de produtos para compradores e agente de gestão com Gemini.',
    core: false,
  },
] as const;

export function normalizeSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}
export function validateOptions(options: unknown): OptionalFeature[] {
  if (
    !Array.isArray(options) ||
    options.length > 4 ||
    options.some((id) => !featureCatalog.some((feature) => !feature.core && feature.id === id))
  )
    throw new Error('Selecione apenas opcionais disponíveis.');
  if (new Set(options).size !== options.length) throw new Error('Opcionais duplicados.');
  return options as OptionalFeature[];
}
export function calculatePlan(options: readonly string[]) {
  if (options.includes('aiAssistant'))
    return { id: 'inteligente', name: 'Inteligente', monthlyInCents: 9990 };
  if (options.length) return { id: 'completo', name: 'Completo', monthlyInCents: 7990 };
  return { id: 'essencial', name: 'Essencial', monthlyInCents: 5990 };
}
export interface StoreDefinition {
  slug: string;
  name: string;
  category: StoreCategory;
  options: OptionalFeature[];
}
export class ConfiguredStore extends CommerceApplication {
  constructor(private readonly store: StoreDefinition) {
    super();
  }
  protected configure(): ProductConfiguration {
    if (!Object.hasOwn(categories, this.store.category)) throw new Error('Categoria inválida.');
    const options = validateOptions(this.store.options);
    return {
      id: this.store.slug,
      name: this.store.name,
      features: [...coreFeatures, ...options],
      payment: 'simulated',
      fulfillment: options.includes('delivery') ? 'flat-rate' : 'pickup',
      accentColor: categories[this.store.category].accent,
    };
  }
  protected shippingPolicy() {
    return this.store.options.includes('delivery') ? new FlatRateShipping() : new PickupShipping();
  }
  protected override registerExtensions(registry: ComponentRegistry) {
    for (const feature of this.store.options)
      registry.register({
        id: feature,
        feature: feature as Feature,
        service:
          feature === 'aiAssistant' ? 'ai-assistant' : feature === 'reviews' ? 'catalog' : 'orders',
      });
  }
}
export function composeStore(store: StoreDefinition) {
  return {
    ...new ConfiguredStore(store).build(),
    plan: calculatePlan(store.options),
    theme: categories[store.category],
  };
}

export interface DiscountPolicy {
  discount(subtotalInCents: number): number;
}
export class WelcomeDiscount implements DiscountPolicy {
  discount(subtotalInCents: number) {
    return Math.round(subtotalInCents * 0.1);
  }
}
export interface CouponDefinition {
  code: string;
  percentage: number;
  minimumInCents: number;
  active: boolean;
  expiresAt: string | null;
}
export class PercentageDiscount implements DiscountPolicy {
  constructor(private readonly percentage: number) {
    if (!Number.isInteger(percentage) || percentage < 1 || percentage > 100)
      throw new Error('Percentual de desconto inválido.');
  }
  discount(subtotalInCents: number) {
    return Math.round((subtotalInCents * this.percentage) / 100);
  }
}
export interface PaymentProvider {
  authorize(result: string): 'paid' | 'declined';
}
export class SimulatedPayment implements PaymentProvider {
  authorize(result: string): 'paid' | 'declined' {
    if (result !== 'approved' && result !== 'declined')
      throw new Error('Resultado de pagamento simulado inválido.');
    return result === 'approved' ? 'paid' : 'declined';
  }
}
export function quoteCheckout(
  blueprint: ApplicationBlueprint,
  subtotalInCents: number,
  coupon: unknown,
  fulfillment: string,
  definition?: CouponDefinition,
) {
  if (!Number.isSafeInteger(subtotalInCents) || subtotalInCents < 1 || subtotalInCents > 1000000000)
    throw new Error('Valor do carrinho inválido.');
  if (!['pickup', 'delivery'].includes(fulfillment))
    throw new Error('Modalidade de entrega inválida.');
  const features = blueprint.configuration.features;
  if (
    coupon &&
    (!features.includes('coupons') ||
      !definition ||
      typeof coupon !== 'string' ||
      definition.code !== coupon.trim().toUpperCase() ||
      !definition.active ||
      (definition.expiresAt !== null &&
        (!Number.isFinite(Date.parse(definition.expiresAt)) ||
          Date.parse(definition.expiresAt) <= Date.now())))
  )
    throw new Error('Cupom inválido, expirado ou indisponível nesta loja.');
  if (coupon && subtotalInCents < definition!.minimumInCents)
    throw new Error('O subtotal não atingiu o valor mínimo deste cupom.');
  if (fulfillment === 'delivery' && !features.includes('delivery'))
    throw new Error('Esta loja oferece apenas retirada.');
  const discountInCents = coupon
    ? new PercentageDiscount(definition!.percentage).discount(subtotalInCents)
    : 0;
  const shippingInCents = fulfillment === 'delivery' ? blueprint.shippingInCents : 0;
  return {
    subtotalInCents,
    discountInCents,
    shippingInCents,
    totalInCents: subtotalInCents - discountInCents + shippingInCents,
  };
}
