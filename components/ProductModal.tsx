



import React, { useState, useEffect } from 'react';
import { X, Star, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Product, ProductVariation } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, variation?: ProductVariation) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | undefined>(undefined);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    if (product?.variations && product.variations.length > 0) {
        setSelectedVariation(product.variations[0]);
    } else {
        setSelectedVariation(undefined);
    }
    setQuantity(1);
    setActiveImage(product?.image || '');
  }, [product]);

  if (!product) return null;

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedVariation);
    onClose();
  };

  // Determine current price to show
  const currentPrice = selectedVariation ? selectedVariation.price : product.price;
  const currentOldPrice = selectedVariation ? selectedVariation.oldPrice : product.oldPrice;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-700"
          aria-label="Fechar"
        >
          <X size={24} />
        </button>

        {/* Image */}
        <div className="w-full md:w-1/2 bg-gray-50 flex flex-col items-center justify-center p-8 min-h-[300px]">
          <img
            src={activeImage || product.image}
            alt={product.name}
            className="max-w-full max-h-[360px] object-contain drop-shadow-xl"
          />
          {product.images && product.images.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap justify-center">
              <button
                onClick={() => setActiveImage(product.image)}
                className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  (activeImage || product.image) === product.image
                    ? 'border-accent-gold shadow-md'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </button>
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === img
                      ? 'border-accent-gold shadow-md'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
          <span className="text-sm font-bold text-gray-dark uppercase tracking-wider mb-2">{product.brand}</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">{product.name}</h2>
          
          <div className="flex items-center gap-2 mb-6">
            <div className="flex text-accent-gold">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} />
              ))}
            </div>
            <span className="text-sm text-gray-500 underline cursor-pointer">{product.reviews} avaliações</span>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Size Selector */}
          {product.variations && product.variations.length > 0 && (
            <div className="mb-8">
                <span className="block text-sm font-bold text-gray-700 mb-3">Selecione o Tamanho:</span>
                <div className="flex flex-wrap gap-3">
                    {product.variations.map(variation => (
                        <button
                            key={variation.id}
                            onClick={() => setSelectedVariation(variation)}
                            className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all ${
                                selectedVariation?.id === variation.id 
                                ? 'border-accent-gold bg-accent-gold text-white shadow-md transform scale-105' 
                                : 'border-gray-300 text-gray-600 hover:border-accent-gold hover:text-accent-gold'
                            }`}
                        >
                            {variation.size}
                        </button>
                    ))}
                </div>
            </div>
          )}

          <div className="mt-auto">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-primary">R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              {currentOldPrice && (
                <span className="text-lg text-gray-400 line-through">R$ {currentOldPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center border border-gray-medium rounded-xl h-12 w-max">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 hover:bg-gray-50 h-full rounded-l-xl transition-colors text-gray-900"
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={18} />
                </button>
                <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 hover:bg-gray-50 h-full rounded-r-xl transition-colors text-gray-900"
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              <button 
                onClick={handleAddToCart}
                className="flex-1 h-12 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent-gold transition-colors shadow-lg hover:shadow-accent-gold/30"
              >
                <ShoppingBag size={20} />
                Adicionar ao Carrinho
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-medium grid grid-cols-2 gap-4 text-xs text-gray-500 uppercase tracking-wide">
              <div>
                <span className="block text-gray-400 mb-1">Categoria</span>
                <span className="font-bold text-primary">{product.category}</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-1">Estoque</span>
                <span className="font-bold text-green-600">Disponível</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
