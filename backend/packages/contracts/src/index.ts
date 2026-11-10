/** Contratos públicos. Cada serviço mantém seus próprios dados e implementação. */
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  priceInCents: number;
}

export const coreFeatures = [
  'catalog',
  'inventory',
  'cart',
  'orders',
  'checkout',
  'administration',
] as const;
export type CoreFeature = (typeof coreFeatures)[number];
export type OptionalFeature = 'aiAssistant' | 'coupons' | 'reviews' | 'delivery';
export type Feature = CoreFeature | OptionalFeature;

export interface ProductConfiguration {
  id: string;
  name: string;
  features: Feature[];
  payment: 'simulated';
  fulfillment: 'pickup' | 'flat-rate';
  accentColor: string;
}

export interface ComponentDescriptor {
  id: string;
  feature: Feature;
  service: string;
}

export interface ApplicationBlueprint {
  configuration: ProductConfiguration;
  components: ComponentDescriptor[];
  shippingInCents: number;
}

export interface StockItem {
  productId: string;
  available: number;
}
export interface OrderSummary {
  count: number;
  totalInCents: number;
  source: 'demo';
}

export interface ServiceHealth {
  service: string;
  status: 'ok';
  port: number;
  storage: 'none' | 'memory-demo' | 'postgres';
}
