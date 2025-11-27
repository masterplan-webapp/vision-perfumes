


import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (id: string, delta: number, variationId?: string) => void;
  onRemove: (id: string, variationId?: string) => void;
  onCheckout: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose, items, onUpdateQty, onRemove, onCheckout }) => {
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

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
          <h2 className="font-serif text-2xl font-bold text-primary">Seu Carrinho</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingBag size={64} strokeWidth={1} className="mb-4 opacity-30" />
              <p className="text-lg">Seu carrinho está vazio.</p>
              <button onClick={onClose} className="mt-6 text-accent-gold font-medium hover:underline">
                Começar a comprar
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item, idx) => (
                <div key={`${item.id}-${item.selectedVariation?.id || idx}`} className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden border border-gray-100">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-xs text-gray-dark uppercase">{item.brand}</span>
                      <h4 className="font-medium text-primary line-clamp-1">
                          {item.name}
                          {item.selectedVariation && (
                              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {item.selectedVariation.size}
                              </span>
                          )}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-accent-gold">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-medium rounded-lg">
                          <button 
                            onClick={() => onUpdateQty(item.id, -1, item.selectedVariation?.id)}
                            className="p-1 hover:bg-gray-100 transition-colors rounded-l-lg"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQty(item.id, 1, item.selectedVariation?.id)}
                            className="p-1 hover:bg-gray-100 transition-colors rounded-r-lg"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button 
                            onClick={() => onRemove(item.id, item.selectedVariation?.id)} 
                            className="text-gray-400 hover:text-accent-rose transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-medium">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-dark">Subtotal</span>
              <span className="font-medium">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-dark">Frete</span>
              <span className="text-green-600 font-medium">Grátis</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary pt-3 border-t border-gray-medium">
              <span>Total</span>
              <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <button 
            disabled={items.length === 0}
            onClick={onCheckout}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-accent-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Finalizar Compra
          </button>
        </div>
      </div>
    </>
  );
};

export default CartSidebar;
