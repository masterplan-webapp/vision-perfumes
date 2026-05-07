import React, { useState } from 'react';
import { Search, Eye, Truck, Loader2, X, Download } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import { exportOrdersCSV } from '../../services/exportService';
import OrderDetails from '../OrderDetails';

interface AdminOrdersProps {
  orders: Order[];
  loading: boolean;
  handleStatusChange: (orderId: string, newStatus: OrderStatus, trackingCode?: string) => Promise<void>;
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending:    { label: 'Pendente',     classes: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'Processando',  classes: 'bg-blue-100 text-blue-800' },
  shipped:    { label: 'Enviado',      classes: 'bg-purple-100 text-purple-800' },
  delivered:  { label: 'Entregue',     classes: 'bg-green-100 text-green-800' },
  cancelled:  { label: 'Cancelado',    classes: 'bg-red-100 text-red-800' },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
};

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, loading, handleStatusChange }) => {
  const { addToast } = useToast();
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  const filtered = orders.filter(o => {
    const matchesStatus = orderFilter === 'all' || o.status === orderFilter;
    const q = orderSearch.toLowerCase();
    const matchesSearch =
      o.id.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const openOrder = (order: Order) => {
    setSelectedOrder(order);
    setTrackingInput(order.trackingCode || '');
  };

  const handleSaveTracking = async () => {
    if (!selectedOrder || !trackingInput) return;
    await handleStatusChange(selectedOrder.id, 'shipped', trackingInput);
    addToast('Código de rastreio salvo!', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setOrderFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                orderFilter === s
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'Todos' : STATUS_CONFIG[s]?.label ?? s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar ID, nome, email..."
              value={orderSearch}
              onChange={e => setOrderSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-accent-gold outline-none bg-white"
            />
          </div>
          <button
            onClick={() => exportOrdersCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <Download size={15} /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex justify-center">
          <Loader2 className="animate-spin text-accent-gold" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          Nenhum pedido encontrado.
        </div>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                  {filtered.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-xs font-mono text-gray-400">#{order.id.slice(0, 8)}</td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-bold text-gray-800">{order.customerName}</p>
                        <p className="text-xs text-gray-400">{order.customerEmail}</p>
                      </td>
                      <td className="p-4 font-bold text-sm text-gray-800">
                        R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={order.status} />
                          <select
                            value={order.status}
                            onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                            className="text-xs text-gray-500 border-0 bg-transparent cursor-pointer focus:ring-0 outline-none p-0"
                            title="Alterar status"
                          >
                            <option value="pending">Pendente</option>
                            <option value="processing">Processando</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregue</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openOrder(order)}
                          className="p-1.5 text-gray-400 hover:text-accent-gold transition-colors rounded"
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
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-3">
            {filtered.map(order => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-gray-800">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.customerEmail}</p>
                    <p className="text-[11px] font-mono text-gray-300 mt-0.5">#{order.id.slice(0, 8)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-primary">
                      R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white cursor-pointer outline-none"
                    >
                      <option value="pending">Pendente</option>
                      <option value="processing">Processando</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregue</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                    <button
                      onClick={() => openOrder(order)}
                      className="p-2 text-gray-400 hover:text-accent-gold transition-colors bg-gray-50 rounded-lg"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-serif text-xl font-bold text-primary">Detalhes do Pedido</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={22} />
              </button>
            </div>
            <div className="p-6">
              <OrderDetails order={selectedOrder} isAdmin={true} />
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-bold mb-3 text-primary flex items-center gap-2">
                  <Truck size={18} /> Atualizar Rastreamento
                </h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Código de Rastreio"
                    value={trackingInput}
                    onChange={e => setTrackingInput(e.target.value.toUpperCase())}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none uppercase text-sm"
                  />
                  <button
                    onClick={handleSaveTracking}
                    className="bg-purple-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors text-sm whitespace-nowrap"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
