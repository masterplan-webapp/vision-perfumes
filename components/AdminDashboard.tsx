
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, Save, Search, Package, ShoppingBag, Truck, Filter, Sliders, Image as ImageIcon, Type, Eye, ArrowUp, ArrowDown, Upload, Loader2, Box, Layers, Ruler, RotateCcw, Users, Shield, CreditCard, Tag, RefreshCw, Server } from 'lucide-react';
import { Product, Order, OrderStatus, SiteSettings, HeroSlide, ProductVariation, AdminUser, Coupon } from '../types';
import { addProduct, updateProduct, deleteProduct } from '../services/productService';
import { getSiteSettings, updateSiteSettings } from '../services/settingsService';
import { uploadImage } from '../services/storageService';
import { getAdmins, addAdmin, removeAdmin } from '../services/adminService';
import { getCoupons, createCoupon, deleteCoupon } from '../services/couponService';
import { BRANDS } from '../constants';
import { useAdminOrders, useOrderActions } from '../hooks/useOrders';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import OrderDetails from './OrderDetails';

interface AdminDashboardProps {
  products: Product[];
  onProductUpdate: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, onProductUpdate }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings' | 'team' | 'coupons'>('products');
  const { addToast } = useToast();
  const { user } = useAuth();
  
  // Product State
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [uploadingProductImage, setUploadingProductImage] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  
  // Brand State
  const [isCustomBrand, setIsCustomBrand] = useState(false);

  // Order State
  const { orders, loading: loadingOrders, refreshOrders } = useAdminOrders();
  const { handleStatusChange } = useOrderActions(refreshOrders);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Settings State
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState<number | null>(null);

  // Team State
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Coupon State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
      code: '',
      type: 'percent',
      value: 0,
      isActive: true
  });

  // Initial Load
  useEffect(() => {
    if (activeTab === 'settings' && !settings) {
        setLoadingSettings(true);
        getSiteSettings().then(data => {
            setSettings(data);
            setLoadingSettings(false);
        });
    }
    if (activeTab === 'team') {
        loadTeam();
    }
    if (activeTab === 'coupons') {
        loadCoupons();
    }
  }, [activeTab]);

  const loadTeam = async () => {
      setLoadingTeam(true);
      const data = await getAdmins();
      if (data.length === 0 && user?.email?.startsWith('admin')) {
          setAdmins([{
              id: 'fallback-current',
              email: user.email,
              addedAt: new Date().toISOString(),
              addedBy: 'Sistema (Acesso via Fallback)',
          }]);
      } else {
          setAdmins(data);
      }
      setLoadingTeam(false);
  };

  const loadCoupons = async () => {
      setLoadingCoupons(true);
      try {
        const data = await getCoupons();
        setCoupons(data);
      } catch (e) {
        console.error("Erro ao carregar cupons", e);
      } finally {
        setLoadingCoupons(false);
      }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newAdminEmail) return;
      setLoadingTeam(true);
      try {
          await addAdmin(newAdminEmail, user?.email || 'System');
          setNewAdminEmail('');
          addToast('Administrador adicionado!', 'success');
          await loadTeam();
      } catch (error: any) {
          addToast(error.message || 'Erro ao adicionar admin.', 'error');
      } finally {
          setLoadingTeam(false);
      }
  };

  const handleRemoveAdmin = async (id: string, email: string) => {
      if (email === user?.email) {
          addToast('Você não pode remover a si mesmo.', 'error');
          return;
      }
      if (id === 'fallback-current') {
          addToast('Este é um acesso de sistema e não pode ser removido aqui.', 'info');
          return;
      }

      if (window.confirm(`Remover acesso de ${email}?`)) {
          setLoadingTeam(true);
          try {
              await removeAdmin(id); 
              addToast('Administrador removido.', 'success');
              await loadTeam();
          } catch (error) {
              addToast('Erro ao remover.', 'error');
          } finally {
              setLoadingTeam(false);
          }
      }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCoupon.code || !newCoupon.value) return;
      
      setLoadingCoupons(true);
      try {
          await createCoupon({
              code: newCoupon.code.toUpperCase(),
              type: newCoupon.type || 'percent',
              value: Number(newCoupon.value),
              isActive: true,
              minPurchase: newCoupon.minPurchase ? Number(newCoupon.minPurchase) : undefined,
              usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : undefined,
              expirationDate: newCoupon.expirationDate
          });
          addToast('Cupom criado com sucesso!', 'success');
          setNewCoupon({ code: '', type: 'percent', value: 0, isActive: true, minPurchase: undefined, usageLimit: undefined, expirationDate: undefined });
          await loadCoupons();
      } catch (error: any) {
          addToast(error.message || 'Erro ao criar cupom.', 'error');
      } finally {
          setLoadingCoupons(false);
      }
  };

  const handleDeleteCoupon = async (id: string) => {
      if(window.confirm('Excluir este cupom?')) {
          setLoadingCoupons(true);
          try {
              await deleteCoupon(id);
              addToast('Cupom excluído.', 'success');
              await loadCoupons();
          } catch (error) {
              addToast('Erro ao excluir cupom.', 'error');
          } finally {
              setLoadingCoupons(false);
          }
      }
  };

  // Compute available brands dynamically from existing products + constants
  const availableBrands = useMemo(() => {
    const uniqueBrands = new Set([...BRANDS, ...products.map(p => p.brand)]);
    return Array.from(uniqueBrands).sort();
  }, [products]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.brand.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o => {
      const matchesStatus = orderFilter === 'all' || o.status === orderFilter;
      const q = orderSearch.toLowerCase();
      const matchesSearch = 
        o.id.toLowerCase().includes(q) || 
        o.customerEmail.toLowerCase().includes(q) || 
        o.customerName.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
  });

  const handleAddNew = () => {
    setCurrentProduct({
      name: '',
      brand: BRANDS[0],
      price: 0,
      image: 'https://picsum.photos/400/400',
      category: 'Unissex',
      description: '',
      rating: 5,
      reviews: 0,
      isNew: true,
      weight: 0.5,
      dimensions: { width: 10, height: 15, depth: 10 },
      variations: []
    });
    setIsCustomBrand(false);
    setIsEditing(true);
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct({ 
        ...product, 
        variations: product.variations || [],
        dimensions: product.dimensions || { width: 0, height: 0, depth: 0 },
        weight: product.weight || 0
    });
    setIsCustomBrand(false);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      setLoadingProduct(true);
      try {
        await deleteProduct(id);
        await onProductUpdate();
        addToast('Produto excluído com sucesso!', 'success');
      } catch (error: any) {
        console.error("Erro ao excluir:", error);
        let msg = 'Erro ao excluir produto.';
        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
            msg = '⚠️ PERMISSÃO NEGADA: Ajuste as Regras no Console do Firebase.';
        }
        addToast(msg, 'error');
      } finally {
        setLoadingProduct(false);
      }
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProductImage(true);
    try {
        const url = await uploadImage(file, 'products');
        setCurrentProduct(prev => ({ ...prev, image: url }));
        addToast('Imagem enviada!', 'success');
    } catch (error) {
        addToast('Erro ao enviar imagem.', 'error');
    } finally {
        setUploadingProductImage(false);
    }
  };

  const handleAddVariation = () => {
    const newVar: ProductVariation = {
        id: Math.random().toString(36).substr(2, 9),
        size: '', price: 0, weight: 0, dimensions: { width: 0, height: 0, depth: 0 }
    };
    setCurrentProduct({ ...currentProduct, variations: [...(currentProduct.variations || []), newVar] });
  };

  const handleRemoveVariation = (index: number) => {
      const newVars = [...(currentProduct.variations || [])];
      newVars.splice(index, 1);
      setCurrentProduct({ ...currentProduct, variations: newVars });
  };

  const handleUpdateVariation = (index: number, field: keyof ProductVariation, value: any) => {
      const newVars = [...(currentProduct.variations || [])];
      newVars[index] = { ...newVars[index], [field]: value };
      setCurrentProduct({ ...currentProduct, variations: newVars });
  };

  const handleUpdateVariationDimension = (index: number, dimField: 'width' | 'height' | 'depth', value: number) => {
      const newVars = [...(currentProduct.variations || [])];
      const currentDims = newVars[index].dimensions || { width: 0, height: 0, depth: 0 };
      newVars[index] = { ...newVars[index], dimensions: { ...currentDims, [dimField]: value } };
      setCurrentProduct({ ...currentProduct, variations: newVars });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProduct(true);
    try {
      const safeNum = (val: any, defaultVal = 0) => {
         if (val === '' || val === null || val === undefined) return defaultVal;
         const n = Number(val);
         return isNaN(n) ? defaultVal : n;
      };
      const safeOptionalNum = (val: any) => {
         if (val === '' || val === null || val === undefined) return null;
         const n = Number(val);
         return isNaN(n) ? null : n;
      };

      const productPayload: any = {
        name: currentProduct.name,
        brand: currentProduct.brand,
        image: currentProduct.image,
        category: currentProduct.category,
        description: currentProduct.description,
        isNew: !!currentProduct.isNew,
        price: safeNum(currentProduct.price),
        rating: safeNum(currentProduct.rating, 5),
        reviews: safeNum(currentProduct.reviews),
        weight: safeNum(currentProduct.weight),
        dimensions: {
            width: safeNum(currentProduct.dimensions?.width),
            height: safeNum(currentProduct.dimensions?.height),
            depth: safeNum(currentProduct.dimensions?.depth),
        },
        variations: (currentProduct.variations || []).map(v => {
            const cleanedVariation: any = {
                id: v.id,
                size: v.size || '',
                price: safeNum(v.price),
                weight: safeNum(v.weight),
                dimensions: {
                    width: safeNum(v.dimensions?.width),
                    height: safeNum(v.dimensions?.height),
                    depth: safeNum(v.dimensions?.depth),
                }
            };
            const op = safeOptionalNum(v.oldPrice);
            if (op !== null) cleanedVariation.oldPrice = op;
            const st = safeOptionalNum(v.stock);
            if (st !== null) cleanedVariation.stock = st;
            return cleanedVariation;
        })
      };

      const rootOp = safeOptionalNum(currentProduct.oldPrice);
      if (rootOp !== null) productPayload.oldPrice = rootOp;

      if (currentProduct.id) {
        await updateProduct(currentProduct.id, productPayload);
        addToast('Produto atualizado!', 'success');
      } else {
        await addProduct(productPayload);
        addToast('Produto criado!', 'success');
      }
      await onProductUpdate();
      setIsEditing(false);
    } catch (error: any) {
      let msg = 'Erro ao salvar produto.';
      if (error.code === 'permission-denied') msg = '⚠️ PERMISSÃO NEGADA.';
      addToast(msg, 'error');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!settings) return;
      setLoadingSettings(true);
      try {
          await updateSiteSettings(settings);
          await onProductUpdate();
          addToast('Configurações atualizadas!', 'success');
      } catch (error: any) {
          addToast('Erro ao salvar configurações', 'error');
      } finally {
          setLoadingSettings(false);
      }
  };
  
  const handleAddSlide = () => {
    if (!settings) return;
    const newSlide: HeroSlide = {
        id: Math.random().toString(36).substr(2, 9),
        title: "Novo Título",
        subtitle: "Nova Sublegenda",
        buttonText: "Botão",
        image: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=2070&auto=format&fit=crop"
    };
    setSettings({ ...settings, slides: [...(settings.slides || []), newSlide] });
  };

  const handleRemoveSlide = (index: number) => {
    if (!settings) return;
    if (settings.slides.length <= 1) {
        addToast('Você precisa ter pelo menos um slide.', 'error');
        return;
    }
    const newSlides = [...settings.slides];
    newSlides.splice(index, 1);
    setSettings({ ...settings, slides: newSlides });
  };

  const handleSlideChange = (index: number, field: keyof HeroSlide, value: string) => {
    if (!settings) return;
    const newSlides = [...settings.slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setSettings({ ...settings, slides: newSlides });
  };

  const handleSlideImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    setUploadingSlideIndex(index);
    try {
      const url = await uploadImage(file, 'hero-slides');
      handleSlideChange(index, 'image', url);
      addToast('Imagem enviada!', 'success');
    } catch (error) {
      addToast('Erro ao fazer upload.', 'error');
    } finally {
      setUploadingSlideIndex(null);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-20">
      {/* Admin Nav */}
      <div className="bg-primary text-white sticky top-[88px] z-40 shadow-md">
        <div className="container mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {[
                    { id: 'products', label: 'Produtos', icon: Package },
                    { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
                    { id: 'coupons', label: 'Cupons', icon: Tag },
                    { id: 'team', label: 'Equipe', icon: Users },
                    { id: 'settings', label: 'Loja', icon: Sliders },
                ].map((tab: any) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-4 font-bold border-b-4 transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'border-accent-gold text-accent-gold bg-white/5' 
                            : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        
        {/* === PRODUCTS TAB === */}
        {activeTab === 'products' && (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar produtos..." 
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                        />
                    </div>
                    <button 
                        onClick={handleAddNew}
                        className="bg-accent-gold text-white px-6 py-2 rounded-lg font-bold hover:bg-[#c49b2d] transition-colors flex items-center gap-2 shadow-md w-full md:w-auto justify-center"
                    >
                        <Plus size={20} /> Novo Produto
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="p-4 w-20">Imagem</th>
                                    <th className="p-4">Nome</th>
                                    <th className="p-4">Marca</th>
                                    <th className="p-4">Preço</th>
                                    <th className="p-4 text-center">Variações</th>
                                    <th className="p-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden border border-gray-200">
                                                <img src={product.image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-gray-700">{product.name}</td>
                                        <td className="p-4 text-gray-600">{product.brand}</td>
                                        <td className="p-4 font-mono text-gray-700">
                                            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">
                                                {product.variations?.length || 0}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* === ORDERS TAB === */}
        {activeTab === 'orders' && (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                     <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setOrderFilter(status)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                                    orderFilter === status 
                                    ? 'bg-primary text-white' 
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {status === 'all' ? 'Todos' : status}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                         <input 
                            type="text" 
                            placeholder="Buscar pedido, email..."
                            value={orderSearch}
                            onChange={e => setOrderSearch(e.target.value)} 
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                         />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loadingOrders ? (
                        <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-accent-gold" size={32} /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Data</th>
                                        <th className="p-4">Cliente</th>
                                        <th className="p-4">Total</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredOrders.map(order => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="p-4 text-xs font-mono text-gray-500">#{order.id.slice(0, 8)}</td>
                                            <td className="p-4 text-sm">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</td>
                                            <td className="p-4">
                                                <div className="text-sm font-bold">{order.customerName}</div>
                                                <div className="text-xs text-gray-400">{order.customerEmail}</div>
                                            </td>
                                            <td className="p-4 font-bold text-sm">
                                                R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4">
                                                <select 
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                                    className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border-0 bg-transparent cursor-pointer focus:ring-2 focus:ring-accent-gold ${
                                                        order.status === 'delivered' ? 'text-green-600' : 
                                                        order.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'
                                                    }`}
                                                >
                                                    <option value="pending">Pendente</option>
                                                    <option value="processing">Processando</option>
                                                    <option value="shipped">Enviado</option>
                                                    <option value="delivered">Entregue</option>
                                                    <option value="cancelled">Cancelado</option>
                                                </select>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="text-gray-400 hover:text-accent-gold transition-colors"
                                                    title="Ver Detalhes"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* === COUPONS TAB === */}
        {activeTab === 'coupons' && (
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
                            <Tag size={20} /> Criar Novo Cupom
                        </h3>
                        <button 
                            onClick={loadCoupons} 
                            className="text-gray-400 hover:text-accent-gold p-2 rounded transition-colors"
                            title="Atualizar Lista"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código</label>
                            <input 
                                type="text" 
                                placeholder="EX: VERAO10" 
                                value={newCoupon.code}
                                onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none uppercase font-bold"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Desconto</label>
                            <select 
                                value={newCoupon.type}
                                onChange={(e) => setNewCoupon({...newCoupon, type: e.target.value as any})}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none bg-white"
                            >
                                <option value="percent">Porcentagem (%)</option>
                                <option value="fixed">Valor Fixo (R$)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor do Desconto</label>
                            <input 
                                type="number" 
                                step="0.01"
                                placeholder={newCoupon.type === 'percent' ? "Ex: 10" : "Ex: 50.00"}
                                value={newCoupon.value || ''}
                                onChange={(e) => setNewCoupon({...newCoupon, value: parseFloat(e.target.value)})}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Compra Mínima (Opcional)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                placeholder="R$ 0,00"
                                value={newCoupon.minPurchase || ''}
                                onChange={(e) => setNewCoupon({...newCoupon, minPurchase: parseFloat(e.target.value)})}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data de Validade (Opcional)</label>
                            <input 
                                type="date" 
                                value={newCoupon.expirationDate || ''}
                                onChange={(e) => setNewCoupon({...newCoupon, expirationDate: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                            />
                        </div>
                        <div>
                            <button 
                                type="submit" 
                                disabled={loadingCoupons}
                                className="w-full bg-accent-gold text-white px-4 py-2 rounded-lg font-bold hover:bg-[#c49b2d] transition-colors flex items-center justify-center gap-2"
                            >
                                {loadingCoupons ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                Criar Cupom
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 space-y-3">
                        <h4 className="font-bold text-sm text-gray-600 uppercase tracking-wider mb-4">Cupons Ativos</h4>
                        {loadingCoupons ? (
                             <div className="text-center py-8"><Loader2 className="animate-spin mx-auto text-accent-gold" /></div>
                        ) : coupons.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-dashed border border-gray-200">
                                Nenhum cupom criado.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {coupons.map(coupon => (
                                    <div key={coupon.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-green-700 font-bold font-mono text-lg">
                                                {coupon.code}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">
                                                    {coupon.type === 'percent' ? `${coupon.value}% OFF` : `R$ ${coupon.value.toFixed(2)} OFF`}
                                                </p>
                                                <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                                    {coupon.minPurchase && <span>Min: R$ {coupon.minPurchase}</span>}
                                                    {coupon.expirationDate && <span>Expira: {new Date(coupon.expirationDate).toLocaleDateString()}</span>}
                                                    <span>Usos: {coupon.usageCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => coupon.id && handleDeleteCoupon(coupon.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg"
                                            title="Excluir Cupom"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* === TEAM TAB === */}
        {activeTab === 'team' && (
            <div className="max-w-4xl mx-auto space-y-8">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
                        <Users size={20} /> Gerenciar Administradores
                    </h3>
                    
                    <form onSubmit={handleAddAdmin} className="flex gap-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <input 
                            type="email" 
                            placeholder="Email do novo administrador" 
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                            required
                        />
                        <button 
                            type="submit" 
                            disabled={loadingTeam}
                            className="bg-accent-gold text-white px-6 py-3 rounded-lg font-bold hover:bg-[#c49b2d] transition-colors flex items-center gap-2"
                        >
                            {loadingTeam ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                            Adicionar
                        </button>
                    </form>

                    <div className="space-y-2">
                        {loadingTeam && admins.length === 0 ? (
                             <div className="text-center py-8"><Loader2 className="animate-spin mx-auto text-accent-gold" /></div>
                        ) : (
                            admins.map(admin => (
                                <div key={admin.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-accent-gold/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{admin.email}</p>
                                            <p className="text-xs text-gray-400">
                                                Adicionado em: {admin.addedAt ? new Date(admin.addedAt).toLocaleDateString() : 'N/A'} 
                                                {admin.addedBy && ` por ${admin.addedBy}`}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => admin.id && handleRemoveAdmin(admin.id, admin.email)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg"
                                        title={admin.id === 'fallback-current' ? "Não é possível remover acesso de sistema" : "Remover acesso"}
                                        disabled={admin.id === 'fallback-current'}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                        {admins.length === 0 && !loadingTeam && (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-dashed border border-gray-200">
                                Nenhum administrador na lista.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* === SETTINGS TAB === */}
        {activeTab === 'settings' && settings && (
            <div className="max-w-4xl mx-auto space-y-8">
                <form onSubmit={handleSaveSettings} className="space-y-8">
                    
                    {/* General Settings */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
                            <Sliders size={20} /> Configurações Gerais
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Texto Promocional (Topo)</label>
                                <input 
                                    type="text"
                                    value={settings.topBarText}
                                    onChange={(e) => setSettings({...settings, topBarText: e.target.value})}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Settings */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
                            <CreditCard size={20} /> Pagamento (Pagar.me)
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chave Pública (Public Key)</label>
                                <input 
                                    type="text"
                                    placeholder="pk_..."
                                    value={settings.pagarmePublicKey || ''}
                                    onChange={(e) => setSettings({...settings, pagarmePublicKey: e.target.value})}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none font-mono text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">Utilizada para criptografar os dados do cartão no frontend.</p>
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL do Backend (Cloud Functions)</label>
                                <div className="flex items-center gap-2">
                                    <Server size={16} className="text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="https://us-central1-..."
                                        value={settings.apiBaseUrl || ''}
                                        onChange={(e) => setSettings({...settings, apiBaseUrl: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none font-mono text-sm"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Deixe em branco para usar o <strong>Modo Simulação</strong>. 
                                    Configure isso quando tiver feito o deploy do backend.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Logistics Settings */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
                            <Truck size={20} /> Logística (Frenet)
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP de Origem (Estoque)</label>
                                    <input 
                                        type="text"
                                        placeholder="00000-000"
                                        value={settings.originZip || ''}
                                        onChange={(e) => setSettings({...settings, originZip: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Utilizado para calcular o frete (ponto de partida).</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Token de Acesso Frenet</label>
                                    <input 
                                        type="text"
                                        placeholder="Cole o token da Frenet aqui"
                                        value={settings.frenetToken || ''}
                                        onChange={(e) => setSettings({...settings, frenetToken: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none font-mono text-sm"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Chave de API para cálculo real de frete.</p>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mínimo para Frete Grátis (R$)</label>
                                <input 
                                    type="number"
                                    placeholder="Ex: 300.00"
                                    value={settings.freeShippingThreshold || ''}
                                    onChange={(e) => setSettings({...settings, freeShippingThreshold: parseFloat(e.target.value)})}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">Se o total da compra for maior que este valor, o frete mais barato será gratuito.</p>
                            </div>
                        </div>
                    </div>

                    {/* Hero Slides Settings */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
                                <ImageIcon size={20} /> Banners (Hero)
                            </h3>
                            <button 
                                type="button"
                                onClick={handleAddSlide}
                                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1"
                            >
                                <Plus size={14} /> Adicionar Slide
                            </button>
                        </div>
                        
                        {settings.slides.map((slide, index) => (
                            <div key={slide.id || index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative group">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSlide(index)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                                    title="Remover Slide"
                                >
                                    <Trash2 size={18} />
                                </button>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                                            <input 
                                                type="text"
                                                value={slide.title}
                                                onChange={(e) => handleSlideChange(index, 'title', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subtítulo</label>
                                            <textarea 
                                                value={slide.subtitle}
                                                onChange={(e) => handleSlideChange(index, 'subtitle', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none h-20 resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto do Botão</label>
                                            <input 
                                                type="text"
                                                value={slide.buttonText}
                                                onChange={(e) => handleSlideChange(index, 'buttonText', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link do Botão (CTA)</label>
                                            <input 
                                                type="text"
                                                placeholder="ex: #products ou /minha-conta"
                                                value={slide.ctaLink || ''}
                                                onChange={(e) => handleSlideChange(index, 'ctaLink', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Imagem de Fundo</label>
                                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3 group-hover:border-accent-gold border-2 border-transparent transition-colors">
                                            <img src={slide.image} alt="Preview" className="w-full h-full object-cover" />
                                            {uploadingSlideIndex === index && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <Loader2 className="animate-spin text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text"
                                                value={slide.image}
                                                onChange={(e) => handleSlideChange(index, 'image', e.target.value)}
                                                placeholder="URL da Imagem"
                                                className="flex-1 p-2 text-xs border border-gray-300 rounded focus:border-accent-gold outline-none"
                                            />
                                            <label className="cursor-pointer bg-primary text-white px-3 py-2 rounded text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-1">
                                                <Upload size={14} /> Upload
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleSlideImageUpload(index, e)}
                                                    disabled={uploadingSlideIndex !== null}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit" 
                            disabled={loadingSettings}
                            className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-600/20"
                        >
                            {loadingSettings ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        )}
      </div>

      {/* EDIT MODAL AND ORDER MODAL REMAIN SAME (Implied) */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <form onSubmit={handleSave}>
                    <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
                        <h2 className="font-serif text-2xl font-bold text-primary">
                            {currentProduct.id ? 'Editar Produto' : 'Novo Produto'}
                        </h2>
                        <button type="button" onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="p-8 space-y-8">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome</label>
                                    <input required type="text" value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none" />
                                </div>
                                {/* ... rest of fields ... */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Marca</label>
                                    {isCustomBrand ? (
                                        <div className="flex gap-2">
                                            <input 
                                                autoFocus
                                                type="text" 
                                                placeholder="Digite a nova marca"
                                                value={currentProduct.brand} 
                                                onChange={e => setCurrentProduct({...currentProduct, brand: e.target.value})} 
                                                className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none bg-yellow-50"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => { setIsCustomBrand(false); setCurrentProduct({...currentProduct, brand: availableBrands[0] || ''}) }}
                                                className="p-2 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"
                                                title="Cancelar nova marca"
                                            >
                                                <RotateCcw size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <select 
                                            value={currentProduct.brand} 
                                            onChange={e => {
                                                if (e.target.value === '__NEW__') {
                                                    setIsCustomBrand(true);
                                                    setCurrentProduct({...currentProduct, brand: ''});
                                                } else {
                                                    setCurrentProduct({...currentProduct, brand: e.target.value});
                                                }
                                            }} 
                                            className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none"
                                        >
                                            {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                                            <option value="__NEW__" className="font-bold bg-gray-50">+ Criar nova marca...</option>
                                        </select>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Preço (Base)</label>
                                        <input required type="number" step="0.01" value={currentProduct.price || ''} onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})} className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Preço Antigo</label>
                                        <input type="number" step="0.01" value={currentProduct.oldPrice || ''} onChange={e => setCurrentProduct({...currentProduct, oldPrice: parseFloat(e.target.value)})} className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Imagem do Produto</label>
                                    <div className="flex gap-2 items-start">
                                        <div className="flex-1 space-y-2">
                                            <input 
                                                required 
                                                type="text" 
                                                placeholder="URL da imagem"
                                                value={currentProduct.image} 
                                                onChange={e => setCurrentProduct({...currentProduct, image: e.target.value})} 
                                                className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none" 
                                            />
                                            <label className="inline-flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                                                {uploadingProductImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                                Fazer Upload de Foto
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleProductImageUpload}
                                                    disabled={uploadingProductImage}
                                                />
                                            </label>
                                        </div>
                                        <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden shrink-0 relative">
                                            {currentProduct.image ? (
                                                <img src={currentProduct.image} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <ImageIcon size={24} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
                                    <select value={currentProduct.category} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value as any})} className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none">
                                        <option value="Masculino">Masculino</option>
                                        <option value="Feminino">Feminino</option>
                                        <option value="Unissex">Unissex</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                                    <textarea required value={currentProduct.description} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none h-24 resize-none"></textarea>
                                </div>
                            </div>
                        </div>

                         {/* Logistics Section (Base) */}
                         <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                             <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                 <Truck size={18} /> Logística Padrão (Fallback)
                             </h3>
                             <div className="grid grid-cols-4 gap-4">
                                 <div>
                                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Peso (kg)</label>
                                     <input 
                                        type="number" step="0.01"
                                        value={currentProduct.weight || ''} 
                                        onChange={e => setCurrentProduct({...currentProduct, weight: parseFloat(e.target.value)})} 
                                        className="w-full p-2 bg-white border border-gray-300 rounded text-sm" 
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Largura (cm)</label>
                                     <input 
                                        type="number"
                                        value={currentProduct.dimensions?.width || ''} 
                                        onChange={e => setCurrentProduct({...currentProduct, dimensions: {...(currentProduct.dimensions || {height:0, depth:0}), width: parseFloat(e.target.value)} as any})} 
                                        className="w-full p-2 bg-white border border-gray-300 rounded text-sm" 
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Altura (cm)</label>
                                     <input 
                                        type="number"
                                        value={currentProduct.dimensions?.height || ''} 
                                        onChange={e => setCurrentProduct({...currentProduct, dimensions: {...(currentProduct.dimensions || {width:0, depth:0}), height: parseFloat(e.target.value)} as any})} 
                                        className="w-full p-2 bg-white border border-gray-300 rounded text-sm" 
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Profundidade (cm)</label>
                                     <input 
                                        type="number"
                                        value={currentProduct.dimensions?.depth || ''} 
                                        onChange={e => setCurrentProduct({...currentProduct, dimensions: {...(currentProduct.dimensions || {width:0, height:0}), depth: parseFloat(e.target.value)} as any})} 
                                        className="w-full p-2 bg-white border border-gray-300 rounded text-sm" 
                                     />
                                 </div>
                             </div>
                         </div>

                        {/* Variations Section */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                                    <Layers size={20} /> Variações
                                </h3>
                                <button type="button" onClick={handleAddVariation} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-lg font-bold transition-colors">
                                    + Adicionar
                                </button>
                            </div>

                            <div className="space-y-4">
                                {currentProduct.variations?.map((v, idx) => (
                                    <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveVariation(idx)}
                                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={16} />
                                        </button>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <input 
                                                type="text" 
                                                placeholder="Tamanho (ex: 50ml)" 
                                                value={v.size} 
                                                onChange={(e) => handleUpdateVariation(idx, 'size', e.target.value)}
                                                className="w-full p-2 text-sm border border-gray-300 rounded focus:border-accent-gold outline-none"
                                            />
                                            <input 
                                                type="number" step="0.01"
                                                placeholder="Preço (R$)" 
                                                value={v.price || ''} 
                                                onChange={(e) => handleUpdateVariation(idx, 'price', e.target.value)}
                                                className="w-full p-2 text-sm border border-gray-300 rounded focus:border-accent-gold outline-none"
                                            />
                                            <input 
                                                type="number" step="0.01"
                                                placeholder="Preço Antigo (Opcional)" 
                                                value={v.oldPrice || ''} 
                                                onChange={(e) => handleUpdateVariation(idx, 'oldPrice', e.target.value)}
                                                className="w-full p-2 text-sm border border-gray-300 rounded focus:border-accent-gold outline-none"
                                            />
                                            <input 
                                                type="number"
                                                placeholder="Estoque" 
                                                value={v.stock || ''} 
                                                onChange={(e) => handleUpdateVariation(idx, 'stock', e.target.value)}
                                                className="w-full p-2 text-sm border border-gray-300 rounded focus:border-accent-gold outline-none"
                                            />
                                        </div>

                                        {/* Logistics per Variation */}
                                        <div className="bg-white p-3 rounded-lg border border-gray-200/50">
                                            <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                                <Box size={12} /> Logística da Variação
                                            </h5>
                                            <div className="grid grid-cols-4 gap-3">
                                                <div className="relative">
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">KG</span>
                                                    <input 
                                                        type="number" step="0.01"
                                                        placeholder="Peso"
                                                        value={v.weight || ''}
                                                        onChange={(e) => handleUpdateVariation(idx, 'weight', e.target.value)}
                                                        className="w-full p-1.5 text-xs border border-gray-300 rounded focus:border-accent-gold outline-none"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">L</span>
                                                    <input 
                                                        type="number"
                                                        placeholder="Largura"
                                                        value={v.dimensions?.width || ''}
                                                        onChange={(e) => handleUpdateVariationDimension(idx, 'width', parseFloat(e.target.value))}
                                                        className="w-full p-1.5 text-xs border border-gray-300 rounded focus:border-accent-gold outline-none"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">A</span>
                                                    <input 
                                                        type="number"
                                                        placeholder="Altura"
                                                        value={v.dimensions?.height || ''}
                                                        onChange={(e) => handleUpdateVariationDimension(idx, 'height', parseFloat(e.target.value))}
                                                        className="w-full p-1.5 text-xs border border-gray-300 rounded focus:border-accent-gold outline-none"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">P</span>
                                                    <input 
                                                        type="number"
                                                        placeholder="Prof"
                                                        value={v.dimensions?.depth || ''}
                                                        onChange={(e) => handleUpdateVariationDimension(idx, 'depth', parseFloat(e.target.value))}
                                                        className="w-full p-1.5 text-xs border border-gray-300 rounded focus:border-accent-gold outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!currentProduct.variations || currentProduct.variations.length === 0) && (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                                        Nenhuma variação adicionada
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex justify-end gap-3 z-10">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loadingProduct} className="px-8 py-2 bg-primary text-white rounded-lg font-bold hover:bg-accent-gold transition-colors flex items-center gap-2">
                            {loadingProduct ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                            Salvar Produto
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
      
      {selectedOrder && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
                  <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors z-10"><X size={24} /></button>
                  <div className="p-8">
                      <h2 className="font-serif text-2xl font-bold text-primary mb-6">Detalhes do Pedido</h2>
                      <OrderDetails order={selectedOrder} isAdmin={true} />
                      <div className="mt-8 pt-8 border-t border-gray-100">
                          <h4 className="font-bold text-lg mb-4 text-primary flex items-center gap-2"><Truck size={20} /> Atualizar Rastreamento</h4>
                          <div className="flex gap-4">
                              <input type="text" placeholder="Código de Rastreio" className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none uppercase" defaultValue={selectedOrder.trackingCode || ''} id="trackingInput" />
                              <button onClick={() => { const code = (document.getElementById('trackingInput') as HTMLInputElement).value; if (code) { handleStatusChange(selectedOrder.id, 'shipped', code); addToast('Código salvo!', 'success'); } }} className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors">Salvar Rastreio</button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;
