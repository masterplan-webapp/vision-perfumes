
import React from 'react';
import { X, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { Product } from '../types';

interface WishlistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const WishlistSidebar: React.FC<WishlistSidebarProps> = ({ isOpen, onClose, onAddToCart }) => {
  const { wishlist, toggleWishlist } = useWishlist();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[101] shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-medium flex items-center justify-between bg-white">
          <h2 className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
            <Heart className="text-accent-rose fill-current" /> Lista de Desejos
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {wishlist.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Heart size={64} strokeWidth={1} className="mb-4 opacity-30" />
              <p className="text-lg">Sua lista está vazia.</p>
              <button onClick={onClose} className="mt-6 text-accent-gold font-medium hover:underline">
                Explorar Produtos
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {wishlist.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden border border-gray-100 relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    <button 
                        onClick={() => toggleWishlist(item)}
                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <X size={14} />
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-xs text-gray-dark uppercase">{item.brand}</span>
                      <h4 className="font-medium text-primary line-clamp-1">{item.name}</h4>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-accent-gold">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      
                      <button 
                        onClick={() => { onAddToCart(item); onClose(); }}
                        className="p-2 bg-gray-100 hover:bg-primary hover:text-white rounded-full transition-colors text-primary"
                        title="Adicionar ao Carrinho"
                      >
                        <ShoppingBag size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-medium">
            <button onClick={onClose} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-600 hover:text-primary transition-colors">
                Continuar Comprando <ArrowRight size={16} />
            </button>
        </div>
      </div>
    </>
  );
};

export default WishlistSidebar;