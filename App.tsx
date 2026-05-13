
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
import AboutModal from './components/AboutModal';
import { BRANDS } from './constants';
import { Product, CartItem, FilterState, SiteSettings, ProductVariation } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext'; // Import useWishlist
import { fetchProducts } from './services/productService';
import { getSiteSettings } from './services/settingsService';
import { getCartFromFirebase, saveCartToFirebase } from './services/cartService';
import { ToastProvider } from './context/ToastContext';
import { trackViewItemList, trackAddToCart, trackBeginCheckout } from './services/analyticsService';
import { Loader2, Shield, Flower2, Sparkles, Gift, HelpCircle, ChevronDown, Package, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [isAboutOpen, setIsAboutOpen] = useState(false);
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

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
    
    // Track View Item List
    if (prodData.length > 0) {
      trackViewItemList(prodData);
    }
  };

  useEffect(() => {
    loadData();

    // Check URL parameters for direct modal access
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'orders') {
      setIsOrdersOpen(true);
    }
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
    
    // Track Add to Cart with selected variation and its price
    const priceToTrack = variation ? variation.price : product.price;
    trackAddToCart({ ...product, price: priceToTrack, variation }, quantity);
    
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
      trackBeginCheckout(cartItems);
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

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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
        onAboutClick={() => setIsAboutOpen(true)}
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
                    <section className="py-20 bg-primary-dark">
                        <div className="container mx-auto px-4">
                            <h2 className="font-serif text-3xl text-center font-bold text-white mb-12 tracking-widest uppercase">
                                Explore por Categorias
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                {[
                                    { name: 'Para o Corpo', icon: Package, desc: 'Cuidados' },
                                    { name: 'Masculino', icon: Shield, desc: 'Sofisticação' },
                                    { name: 'Feminino', icon: Flower2, desc: 'Elegância' },
                                    { name: 'Unissex', icon: Sparkles, desc: 'Versatilidade' },
                                    { name: 'Ofertas', icon: Gift, desc: 'Oportunidades' }
                                ].map((cat) => (
                                    <div 
                                        key={cat.name}
                                        onClick={() => { setFilters(prev => ({...prev, category: cat.name})); scrollToProducts(); }}
                                        className="bg-gray-charcoal p-10 rounded-2xl text-center cursor-pointer hover:-translate-y-2 hover:bg-accent-gold/10 transition-all border border-white/5 hover:border-accent-gold group shadow-2xl"
                                    >
                                        <div className="flex justify-center mb-6">
                                            <cat.icon size={48} className="text-accent-gold group-hover:scale-110 transition-transform stroke-[1.5]" />
                                        </div>
                                        <h3 className="font-serif text-xl font-bold mb-2 text-white">{cat.name}</h3>
                                        <p className="text-xs text-accent-gold font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                                            {cat.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Products Section */}
                <section id="products" className="py-16 container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <h2 className="font-serif text-3xl font-bold text-white">
                        {filters.category ? `${filters.category}` : 'Nossos Produtos'}
                        {filters.search && <span className="text-base font-sans font-normal text-gray-500 ml-3">Resultados para "{filters.search}"</span>}
                    </h2>
                    
                    {/* Filter Controls */}
                    <div className="flex flex-wrap gap-3">
                    <select 
                        id="filter-brand"
                        aria-label="Filtrar por Marca"
                        className="px-4 py-2 bg-gray-charcoal border border-white/10 rounded-lg text-sm text-white focus:border-accent-gold focus:outline-none appearance-none cursor-pointer"
                        onChange={(e) => setFilters(prev => ({...prev, brand: e.target.value}))}
                        value={filters.brand}
                    >
                        <option value="" className="bg-gray-charcoal">Todas as Marcas</option>
                        {Array.from(new Set(products.map(p => p.brand))).sort().map(b => (
                            <option key={b} value={b} className="bg-gray-charcoal">{b}</option>
                        ))}
                    </select>

                    <select 
                        id="filter-price"
                        aria-label="Filtrar por Faixa de Preço"
                        className="px-4 py-2 bg-gray-charcoal border border-white/10 rounded-lg text-sm text-white focus:border-accent-gold focus:outline-none appearance-none cursor-pointer"
                        onChange={(e) => setFilters(prev => ({...prev, priceRange: e.target.value}))}
                        value={filters.priceRange}
                    >
                        <option value="" className="bg-gray-charcoal">Todos os Preços</option>
                        <option value="0-300" className="bg-gray-charcoal">Até R$ 300</option>
                        <option value="300-500" className="bg-gray-charcoal">R$ 300 - R$ 500</option>
                        <option value="500-1000" className="bg-gray-charcoal">R$ 500 - R$ 1000</option>
                        <option value="1000+" className="bg-gray-charcoal">Acima de R$ 1000</option>
                    </select>

                    <select 
                        id="sort-products"
                        aria-label="Ordenar produtos"
                        className="px-4 py-2 bg-gray-charcoal border border-white/10 rounded-lg text-sm text-white focus:border-accent-gold focus:outline-none appearance-none cursor-pointer"
                        onChange={(e) => setFilters(prev => ({...prev, sort: e.target.value}))}
                        value={filters.sort}
                    >
                        <option value="" className="bg-gray-charcoal">Ordenar por</option>
                        <option value="price-asc" className="bg-gray-charcoal">Menor Preço</option>
                        <option value="price-desc" className="bg-gray-charcoal">Maior Preço</option>
                        <option value="name" className="bg-gray-charcoal">Nome A-Z</option>
                        <option value="rating" className="bg-gray-charcoal">Mais Avaliados</option>
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
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {paginatedProducts.map(product => (
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

                        {/* Pagination UI */}
                        {totalPages > 1 && (
                            <div className="mt-16 flex flex-col items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); scrollToProducts(); }}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
                                        aria-label="Página Anterior"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                            // Show limited pages if many (simplified pagination for now)
                                            if (totalPages > 7) {
                                                if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                                                    if (page === 2 || page === totalPages - 1) return <span key={page} className="text-white/30 px-1">...</span>;
                                                    return null;
                                                }
                                            }
                                            
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => { setCurrentPage(page); scrollToProducts(); }}
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                                                        currentPage === page 
                                                        ? 'bg-accent-gold text-primary shadow-lg shadow-accent-gold/20' 
                                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); scrollToProducts(); }}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
                                        aria-label="Próxima Página"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                                <p className="text-white/40 text-xs font-medium uppercase tracking-widest">
                                    Página {currentPage} de {totalPages}
                                </p>
                            </div>
                        )}
                    </>
                )}
                </section>
                
                {/* FAQ Section (GEO/AEO Optimization) */}
                {!filters.category && !filters.search && (
                  <section className="py-20 bg-gray-charcoal">
                    <div className="container mx-auto px-4 max-w-4xl">
                      <div className="flex items-center justify-center gap-3 mb-12">
                        <HelpCircle className="text-accent-gold" size={32} />
                        <h2 className="font-serif text-3xl font-bold text-white text-center">Dúvidas Frequentes</h2>
                      </div>
                      <div className="space-y-6">
                        {[
                          {
                            q: "Os perfumes da Vision Perfumes são originais?",
                            a: "Sim, trabalhamos exclusivamente com fragrâncias originais e lacradas, importadas diretamente dos distribuidores oficiais das marcas mais prestigiadas do mundo."
                          },
                          {
                            q: "Qual a durabilidade (fixação) dos perfumes?",
                            a: "A fixação depende da concentração (EDC, EDT, EDP, Parfum) e das notas da fragrância, além do tipo de pele. Perfumes 'Eau de Parfum' geralmente oferecem maior durabilidade, chegando a 8-12 horas."
                          },
                          {
                            q: "Como escolher o perfume ideal para mim?",
                            a: "Recomendamos identificar as famílias olfativas que você mais gosta (Ex: Amadeirado, Floral, Cítrico). Nosso Consultor de IA também pode ajudar você a encontrar a fragrância perfeita com base em suas preferências."
                          },
                          {
                            q: "Vocês realizam entregas em todo o Brasil?",
                            a: "Sim, entregamos em todo o território nacional via transportadoras parceiras e Correios, com seguro total contra extravios."
                          }
                        ].map((faq, i) => (
                          <div key={i} className="bg-primary/30 p-6 rounded-2xl border border-white/5 hover:border-accent-gold/30 transition-all">
                            <h3 className="font-bold text-lg text-accent-gold mb-3 flex justify-between items-center">
                              {faq.q}
                            </h3>
                            <p className="text-gray-300 leading-relaxed">
                              {faq.a}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
            </>
        )}
      </main>

      <Footer onAboutClick={() => setIsAboutOpen(true)} />

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
        products={products}
        onAddToCart={(p) => handleAddToCart(p)}
        onViewProduct={(productId) => {
          const product = products.find(p => p.id === productId);
          if (product) setSelectedProduct(product);
        }}
      />

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <AboutModal 
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
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
