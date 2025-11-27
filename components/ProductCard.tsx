
import React from 'react';
import { Heart, Star, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useWishlist } from '../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onClick }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isLiked = isInWishlist(product.id);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-accent-gold/20 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative pt-[100%] bg-gray-light overflow-hidden cursor-pointer" onClick={() => onClick(product)}>
        <img 
          src={product.image} 
          alt={product.name} 
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.oldPrice && (
            <span className="bg-accent-rose text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Oferta
            </span>
          )}
          {product.isNew && (
            <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Novo
            </span>
          )}
        </div>

        {/* Action Overlay */}
        <button 
            onClick={handleHeartClick}
            className={`absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center transition-colors shadow-md z-10 ${isLiked ? 'text-accent-rose' : 'text-gray-400 hover:text-accent-rose hover:bg-red-50'}`}
        >
          <Heart size={18} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "" : ""} />
        </button>
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-1">
          <span className="text-xs font-bold text-gray-dark uppercase tracking-wider">{product.brand}</span>
        </div>
        <h3 
          className="font-serif text-lg font-bold text-primary mb-2 cursor-pointer hover:text-accent-gold transition-colors line-clamp-1"
          onClick={() => onClick(product)}
        >
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1 mb-4">
          <div className="flex text-accent-gold">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} className={i >= Math.floor(product.rating) ? "text-gray-300" : ""} />
            ))}
          </div>
          <span className="text-xs text-gray-400">({product.reviews})</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            {product.oldPrice && (
              <span className="text-xs text-gray-400 line-through">R$ {product.oldPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            )}
            <span className="text-xl font-bold text-primary">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button 
            onClick={() => onAddToCart(product)}
            className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-accent-gold transition-colors shadow-md group-active:scale-95"
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;