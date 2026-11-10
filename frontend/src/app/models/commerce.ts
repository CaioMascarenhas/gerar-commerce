export interface Feature {
  id: string;
  name: string;
  description: string;
  core: boolean;
}
export interface ProductDraft {
  name: string;
  description: string;
  priceInCents: number;
  stock: number;
  image: string;
  imageFrame?: ImageFrame;
  imageSource?: 'owner' | 'illustrative';
}
export interface Product extends Omit<ProductDraft, 'stock'> {
  id: string;
  category: string;
}
export interface StoreDraft {
  name: string;
  slug: string;
  description: string;
  cover: string;
  coverFrame?: ImageFrame;
  category: string;
  options: string[];
  password: string;
  products: ProductDraft[];
}
export interface ImageFrame {
  fit: 'cover' | 'contain';
  x: number;
  y: number;
  zoom: number;
}
export interface Customer {
  id: string;
  name: string;
  email: string;
}
export interface Coupon {
  code: string;
  percentage: number;
  minimumInCents: number;
  active: boolean;
  expiresAt: string | null;
}
export interface Store extends Omit<StoreDraft, 'password' | 'products'> {
  blueprint: {
    configuration: { features: string[]; accentColor: string };
    components: { id: string; service: string }[];
    shippingInCents: number;
    plan: { name: string; monthlyInCents: number };
    theme: { name: string; accent: string; surface: string; icon: string };
  };
}
export interface Order {
  id: string;
  reference: string;
  customerId: string;
  status: string;
  totalInCents: number;
  createdAt: string;
  items: { productId: string; name: string; quantity: number; priceInCents: number }[];
}
export const categoryList = [
  { id: 'eletronicos', name: 'Eletrônicos', color: '#2563eb' },
  { id: 'construcao', name: 'Construção', color: '#b45309' },
  { id: 'roupas', name: 'Roupas', color: '#a33265' },
];
export function newProduct(): ProductDraft {
  return { name: '', description: '', priceInCents: 1000, stock: 10, image: '' };
}
export function newStore(): StoreDraft {
  return {
    name: '',
    slug: '',
    description: '',
    cover: '',
    category: 'eletronicos',
    options: [],
    password: '',
    products: [newProduct()],
  };
}
export function plan(options: string[]) {
  return options.includes('aiAssistant')
    ? { name: 'Inteligente', price: 9990 }
    : options.length
      ? { name: 'Completo', price: 7990 }
      : { name: 'Essencial', price: 5990 };
}
export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}
