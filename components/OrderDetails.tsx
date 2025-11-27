



import React from 'react';
import { Package, MapPin, Truck, Calendar, CreditCard, User } from 'lucide-react';
import { Order } from '../types';

interface OrderDetailsProps {
  order: Order;
  isAdmin?: boolean;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, isAdmin = false }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
        'pending': 'Pendente',
        'processing': 'Processando',
        'shipped': 'Enviado',
        'delivered': 'Entregue',
        'cancelled': 'Cancelado'
    };
    return map[status] || status;
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
      {/* Header Info */}
      <div className="bg-gray-50 p-4 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Pedido #{order.id.slice(0, 8)}</span>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar size={14} />
            {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
          {getStatusText(order.status)}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Items */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <Package size={14} /> Itens do Pedido
          </h4>
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary line-clamp-1">
                      {item.name}
                      {item.selectedVariation && (
                          <span className="ml-1 text-xs text-gray-500">({item.selectedVariation.size})</span>
                      )}
                  </p>
                  <p className="text-xs text-gray-500">{item.brand}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{item.quantity}x</p>
                  <p className="text-sm font-bold text-primary">R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">Total do Pedido</span>
            <span className="text-xl font-bold text-primary">R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Shipping & Customer Info */}
        <div className="space-y-6">
          {isAdmin && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                <User size={14} /> Cliente
              </h4>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
                <p className="font-bold text-gray-800">{order.customerName}</p>
                <p className="text-gray-500">{order.customerEmail}</p>
                <p className="text-xs text-gray-400 font-mono mt-1">ID: {order.userId}</p>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
              <MapPin size={14} /> Endereço de Entrega
            </h4>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm text-gray-700">
              <p className="font-bold mb-1">{order.shippingAddress.street}, {order.shippingAddress.number}</p>
              {order.shippingAddress.complement && <p className="mb-1 text-gray-500">{order.shippingAddress.complement}</p>}
              <p>{order.shippingAddress.neighborhood}</p>
              <p>{order.shippingAddress.city} - {order.shippingAddress.state}</p>
              <p className="mt-1 font-mono text-xs text-gray-400">{order.shippingAddress.zip}</p>
            </div>
          </div>

          {order.trackingCode && (
            <div className="bg-purple-50 p-4 border border-purple-100 rounded-lg flex flex-col gap-2">
              <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
                <Truck size={16} /> Rastreamento
              </div>
              <p className="font-mono text-sm text-purple-700 bg-white/50 p-2 rounded border border-purple-100">
                {order.trackingCode}
              </p>
              <a 
                href={`https://melhorrastreio.com.br/rastreio/${order.trackingCode}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:text-purple-800 underline mt-1"
              >
                Acompanhar Entrega
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
