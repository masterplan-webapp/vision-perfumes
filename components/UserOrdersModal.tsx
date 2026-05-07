


import React, { useState } from 'react';
import { X, Package, ChevronDown, ChevronUp, Loader2, AlertTriangle } from 'lucide-react';
import { useUserOrders, useOrderActions } from '../hooks/useOrders';
import OrderDetails from './OrderDetails';
import { useToast } from '../context/ToastContext';

interface UserOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserOrdersModal: React.FC<UserOrdersModalProps> = ({ isOpen, onClose }) => {
  const { orders, loading, refreshOrders } = useUserOrders();
  const { handleCancel, loading: actionLoading } = useOrderActions(refreshOrders);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const { addToast } = useToast();

  if (!isOpen) return null;

  const onCancelClick = async (orderId: string) => {
    try {
      await handleCancel(orderId);
      addToast('Pedido cancelado com sucesso.', 'info');
    } catch (error) {
      addToast('Erro ao cancelar pedido.', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl overflow-hidden flex flex-col relative">
        <div className="p-6 border-b border-gray-medium bg-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
                <Package className="text-accent-gold" /> Meus Pedidos
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['all', 'pending', 'shipped', 'delivered'].map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors capitalize ${
                        activeTab === tab 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {tab === 'all' ? 'Todos' : tab}
                </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-accent-gold w-8 h-8" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
                <Package size={64} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Nenhum pedido encontrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300">
                    <div 
                        className="p-5 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-4 justify-between"
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                                <span className="text-xs text-gray-400 font-mono">#{order.id.slice(0, 8)}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between md:justify-end gap-6">
                             <div className="text-right">
                                 <span className="block text-xs text-gray-400">Total</span>
                                 <span className="font-bold text-primary text-lg">R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             {expandedOrder === order.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                        </div>
                    </div>

                    {expandedOrder === order.id && (
                        <div className="border-t border-gray-100 bg-gray-50/30 p-4">
                           <OrderDetails order={order} />
                           
                           {order.status === 'pending' && (
                                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                                    <button 
                                        onClick={() => onCancelClick(order.id)}
                                        disabled={actionLoading}
                                        className="px-4 py-2 border border-red-200 bg-red-50 text-red-600 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors flex items-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                                        Cancelar Pedido
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserOrdersModal;
