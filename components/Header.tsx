
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
    <header className="sticky top-0 z-50 bg-primary-light shadow-sm">
      {/* Top Bar */}
      <div className="bg-primary text-primary-light text-xs py-2 text-center font-medium tracking-wide px-4">
        {topBarText || "✨ Frete Grátis para compras acima de R$ 300 | Até 3x sem juros no cartão"}
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-5">
        <div className="flex justify-between items-center gap-6">
          {/* Logo */}
          <a href="#" onClick={(e) => { e.preventDefault(); if(isAdminView) onAdminClick(); else onCategoryClick(''); }} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-gold to-accent-rose rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg group-hover:rotate-3 transition-transform">
              VP
            </div>
            <span className="font-serif text-2xl font-bold text-primary tracking-tight">Vision Perfumes</span>
          </a>

          {/* Desktop Search - Only show if not in Admin View */}
          {!isAdminView && (
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg relative">
                <input
                type="text"
                placeholder="Buscar perfumes, marcas..."
                className="w-full py-3 px-5 pr-14 border border-gray-medium rounded-full text-sm focus:outline-none focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/10 transition-all"
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
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-xs font-bold hover:opacity-90 transition-opacity shadow-md"
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
                        className="p-2 text-primary hover:text-accent-gold transition-colors hidden sm:block"
                        title="Meus Pedidos"
                     >
                         <Package size={24} />
                     </button>
                 )}

                 {isAdmin && (
                     <button 
                        onClick={onAdminClick}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isAdminView ? 'bg-primary text-white' : 'bg-gray-100 text-primary hover:bg-gray-200'}`}
                        title="Painel Admin"
                     >
                        <LayoutDashboard size={16} />
                        <span className="hidden sm:inline">{isAdminView ? 'Voltar à Loja' : 'Admin'}</span>
                     </button>
                 )}
                <div className="hidden sm:flex flex-col items-end mr-1 cursor-pointer" onClick={onProfileClick}>
                    <span className="text-xs text-gray-500">Olá,</span>
                    <span className="text-xs font-bold text-primary line-clamp-1 max-w-[100px]">
                        {user.displayName || user.email?.split('@')[0]}
                    </span>
                </div>
                <button onClick={onProfileClick} className="p-2 text-primary hover:text-accent-gold transition-colors" title="Minha Conta">
                    <UserCog size={24} />
                </button>
                <button onClick={handleLogout} className="p-2 text-primary hover:text-red-600 transition-colors" title="Sair">
                    <LogOut size={24} />
                </button>
              </div>
            ) : (
              <button onClick={onAuthClick} className="p-2 text-primary hover:text-accent-gold transition-colors relative group">
                <UserIcon size={24} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-primary text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                  Entrar / Cadastrar
                </span>
              </button>
            )}

            {!isAdminView && (
                <>
                    <button onClick={onWishlistClick} className="p-2 text-primary hover:text-accent-rose transition-colors hidden sm:block relative">
                        <Heart size={24} />
                        {wishlist.length > 0 && (
                            <span className="absolute top-0 right-0 bg-accent-rose text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                                {wishlist.length}
                            </span>
                        )}
                    </button>
                    <button onClick={onCartClick} className="p-2 text-primary hover:text-accent-gold transition-colors relative">
                    <ShoppingBag size={24} />
                    {cartCount > 0 && (
                        <span className="absolute top-0 right-0 bg-accent-rose text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full">
                        {cartCount}
                        </span>
                    )}
                    </button>
                </>
            )}
            
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {!isAdminView && (
        <nav className={`border-t border-gray-medium transition-all duration-300 ${isMenuOpen ? 'block' : 'hidden md:block'}`}>
            <div className="container mx-auto px-4">
            <ul className="flex flex-col md:flex-row justify-center gap-6 py-4 md:py-4 text-sm font-medium uppercase tracking-wider">
                {['Home', 'Catálogo', 'Masculino', 'Feminino', 'Unissex', 'Ofertas'].map((item) => (
                <li key={item}>
                    <a 
                    href={`#${item.toLowerCase()}`}
                    onClick={(e) => {
                        e.preventDefault();
                        onCategoryClick(item === 'Home' || item === 'Catálogo' ? '' : item);
                        setIsMenuOpen(false);
                    }}
                    className="block py-2 md:py-0 text-primary hover:text-accent-gold transition-colors relative group"
                    >
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent-gold transition-all group-hover:w-full"></span>
                    </a>
                </li>
                ))}
                <li className="md:hidden mt-4 pt-4 border-t border-gray-medium flex flex-col gap-3">
                    {user && !isAdminView && (
                        <>
                         <button onClick={() => { onOrdersClick(); setIsMenuOpen(false); }} className="flex items-center gap-2 text-primary font-bold text-left">
                            <Package size={16} /> Meus Pedidos
                        </button>
                        <button onClick={() => { onProfileClick(); setIsMenuOpen(false); }} className="flex items-center gap-2 text-primary font-bold text-left">
                            <UserCog size={16} /> Minha Conta
                        </button>
                        <button onClick={() => { onWishlistClick(); setIsMenuOpen(false); }} className="flex items-center gap-2 text-accent-rose font-bold text-left">
                            <Heart size={16} /> Lista de Desejos
                        </button>
                        </>
                    )}
                    <button onClick={() => { onAiClick(); setIsMenuOpen(false); }} className="flex items-center gap-2 text-purple-600 font-bold text-left">
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
