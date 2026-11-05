/** Formatos JSON consumidos pela interface por HTTP. Sem dependências do backend. */
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  priceInCents: number;
}

export interface StockItem {
  productId: string;
  available: number;
}

export interface ApplicationBlueprint {
  configuration: {
    id: string;
    name: string;
    features: string[];
    payment: 'simulated';
    fulfillment: 'pickup' | 'flat-rate';
    accentColor: string;
  };
  components: { id: string; feature: string; service: string }[];
  shippingInCents: number;
}
