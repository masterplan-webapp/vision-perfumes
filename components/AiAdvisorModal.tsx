
import React, { useState } from 'react';
import { X, Sparkles, Send, ShoppingCart, ExternalLink } from 'lucide-react';
import { getPerfumeRecommendation, AiRecommendationResult } from '../services/geminiService';
import { Product } from '../types';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onViewProduct?: (productId: string) => void;
}

const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({ isOpen, onClose, products, onAddToCart, onViewProduct }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AiRecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResult(null);
    
    const aiResult = await getPerfumeRecommendation(query, products);
    
    setResult(aiResult);
    setIsLoading(false);
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find(p => p.id === id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                <Sparkles size={24} />
            </div>
            <div>
                <h3 className="font-bold text-xl">Vision Consultor Virtual</h3>
                <p className="text-white/80 text-xs">Seu consultor de fragrâncias pessoal</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors" aria-label="Fechar consultor">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
           {!result && !isLoading && (
               <div className="text-center text-gray-500 py-8">
                   <p className="mb-4">Olá! Estou aqui para ajudar você a encontrar o perfume perfeito.</p>
                   <p className="text-sm">Experimente perguntar:</p>
                   <ul className="text-sm italic mt-2 space-y-2">
                       <li>"Quero um perfume marcante para um encontro à noite."</li>
                       <li>"Preciso de um presente suave para minha mãe."</li>
                       <li>"Busco algo fresco para usar no trabalho no verão."</li>
                   </ul>
               </div>
           )}

           {isLoading && (
               <div className="flex flex-col items-center justify-center py-10">
                   <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                   <p className="text-indigo-600 font-medium animate-pulse">Consultando especialistas...</p>
               </div>
           )}

           {result && (
               <div className="space-y-4">
                 {/* AI Text Response */}
                 <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-gray-700">
                     <div className="whitespace-pre-line text-sm leading-relaxed">
                        {result.message.split(/(\*\*.*?\*\*)/g).map((part, i) => 
                          part.startsWith('**') && part.endsWith('**') 
                            ? <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>
                            : part
                        )}
                     </div>
                 </div>

                 {/* Product Cards */}
                 {result.recommendations.length > 0 && (
                   <div className="space-y-3">
                     <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Produtos sugeridos do nosso catálogo:</p>
                     {result.recommendations.map(rec => {
                       const product = getProductById(rec.productId);
                       if (!product) return null;
                       return (
                         <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex items-center gap-3 p-3 hover:shadow-md transition-shadow">
                           {/* Product Image */}
                           <img
                             src={product.image}
                             alt={product.name}
                             className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                             onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/e2e8f0/94a3b8?text=VP'; }}
                           />
                           {/* Product Info */}
                           <div className="flex-1 min-w-0">
                             <h4 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h4>
                             <p className="text-xs text-gray-500">{product.brand} · {product.category}</p>
                             <div className="flex items-center gap-2 mt-1">
                               <span className="text-indigo-600 font-bold text-sm">R$ {product.price.toFixed(2)}</span>
                               {product.oldPrice && (
                                 <span className="text-gray-400 line-through text-xs">R$ {product.oldPrice.toFixed(2)}</span>
                               )}
                             </div>
                           </div>
                           {/* Action Buttons */}
                           <div className="flex flex-col gap-1.5 flex-shrink-0">
                             {onViewProduct && (
                               <button
                                 onClick={() => { onViewProduct(product.id); onClose(); }}
                                 className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                                 aria-label={`Ver detalhes de ${product.name}`}
                               >
                                 <ExternalLink size={12} />
                                 Ver
                               </button>
                             )}
                             {onAddToCart && (
                               <button
                                 onClick={() => onAddToCart(product)}
                                 className="flex items-center gap-1 text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
                                 aria-label={`Adicionar ${product.name} ao carrinho`}
                               >
                                 <ShoppingCart size={12} />
                                 Comprar
                               </button>
                             )}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}
               </div>
           )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={handleSubmit} className="relative">
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Qual é a ocasião ou preferência?"
                    className="w-full py-3 pl-4 pr-12 bg-gray-100 text-gray-900 border-transparent focus:bg-white border focus:border-indigo-500 rounded-xl focus:ring-0 transition-all"
                    disabled={isLoading}
                    id="ai-advisor-input"
                    aria-label="Campo de busca do consultor de fragrâncias"
                />
                <button 
                    type="submit" 
                    disabled={!query.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Enviar pergunta"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AiAdvisorModal;
