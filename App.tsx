
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import CartSidebar from './components/CartSidebar';
import WishlistSidebar from './components/WishlistSidebar';
import ProductModal from './components/ProductModal';
import AiAdvisorModal from './components/AiAdvisorModal';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import CheckoutModal from './components/CheckoutModal';
import UserOrdersModal from './components/UserOrdersModal';
import ProfileModal from './components/ProfileModal';
import { BRANDS } from './constants';
import { Product, CartItem, FilterState, SiteSettings, ProductVariation } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext'; // Import useWishlist
import { fetchProducts } from './services/productService';
import { getSiteSettings } from './services/settingsService';
import { getCartFromFirebase, saveCartToFirebase } from './services/cartService';
import { ToastProvider } from './context/ToastContext';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | undefined>(undefined);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  
  const { user, loading: authLoading } = useAuth();
  const { setCatalog } = useWishlist(); // Access Wishlist Context
  
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    brand: '',
    priceRange: '',
    sort: '',
    search: ''
  });

  // Load Data
  const loadData = async () => {
    setIsLoadingProducts(true);
    const [prodData, settingsData] = await Promise.all([
        fetchProducts(),
        getSiteSettings()
    ]);
    setProducts(prodData);
    setSiteSettings(settingsData);
    setIsLoadingProducts(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync Products with Wishlist Context
  // This ensures items added from Admin (Firebase) appear in the wishlist
  useEffect(() => {
      if (products.length > 0) {
          setCatalog(products);
      }
  }, [products, setCatalog]);

  // Load Cart when User changes
  useEffect(() => {
    if (user) {
      const loadCart = async () => {
        const savedCart = await getCartFromFirebase(user.uid);
        if (cartItems.length === 0 && savedCart.length > 0) {
            setCartItems(savedCart);
        } else if (savedCart.length > 0) {
             setCartItems(savedCart);
        }
      };
      loadCart();
      
      // Reset admin view if user changes and is not admin
      if (!user.email?.startsWith('admin')) {
          setIsAdminView(false);
      }
    } else {
        // Reset when logged out
        setIsAdminView(false);
        setCartItems([]);
    }
  }, [user]);

  // Sync Cart to Firebase when changed (if user logged in)
  useEffect(() => {
    if (user && !authLoading) {
      const timeoutId = setTimeout(() => {
        saveCartToFirebase(user.uid, cartItems);
      }, 500); // Debounce writes
      return () => clearTimeout(timeoutId);
    }
  }, [cartItems, user, authLoading]);

  // Cart Logic
  const handleAddToCart = (product: Product, quantity = 1, variation?: ProductVariation) => {
    setCartItems(prev => {
      // Find item with same Product ID AND same Variation ID (if exists)
      const existingIndex = prev.findIndex(item => {
          const sameId = item.id === product.id;
          const sameVar = item.selectedVariation?.id === variation?.id;
          return sameId && sameVar;
      });

      if (existingIndex >= 0) {
        // Update existing item
        const newCart = [...prev];
        newCart[existingIndex].quantity += quantity;
        return newCart;
      }
      
      // Add new item
      // Override the main price with the variation price if selected
      const priceToUse = variation ? variation.price : product.price;
      const oldPriceToUse = variation ? variation.oldPrice : product.oldPrice;

      return [...prev, { 
          ...product, 
          price: priceToUse, 
          oldPrice: oldPriceToUse,
          quantity, 
          selectedVariation: variation 
      }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (id: string, delta: number, variationId?: string) => {
    setCartItems(prev => prev.map(item => {
      // Must match both ID and Variation ID to update the correct item
      const isMatch = item.id === id && item.selectedVariation?.id === variationId;
      
      if (isMatch) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id: string, variationId?: string) => {
    setCartItems(prev => prev.filter(item => {
        // Remove only if both match
        const isMatch = item.id === id && item.selectedVariation?.id === variationId;
        return !isMatch;
    }));
  };

  const handleCheckoutClick = () => {
      if (!user) {
          setIsCartOpen(false);
          setIsAuthOpen(true);
          return;
      }
      setIsCartOpen(false);
      setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = () => {
      setCartItems([]); // Clear local cart
      setIsCheckoutOpen(false);
      // Firebase cart sync will happen automatically via useEffect due to cartItems change
  };

  // Filter Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }

    if (filters.category) {
      // Special case for "Ofertas"
      if (filters.category === 'Ofertas') {
         result = result.filter(p => p.oldPrice !== undefined);
      } else {
         result = result.filter(p => p.category === filters.category);
      }
    }

    if (filters.brand) {
      result = result.filter(p => p.brand === filters.brand);
    }

    if (filters.priceRange) {
      if (filters.priceRange === '0-300') result = result.filter(p => p.price <= 300);
      else if (filters.priceRange === '300-500') result = result.filter(p => p.price > 300 && p.price <= 500);
      else if (filters.priceRange === '500-1000') result = result.filter(p => p.price > 500 && p.price <= 1000);
      else if (filters.priceRange === '1000+') result = result.filter(p => p.price > 1000);
    }

    if (filters.sort) {
      if (filters.sort === 'price-asc') result.sort((a, b) => a.price - b.price);
      else if (filters.sort === 'price-desc') result.sort((a, b) => b.price - a.price);
      else if (filters.sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
      else if (filters.sort === 'rating') result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [filters, products]);

  const scrollToProducts = () => {
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  if (authLoading) {
      return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-accent-gold" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        cartCount={cartItems.reduce((a, c) => a + c.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
        onSearch={(q) => { setFilters(prev => ({...prev, search: q})); scrollToProducts(); }}
        onCategoryClick={(cat) => { setFilters(prev => ({...prev, category: cat})); scrollToProducts(); }}
        onAiClick={() => setIsAiOpen(true)}
        onAdminClick={() => setIsAdminView(!isAdminView)}
        onOrdersClick={() => setIsOrdersOpen(true)}
        onWishlistClick={() => setIsWishlistOpen(true)}
        onProfileClick={() => setIsProfileOpen(true)}
        isAdminView={isAdminView}
        topBarText={siteSettings?.topBarText}
      />

      <main className="flex-1">
        {isAdminView ? (
            <AdminDashboard 
                products={products} 
                onProductUpdate={loadData}
            />
        ) : (
            <>
                {!filters.search && !filters.category && (
                <Hero onCtaClick={scrollToProducts} settings={siteSettings} />
                )}

                {/* Categories Section (only show on home view) */}
                {!filters.category && !filters.search && (
                    <section className="py-16 bg-gray-50">
                        <div className="container mx-auto px-4">
                            <h2 className="font-serif text-3xl text-center font-bold text-primary mb-12">Categorias</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[
                                    { name: 'Masculino', icon: '👔', desc: 'Sofisticação' },
                                    { name: 'Feminino', icon: '💐', desc: 'Elegância' },
                                    { name: 'Unissex', icon: '✨', desc: 'Versatilidade' },
                                    { name: 'Ofertas', icon: '🎁', desc: 'Oportunidades' }
                                ].map((cat) => (
                                    <div 
                                        key={cat.name}
                                        onClick={() => { setFilters(prev => ({...prev, category: cat.name})); scrollToProducts(); }}
                                        className="bg-white p-8 rounded-2xl text-center cursor-pointer hover:-translate-y-2 hover:shadow-lg transition-all border border-transparent hover:border-accent-gold group"
                                    >
                                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{cat.icon}</div>
                                        <h3 className="font-serif text-xl font-bold mb-2">{cat.name}</h3>
                                        <p className="text-sm text-gray-dark">{cat.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Products Section */}
                <section id="products" className="py-16 container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <h2 className="font-serif text-3xl font-bold text-primary">
                        {filters.category ? `${filters.category}` : 'Nossos Produtos'}
                        {filters.search && <span className="text-base font-sans font-normal text-gray-500 ml-3">Resultados para "{filters.search}"</span>}
                    </h2>
                    
                    {/* Filter Controls */}
                    <div className="flex flex-wrap gap-3">
                    <select 
                        className="px-4 py-2 border border-gray-medium rounded-lg text-sm focus:border-accent-gold focus:outline-none bg-white"
                        onChange={(e) => setFilters(prev => ({...prev, brand: e.target.value}))}
                        value={filters.brand}
                    >
                        <option value="">Todas as Marcas</option>
                        {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>

                    <select 
                        className="px-4 py-2 border border-gray-medium rounded-lg text-sm focus:border-accent-gold focus:outline-none bg-white"
                        onChange={(e) => setFilters(prev => ({...prev, priceRange: e.target.value}))}
                        value={filters.priceRange}
                    >
                        <option value="">Todos os Preços</option>
                        <option value="0-300">Até R$ 300</option>
                        <option value="300-500">R$ 300 - R$ 500</option>
                        <option value="500-1000">R$ 500 - R$ 1000</option>
                        <option value="1000+">Acima de R$ 1000</option>
                    </select>

                    <select 
                        className="px-4 py-2 border border-gray-medium rounded-lg text-sm focus:border-accent-gold focus:outline-none bg-white"
                        onChange={(e) => setFilters(prev => ({...prev, sort: e.target.value}))}
                        value={filters.sort}
                    >
                        <option value="">Ordenar por</option>
                        <option value="price-asc">Menor Preço</option>
                        <option value="price-desc">Maior Preço</option>
                        <option value="name">Nome A-Z</option>
                        <option value="rating">Mais Avaliados</option>
                    </select>
                    
                    {(filters.brand || filters.priceRange || filters.category || filters.search) && (
                        <button 
                            onClick={() => setFilters({category: '', brand: '', priceRange: '', sort: '', search: ''})}
                            className="text-sm text-accent-rose hover:underline font-medium"
                        >
                            Limpar Filtros
                        </button>
                    )}
                    </div>
                </div>

                {isLoadingProducts ? (
                    <div className="flex justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-accent-gold w-8 h-8" />
                            <p className="text-gray-500">Carregando catálogo...</p>
                        </div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-xl">
                        <p className="text-xl text-gray-500">Nenhum produto encontrado com esses filtros.</p>
                        <button 
                            onClick={() => setFilters({category: '', brand: '', priceRange: '', sort: '', search: ''})}
                            className="mt-4 text-accent-gold font-bold hover:underline"
                        >
                            Ver todos os produtos
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredProducts.map(product => (
                        <ProductCard 
                        key={product.id} 
                        product={product} 
                        // For Quick Add, we open modal if there are variations
                        onAddToCart={(p) => {
                            if (p.variations && p.variations.length > 0) {
                                setSelectedProduct(p);
                            } else {
                                handleAddToCart(p);
                            }
                        }}
                        onClick={(p) => setSelectedProduct(p)}
                        />
                    ))}
                    </div>
                )}
                </section>
            </>
        )}
      </main>

      <Footer />

      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckoutClick}
      />

      <WishlistSidebar 
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        onAddToCart={(p) => handleAddToCart(p)}
      />

      <ProductModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <AiAdvisorModal 
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
      />

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        total={cartItems.reduce((a, c) => a + c.price * c.quantity, 0)}
        onSuccess={handleOrderSuccess}
        siteSettings={siteSettings}
      />

      <UserOrdersModal 
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <WishlistProvider>
            <AppContent />
        </WishlistProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
