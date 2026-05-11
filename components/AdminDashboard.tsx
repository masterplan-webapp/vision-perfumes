import React, { useState, useMemo } from 'react';
import { BarChart2, Package, ShoppingBag, Users, Tag, Shield, Sliders } from 'lucide-react';
import { Product } from '../types';
import { useAdminOrders, useOrderActions } from '../hooks/useOrders';
import AdminMetrics from './admin/AdminMetrics';
import AdminProducts from './admin/AdminProducts';
import AdminOrders from './admin/AdminOrders';
import AdminClients from './admin/AdminClients';
import AdminCoupons from './admin/AdminCoupons';
import AdminTeam from './admin/AdminTeam';
import AdminSettings from './admin/AdminSettings';

interface AdminDashboardProps {
  products: Product[];
  onProductUpdate: () => void;
}

type Tab = 'metrics' | 'products' | 'orders' | 'clients' | 'coupons' | 'team' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, onProductUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('metrics');
  const { orders, loading: loadingOrders, refreshOrders } = useAdminOrders();
  const { handleStatusChange } = useOrderActions(refreshOrders);

  const pendingCount = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'metrics',  label: 'Métricas', icon: BarChart2 },
    { id: 'products', label: 'Produtos',  icon: Package },
    { id: 'orders',   label: 'Pedidos',   icon: ShoppingBag, badge: pendingCount },
    { id: 'clients',  label: 'Clientes',  icon: Users },
    { id: 'coupons',  label: 'Cupons',    icon: Tag },
    { id: 'team',     label: 'Equipe',    icon: Shield },
    { id: 'settings', label: 'Loja',      icon: Sliders },
  ];

  return (
    <div className="bg-gray-100 min-h-screen pb-20">
      {/* Tab Nav */}
      <div className="bg-primary text-white sticky top-[88px] z-40 shadow-md">
        <div className="container mx-auto px-2 md:px-4">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 md:px-5 py-4 text-sm font-bold border-b-4 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-accent-gold text-accent-gold bg-white/5'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge != null && tab.badge > 0 && (
                  <span className="ml-0.5 bg-red-500 text-white text-[10px] font-extrabold leading-none px-1.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Container (Animation removed to prevent modal clipping issues) */}
      <div key={activeTab} className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        {activeTab === 'metrics'  && <AdminMetrics products={products} orders={orders} />}
        {activeTab === 'products' && <AdminProducts products={products} onProductUpdate={onProductUpdate} />}
        {activeTab === 'orders'   && (
          <AdminOrders orders={orders} loading={loadingOrders} handleStatusChange={handleStatusChange} />
        )}
        {activeTab === 'clients'  && <AdminClients />}
        {activeTab === 'coupons'  && <AdminCoupons />}
        {activeTab === 'team'     && <AdminTeam />}
        {activeTab === 'settings' && <AdminSettings onProductUpdate={onProductUpdate} />}
      </div>
    </div>
  );
};

export default AdminDashboard;
