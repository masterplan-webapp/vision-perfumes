import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Shield, Users } from 'lucide-react';
import { AdminUser } from '../../types';
import { getAdmins, addAdmin, removeAdmin } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const AdminTeam: React.FC = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setAdmins(await getAdmins());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    setLoading(true);
    try {
      await addAdmin(newAdminEmail, user?.email || 'System');
      setNewAdminEmail('');
      addToast('Administrador adicionado!', 'success');
      await load();
    } catch (error: any) {
      addToast(error.message || 'Erro ao adicionar admin.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string, email: string) => {
    if (email === user?.email) {
      addToast('Você não pode remover a si mesmo.', 'error');
      return;
    }
    if (!window.confirm(`Remover acesso de ${email}?`)) return;
    setLoading(true);
    try {
      await removeAdmin(id);
      addToast('Administrador removido.', 'success');
      await load();
    } catch {
      addToast('Erro ao remover.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
          <Users size={20} /> Gerenciar Administradores
        </h3>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <input
            type="email"
            placeholder="Email do novo administrador"
            value={newAdminEmail}
            onChange={e => setNewAdminEmail(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-accent-gold text-white px-6 py-3 rounded-lg font-bold hover:bg-[#c49b2d] transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            Adicionar
          </button>
        </form>

        <div className="space-y-2">
          {loading && admins.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto text-accent-gold" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-dashed border border-gray-200">
              Nenhum administrador na lista.
            </div>
          ) : (
            admins.map(admin => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-accent-gold/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{admin.email}</p>
                    <p className="text-xs text-gray-400">
                      Adicionado em:{' '}
                      {admin.addedAt ? new Date(admin.addedAt).toLocaleDateString('pt-BR') : 'N/A'}
                      {admin.addedBy && ` por ${admin.addedBy}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => admin.id && handleRemove(admin.id, admin.email)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg"
                  title="Remover acesso"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTeam;
