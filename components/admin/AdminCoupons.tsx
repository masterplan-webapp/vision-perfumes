import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Tag, RefreshCw } from 'lucide-react';
import { Coupon } from '../../types';
import { getCoupons, createCoupon, deleteCoupon } from '../../services/couponService';
import { useToast } from '../../context/ToastContext';

const AdminCoupons: React.FC = () => {
  const { addToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: '',
    type: 'percent',
    value: 0,
    isActive: true,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      setCoupons(await getCoupons());
    } catch {
      console.error('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.value) return;
    setLoading(true);
    try {
      await createCoupon({
        code: newCoupon.code.toUpperCase(),
        type: newCoupon.type || 'percent',
        value: Number(newCoupon.value),
        isActive: true,
        minPurchase: newCoupon.minPurchase ? Number(newCoupon.minPurchase) : undefined,
        usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : undefined,
        expirationDate: newCoupon.expirationDate,
      });
      addToast('Cupom criado com sucesso!', 'success');
      setNewCoupon({ code: '', type: 'percent', value: 0, isActive: true });
      await load();
    } catch (error: any) {
      addToast(error.message || 'Erro ao criar cupom.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este cupom?')) return;
    setLoading(true);
    try {
      await deleteCoupon(id);
      addToast('Cupom excluído.', 'success');
      await load();
    } catch {
      addToast('Erro ao excluir cupom.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
            <Tag size={20} /> Criar Novo Cupom
          </h3>
          <button
            onClick={load}
            className="text-gray-400 hover:text-accent-gold p-2 rounded transition-colors"
            title="Atualizar Lista"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código</label>
            <input
              type="text"
              placeholder="EX: VERAO10"
              value={newCoupon.code}
              onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none uppercase font-bold"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
            <select
              value={newCoupon.type}
              onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value as any })}
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
              placeholder={newCoupon.type === 'percent' ? 'Ex: 10' : 'Ex: 50.00'}
              value={newCoupon.value || ''}
              onChange={e => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) })}
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
              onChange={e => setNewCoupon({ ...newCoupon, minPurchase: parseFloat(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Validade (Opcional)</label>
            <input
              type="date"
              value={newCoupon.expirationDate || ''}
              onChange={e => setNewCoupon({ ...newCoupon, expirationDate: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-gold text-white px-4 py-2 rounded-lg font-bold hover:bg-[#c49b2d] transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              Criar Cupom
            </button>
          </div>
        </form>

        <div className="mt-8 space-y-3">
          <h4 className="font-bold text-sm text-gray-600 uppercase tracking-wider mb-4">Cupons Ativos</h4>
          {loading && coupons.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto text-accent-gold" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-dashed border border-gray-200">
              Nenhum cupom criado.
            </div>
          ) : (
            <div className="grid gap-4">
              {coupons.map(coupon => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
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
                        {coupon.expirationDate && (
                          <span>Expira: {new Date(coupon.expirationDate).toLocaleDateString('pt-BR')}</span>
                        )}
                        <span>Usos: {coupon.usageCount}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => coupon.id && handleDelete(coupon.id)}
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
  );
};

export default AdminCoupons;
