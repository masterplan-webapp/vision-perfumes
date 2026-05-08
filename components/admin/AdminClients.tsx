import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Users, Download, Package, MapPin, Phone, Mail } from 'lucide-react';
import { UserProfile, Order } from '../../types';
import { getAllUsers } from '../../services/userService';
import { exportClientsCSV } from '../../services/exportService';
import { useToast } from '../../context/ToastContext';
import { getUserOrders } from '../../services/orderService';

const AdminClients: React.FC = () => {
  const { addToast } = useToast();
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      setClients(await getAllUsers());
    } catch {
      addToast('Erro ao carregar clientes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openClient = async (client: UserProfile) => {
    setSelectedClient(client);
    setClientOrders([]);
    setLoadingOrders(true);
    try {
      const orders = await getUserOrders(client.uid);
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setClientOrders(orders);
    } catch {
      addToast('Erro ao carregar pedidos do cliente.', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      (c.displayName || '').toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const STATUS_COLORS: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    processing: 'text-blue-600 bg-blue-50',
    shipped: 'text-indigo-600 bg-indigo-50',
    delivered: 'text-green-600 bg-green-50',
    cancelled: 'text-red-600 bg-red-50',
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    processing: 'Processando',
    shipped: 'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
          />
        </div>
        <button
          onClick={() => exportClientsCSV(filtered)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex justify-center">
          <Loader2 className="animate-spin text-accent-gold" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          {clients.length === 0 ? 'Nenhum cliente cadastrado.' : 'Nenhum resultado para a busca.'}
        </div>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4">Cidade / Estado</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(client => (
                  <tr key={client.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {(client.displayName || client.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{client.displayName || '—'}</p>
                          <p className="text-xs text-gray-400">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{client.phone || '—'}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {client.defaultAddress
                        ? `${client.defaultAddress.city} / ${client.defaultAddress.state}`
                        : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openClient(client)}
                        className="text-xs font-bold text-accent-gold hover:underline"
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-3">
            {filtered.map(client => (
              <div
                key={client.uid}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm"
                onClick={() => openClient(client)}
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  {(client.displayName || client.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{client.displayName || '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{client.email}</p>
                  {client.defaultAddress && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {client.defaultAddress.city} / {client.defaultAddress.state}
                    </p>
                  )}
                </div>
                <span className="text-accent-gold shrink-0">›</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {(selectedClient.displayName || selectedClient.email)[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-primary">
                    {selectedClient.displayName || 'Cliente'}
                  </h2>
                  <p className="text-sm text-gray-400">{selectedClient.uid}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail size={16} className="text-gray-400 shrink-0" />
                  <span className="truncate">{selectedClient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone size={16} className="text-gray-400 shrink-0" />
                  <span>{selectedClient.phone || '—'}</span>
                </div>
                {selectedClient.defaultAddress && (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                    <span>
                      {selectedClient.defaultAddress.street}, {selectedClient.defaultAddress.number},{' '}
                      {selectedClient.defaultAddress.city} – {selectedClient.defaultAddress.state}
                    </span>
                  </div>
                )}
              </div>

              {/* Orders */}
              <div>
                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Package size={18} /> Pedidos do Cliente
                </h3>
                {loadingOrders ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="animate-spin text-accent-gold" />
                  </div>
                ) : clientOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border-dashed border border-gray-200">
                    Nenhum pedido encontrado.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientOrders.map(order => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="text-xs font-mono text-gray-500">#{order.id.slice(0, 8)}</p>
                          <p className="text-sm font-bold text-gray-800">
                            R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')} · {order.items.length} item(s)
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || 'text-gray-600 bg-gray-100'}`}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClients;
