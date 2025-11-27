

export interface ProductVariation {
  id: string;
  size: string; // ex: '50ml', '100ml'
  price: number;
  oldPrice?: number;
  stock?: number;
  
  // Logística Específica da Variação
  weight?: number; // em kg
  dimensions?: {
    width: number; // cm
    height: number; // cm
    depth: number; // cm
  };
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number; // Preço base (geralmente o menor ou o padrão para listagem)
  oldPrice?: number;
  image: string;
  category: 'Masculino' | 'Feminino' | 'Unissex';
  description: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  
  // Logística Padrão (Fallback)
  weight?: number; // em kg
  dimensions?: {
    width: number; // cm
    height: number; // cm
    depth: number; // cm
  };

  // Variações
  variations?: ProductVariation[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariation?: ProductVariation; // A variação específica escolhida
}

export type FilterState = {
  category: string;
  brand: string;
  priceRange: string;
  sort: string;
  search: string;
};

export interface User {
  email: string;
  name: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  defaultAddress?: Address;
  wishlist?: string[]; // Array of Product IDs
}

export interface AdminUser {
  id?: string;
  email: string;
  addedAt: string;
  addedBy?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}

export interface ShippingOption {
  name: string; // ex: PAC, SEDEX
  price: number;
  deadline: string; // ex: '3 dias úteis'
  carrier: string; // ex: Correios
  serviceCode?: string;
}

export interface Coupon {
  id?: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minPurchase?: number;
  expirationDate?: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerDocument: string; // CPF/CNPJ
  customerPhone: string;
  items: CartItem[];
  total: number;
  subtotal: number; // Valor dos produtos
  discount?: number; // Valor do desconto aplicado
  couponCode?: string; // Código do cupom usado
  shippingCost?: number; // Custo do frete escolhido
  shippingOption?: string; // Nome da opção escolhida (ex: SEDEX)
  status: OrderStatus;
  createdAt: string;
  shippingAddress: Address;
  trackingCode?: string;
  paymentMethod?: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  image: string;
  ctaLink?: string;
}

export interface SiteSettings {
  topBarText: string;
  slides: HeroSlide[];
  originZip?: string;
  frenetToken?: string; // Token de integração Frenet
  pagarmePublicKey?: string; // Chave pública Pagar.me
  apiBaseUrl?: string; // URL da Cloud Function (Backend)
  heroTitle?: string;
  heroSubtitle?: string;
  heroButtonText?: string;
  heroBackgroundImage?: string;
  freeShippingThreshold?: number; // Valor mínimo para frete grátis
}