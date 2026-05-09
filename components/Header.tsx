
import React, { useState } from 'react';
import { Search, ShoppingBag, User as UserIcon, Heart, Menu, X, Sparkles, LogOut, LayoutDashboard, Package, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebase';
import { useWishlist } from '../context/WishlistContext';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onAuthClick: () => void;
  onSearch: (query: string) => void;
  onCategoryClick: (category: string) => void;
  onAiClick: () => void;
  onAdminClick: () => void;
  onOrdersClick: () => void;
  onWishlistClick: () => void;
  onProfileClick: () => void;
  isAdminView: boolean;
  topBarText?: string;
}

const Header: React.FC<HeaderProps> = ({ 
    cartCount, 
    onCartClick, 
    onAuthClick, 
    onSearch, 
    onCategoryClick, 
    onAiClick, 
    onAdminClick,
    onOrdersClick,
    onWishlistClick,
    onProfileClick,
    isAdminView,
    topBarText
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const { user, isAdmin } = useAuth();
  const { wishlist } = useWishlist();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
  };

  const handleLogout = () => {
    auth.signOut();
    if (isAdminView) onAdminClick(); // Go back to home if logging out from admin
  };

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-md border-b border-white/5">
      {/* Top Bar */}
      <div className="bg-primary-dark text-white/80 text-[10px] sm:text-xs py-2 text-center font-medium tracking-[0.1em] px-4 border-b border-white/5">
        {topBarText || "✨ FRETE GRÁTIS ACIMA DE R$ 300 | ATÉ 3X SEM JUROS NO CARTÃO"}
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 py-6 md:h-32">
          {/* Logo */}
          <a href="#" onClick={(e) => { e.preventDefault(); if(isAdminView) onAdminClick(); else onCategoryClick(''); }} className="flex-shrink-0 flex items-center gap-4 group">
            <img 
              src="/favicon.png" 
              alt="Vision Perfumes Icon" 
              className="h-16 sm:h-20 w-auto object-contain brightness-110 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-serif text-3xl sm:text-5xl font-medium text-accent-gold tracking-[0.2em] uppercase leading-none">
                Vision
              </span>
              <span className="font-serif text-[10px] sm:text-[12px] font-light text-white/60 tracking-[0.6em] uppercase mt-1 pl-1">
                Perfumes Importados
              </span>
            </div>
          </a>

          {/* Desktop Search - Only show if not in Admin View */}
          {!isAdminView && (
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg relative">
                <input
                id="search-desktop"
                aria-label="Buscar produtos"
                type="text"
                placeholder="O que você está procurando hoje?"
                className="w-full py-2.5 px-6 pr-14 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-accent-gold transition-all"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                />
                <button type="submit" className="absolute right-1.5 top-1.5 bg-accent-gold hover:bg-[#c49b2d] text-white p-2 rounded-full transition-colors">
                <Search size={18} />
                </button>
            </form>
          )}
          
          {isAdminView && <div className="flex-1 text-center hidden md:block font-bold text-gray-400 uppercase tracking-widest">Modo Administrador</div>}

          {/* Actions */}
          <div className="flex items-center gap-4">
            {!isAdminView && (
                <button 
                    onClick={onAiClick}
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full text-xs font-bold hover:opacity-90 transition-opacity shadow-md"
                >
                    <Sparkles size={14} />
                    Consultor Virtual
                </button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                 {!isAdminView && (
                     <button 
                        onClick={onOrdersClick}
                        className="p-2 text-white hover:text-accent-gold transition-colors hidden sm:block"
                        title="Meus Pedidos"
                     >
                         <Package size={22} />
                     </button>
                 )}

                 {isAdmin && (
                     <button 
                        onClick={onAdminClick}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isAdminView ? 'bg-accent-gold text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        title="Painel Admin"
                     >
                        <LayoutDashboard size={16} />
                        <span className="hidden sm:inline">{isAdminView ? 'Sair do Admin' : 'Admin'}</span>
                     </button>
                 )}
                <div className="hidden sm:flex flex-col items-end mr-1 cursor-pointer" onClick={onProfileClick}>
                    <span className="text-[10px] text-gray-400">Olá,</span>
                    <span className="text-xs font-bold text-white line-clamp-1 max-w-[100px]">
                        {user.displayName || user.email?.split('@')[0]}
                    </span>
                </div>
                <button onClick={onProfileClick} className="p-2 text-white hover:text-accent-gold transition-colors" title="Minha Conta">
                    <UserCog size={22} />
                </button>
                <button onClick={handleLogout} className="p-2 text-white hover:text-red-400 transition-colors" title="Sair">
                    <LogOut size={22} />
                </button>
              </div>
            ) : (
              <button onClick={onAuthClick} className="p-2 text-white hover:text-accent-gold transition-colors relative group">
                <UserIcon size={22} />
              </button>
            )}

            {!isAdminView && (
                <>
                    <button onClick={onWishlistClick} className="p-2 text-white hover:text-accent-rose transition-colors hidden sm:block relative">
                        <Heart size={22} />
                        {wishlist.length > 0 && (
                            <span className="absolute top-0 right-0 bg-accent-rose text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                                {wishlist.length}
                            </span>
                        )}
                    </button>
                    <button onClick={onCartClick} className="p-2 text-white hover:text-accent-gold transition-colors relative">
                    <ShoppingBag size={22} />
                    {cartCount > 0 && (
                        <span className="absolute top-0 right-0 bg-accent-gold text-primary-dark text-[9px] font-bold h-4.5 w-4.5 flex items-center justify-center rounded-full">
                        {cartCount}
                        </span>
                    )}
                    </button>
                </>
            )}
            
            <button className="md:hidden p-2 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation & Mobile Search */}
      {!isAdminView && (
        <nav className={`border-t border-white/5 transition-all duration-300 ${isMenuOpen ? 'block bg-primary' : 'hidden md:block'}`}>
            <div className="container mx-auto px-4">
            {/* Mobile Search Bar */}
            <div className="md:hidden py-4">
                <form onSubmit={handleSearch} className="relative w-full">
                    <input
                        id="search-mobile"
                        aria-label="Buscar produtos mobile"
                        type="text"
                        placeholder="O que você está procurando hoje?"
                        className="w-full py-2.5 px-6 pr-14 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-accent-gold transition-all"
                        value={searchVal}
                        onChange={(e) => setSearchVal(e.target.value)}
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-accent-gold">
                        <Search size={20} />
                    </button>
                </form>
            </div>

            <ul className="flex flex-col md:flex-row justify-center gap-8 py-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em]">
                {['Perfumes', 'Corpo', 'Masculino', 'Feminino', 'Unissex', 'Marcas', 'Ofertas'].map((item) => (
                <li key={item}>
                    <a 
                    href={`#${item.toLowerCase()}`}
                    onClick={(e) => {
                        e.preventDefault();
                        onCategoryClick(item === 'Home' || item === 'Catálogo' || item === 'Perfumes' ? '' : item);
                        setIsMenuOpen(false);
                    }}
                    className="block py-2 md:py-0 text-white/60 hover:text-accent-gold transition-colors relative group"
                    >
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent-gold transition-all group-hover:w-full"></span>
                    </a>
                </li>
                ))}
                <li className="md:hidden mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
                    {user && !isAdminView && (
                        <>
                         <button onClick={() => { onOrdersClick(); setIsMenuOpen(false); }} className="flex items-center gap-2 text-white font-bold text-left">
                            <Package size={16} /> Meus Pedidos
                        </button>
                        <button onClick={() => { onProfileClick(); setIsMenuOpen(false); }} className="flex items-center gap-2 text-white font-bold text-left">
                            <UserCog size={16} /> Minha Conta
                        </button>
                        <button onClick={() => { onWishlistClick(); setIsMenuOpen(false); }} className="flex items-center gap-2 text-accent-rose font-bold text-left">
                            <Heart size={16} /> Lista de Desejos
                        </button>
                        </>
                    )}
                    <button onClick={() => { onAiClick(); setIsMenuOpen(false); }} className="flex items-center gap-2 text-indigo-400 font-bold text-left">
                        <Sparkles size={16} /> Consultor Virtual
                    </button>
                </li>
            </ul>
            </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
