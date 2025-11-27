

import { Product } from './types';

// Dimensões padrão para perfumes (aprox)
const DEFAULT_DIMS = { width: 10, height: 15, depth: 10 };
const DEFAULT_WEIGHT = 0.5; // 500g

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Sauvage Elixir',
    brand: 'Dior',
    price: 899.00,
    oldPrice: 1050.00,
    image: 'https://picsum.photos/400/400?random=1',
    category: 'Masculino',
    description: 'Uma concentração extraordinária de fragrância, na qual o frescor emblemático de Sauvage se embriaga com um coração de especiarias.',
    rating: 4.9,
    reviews: 128,
    isNew: true,
    weight: DEFAULT_WEIGHT,
    dimensions: DEFAULT_DIMS,
    variations: [
      { id: 'v1', size: '60ml', price: 899.00, oldPrice: 1050.00, weight: 0.3, dimensions: { width: 8, height: 12, depth: 8 } },
      { id: 'v2', size: '100ml', price: 1299.00, weight: 0.6, dimensions: { width: 10, height: 15, depth: 10 } }
    ]
  },
  {
    id: '2',
    name: 'Coco Mademoiselle',
    brand: 'Chanel',
    price: 950.00,
    image: 'https://picsum.photos/400/400?random=2',
    category: 'Feminino',
    description: 'A essência de uma mulher livre e audaciosa. Um oriental feminino de caráter afirmado e um frescor surpreendente.',
    rating: 4.8,
    reviews: 340,
    weight: DEFAULT_WEIGHT,
    dimensions: DEFAULT_DIMS,
    variations: [
      { id: 'v1', size: '50ml', price: 950.00, weight: 0.3, dimensions: { width: 8, height: 12, depth: 8 } },
      { id: 'v2', size: '100ml', price: 1350.00, weight: 0.6, dimensions: { width: 10, height: 15, depth: 10 } }
    ]
  },
  {
    id: '3',
    name: 'Bleu de Chanel',
    brand: 'Chanel',
    price: 780.00,
    oldPrice: 850.00,
    image: 'https://picsum.photos/400/400?random=3',
    category: 'Masculino',
    description: 'O elogio da liberdade que se expressa num aromático-amadeirado de rastro cativante.',
    rating: 4.7,
    reviews: 215,
    weight: DEFAULT_WEIGHT,
    dimensions: DEFAULT_DIMS,
    variations: [
      { id: 'v1', size: '50ml', price: 780.00, oldPrice: 850.00, weight: 0.35, dimensions: { width: 8, height: 11, depth: 8 } },
      { id: 'v2', size: '100ml', price: 1050.00, weight: 0.65, dimensions: { width: 10, height: 14, depth: 10 } }
    ]
  },
  {
    id: '4',
    name: 'J\'adore',
    brand: 'Dior',
    price: 650.00,
    image: 'https://picsum.photos/400/400?random=4',
    category: 'Feminino',
    description: 'O grande floral feminino da Dior. Um buquê moldado nos detalhes, como uma flor sob medida.',
    rating: 4.9,
    reviews: 512,
    weight: DEFAULT_WEIGHT,
    dimensions: DEFAULT_DIMS,
    variations: [
      { id: 'v1', size: '30ml', price: 420.00, weight: 0.2, dimensions: { width: 6, height: 10, depth: 6 } },
      { id: 'v2', size: '50ml', price: 650.00, weight: 0.4, dimensions: { width: 8, height: 12, depth: 8 } },
      { id: 'v3', size: '100ml', price: 890.00, weight: 0.7, dimensions: { width: 10, height: 16, depth: 10 } }
    ]
  },
  {
    id: '5',
    name: 'Acqua di Giò',
    brand: 'Giorgio Armani',
    price: 450.00,
    oldPrice: 520.00,
    image: 'https://picsum.photos/400/400?random=5',
    category: 'Masculino',
    description: 'Uma fragrância nascida no mar, no sol, na terra e na brisa de uma ilha do Mediterrâneo.',
    rating: 4.6,
    reviews: 890,
    weight: DEFAULT_WEIGHT,
    dimensions: DEFAULT_DIMS,
    variations: [
      { id: 'v1', size: '50ml', price: 450.00, oldPrice: 520.00, weight: 0.3, dimensions: { width: 8, height: 12, depth: 8 } },
      { id: 'v2', size: '100ml', price: 620.00, weight: 0.5, dimensions: { width: 10, height: 15, depth: 10 } },
      { id: 'v3', size: '200ml', price: 890.00, weight: 0.8, dimensions: { width: 12, height: 18, depth: 12 } }
    ]
  },
  {
    id: '6',
    name: 'La Vie Est Belle',
    brand: 'Lancôme',
    price: 520.00,
    image: 'https://picsum.photos/400/400?random=6',
    category: 'Feminino',
    description: 'Um convite a escrever a sua própria história, encontrar o seu caminho e fazer a felicidade à sua maneira.',
    rating: 4.8,
    reviews: 1024,
    weight: DEFAULT_WEIGHT,
    dimensions: DEFAULT_DIMS,
    variations: [
      { id: 'v1', size: '30ml', price: 350.00, weight: 0.25, dimensions: { width: 7, height: 10, depth: 7 } },
      { id: 'v2', size: '50ml', price: 520.00, weight: 0.45, dimensions: { width: 9, height: 12, depth: 9 } },
      { id: 'v3', size: '100ml', price: 780.00, weight: 0.75, dimensions: { width: 11, height: 15, depth: 11 } }
    ]
  },
  {
    id: '7',
    name: 'CK One',
    brand: 'Calvin Klein',
    price: 280.00,
    oldPrice: 350.00,
    image: 'https://picsum.photos/400/400?random=7',
    category: 'Unissex',
    description: 'Puro. Simples. Moderno. CK One é um perfume sensual e refrescante, perfeito para homens e mulheres.',
    rating: 4.5,
    reviews: 650,
    weight: DEFAULT_WEIGHT,
    dimensions: DEFAULT_DIMS,
    variations: [
      { id: 'v1', size: '100ml', price: 280.00, oldPrice: 350.00, weight: 0.6, dimensions: { width: 10, height: 14, depth: 6 } },
      { id: 'v2', size: '200ml', price: 390.00, weight: 0.9, dimensions: { width: 12, height: 18, depth: 8 } }
    ]
  },
  {
    id: '8',
    name: 'Eros',
    brand: 'Versace',
    price: 590.00,
    image: 'https://picsum.photos/400/400?random=8',
    category: 'Masculino',
    description: 'Amor, paixão, beleza e desejo: estes são os conceitos chave da nova fragrância masculina da Versace.',
    rating: 4.7,
    reviews: 330,
    weight: DEFAULT_WEIGHT,
    dimensions: DEFAULT_DIMS,
    variations: [
       { id: 'v1', size: '50ml', price: 590.00, weight: 0.4, dimensions: { width: 9, height: 12, depth: 9 } },
       { id: 'v2', size: '100ml', price: 790.00, weight: 0.7, dimensions: { width: 11, height: 15, depth: 11 } }
    ]
  }
];

export const BRANDS = ['Chanel', 'Dior', 'Giorgio Armani', 'Versace', 'Lancôme', 'Calvin Klein'];