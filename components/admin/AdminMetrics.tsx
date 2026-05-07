import React, { useMemo } from 'react';
import { Product, Order } from '../../types';
import { TrendingUp, ShoppingBag, Users, DollarSign } from 'lucide-react';

interface AdminMetricsProps {
  products: Product[];
  orders: Order[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-400',
  processing: 'bg-blue-400',
  shipped: 'bg-purple-400',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-400',
};

const AdminMetrics: React.FC<AdminMetricsProps> = ({ products, orders }) => {
  const metrics = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + o.total, 0);

    const now = new Date();
    const monthlyOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const avgTicket = activeOrders.length ? totalRevenue / activeOrders.length : 0;
    const uniqueClients = new Set(orders.map(o => o.customerEmail)).size;

    const statusCounts: Record<string, number> = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    orders.forEach(o => {
      if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
    });

    const productSales: Record<string, { name: string; image: string; count: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = { name: item.name, image: item.image, count: 0 };
        }
        productSales[item.id].count += item.quantity;
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const maxStatus = Math.max(...Object.values(statusCounts), 1);

    return { totalRevenue, monthlyOrders, avgTicket, uniqueClients, statusCounts, topProducts, maxStatus };
  }, [orders]);

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const cards = [
    {
      label: 'Receita Total',
      value: `R$ ${fmt(metrics.totalRevenue)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Pedidos este Mês',
      value: metrics.monthlyOrders.length,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Ticket Médio',
      value: `R$ ${fmt(metrics.avgTicket)}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Clientes Únicos',
      value: metrics.uniqueClients,
      icon: Users,
      color: 'text-accent-gold',
      bg: 'bg-yellow-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(card => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4"
          >
            <div className={`${card.bg} ${card.color} p-3 rounded-xl`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              <p className="text-xl font-bold text-gray-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-700 mb-5">Pedidos por Status</h3>
          {orders.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">Nenhum pedido ainda.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(metrics.statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 shrink-0">{STATUS_LABELS[status]}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full ${STATUS_COLORS[status]} transition-all`}
                      style={{ width: `${(count / metrics.maxStatus) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-700 mb-5">Top 5 Produtos Mais Vendidos</h3>
          {metrics.topProducts.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">Nenhuma venda registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {metrics.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{p.name}</p>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">
                    {p.count} un.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-700 mb-4">Resumo do Catálogo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{products.length}</p>
            <p className="text-xs text-gray-500 mt-1">Produtos Ativos</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {new Set(products.map(p => p.brand)).size}
            </p>
            <p className="text-xs text-gray-500 mt-1">Marcas</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {products.filter(p => p.isNew).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Novidades</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{orders.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total de Pedidos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMetrics;
