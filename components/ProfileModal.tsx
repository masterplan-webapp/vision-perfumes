
import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Save, Loader2, Phone, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { UserProfile, Address } from '../types';
import { useToast } from '../context/ToastContext';
import { updatePassword } from 'firebase/auth';
import { auth } from '../services/firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'address' | 'security'>('personal');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form States
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<Address>({
    zip: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  // Security State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadProfile();
      // Reset states
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('personal');
    }
  }, [isOpen, user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getUserProfile(user.uid);
    if (data) {
      setProfile(data);
      setDisplayName(data.displayName || user.displayName || '');
      setPhone(data.phone || '');
      if (data.defaultAddress) {
        setAddress(data.defaultAddress);
      }
    } else {
        setDisplayName(user.displayName || '');
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      if (activeTab === 'security') {
        // Password Change Logic
        if (!newPassword) {
            addToast('Digite a nova senha.', 'error');
            setSaving(false);
            return;
        }
        if (newPassword.length < 6) {
            addToast('A senha deve ter pelo menos 6 caracteres.', 'error');
            setSaving(false);
            return;
        }
        if (newPassword !== confirmPassword) {
            addToast('As senhas não conferem.', 'error');
            setSaving(false);
            return;
        }

        try {
            await updatePassword(user, newPassword);
            addToast('Senha alterada com sucesso!', 'success');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                addToast('Por segurança, faça login novamente antes de alterar a senha.', 'error');
                // Optional: automatically sign out to force login
                // auth.signOut(); onClose();
            } else {
                addToast('Erro ao alterar senha: ' + error.message, 'error');
            }
        }

      } else {
        // Profile Update Logic
        const updates: Partial<UserProfile> = {
            email: user.email || '',
            displayName,
            phone,
            defaultAddress: address
        };

        await updateUserProfile(user.uid, updates);
        addToast('Perfil atualizado com sucesso!', 'success');
        // If needed, update Firebase Auth profile too
        // await updateProfile(user, { displayName });
      }
      
      if (activeTab !== 'security') {
          onClose();
      }
    } catch (error) {
      addToast('Erro ao atualizar perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    if (val.length > 5) val = val.replace(/^(\d{5})(\d)/, '$1-$2');
    setAddress({...address, zip: val});
  };

  const fetchAddress = async () => {
    const cleanCep = address.zip.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="font-serif text-2xl font-bold text-primary">Minha Conta</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('personal')}
            className={`flex-1 min-w-[120px] py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'personal' ? 'border-accent-gold text-accent-gold bg-white' : 'border-transparent text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
          >
            Dados Pessoais
          </button>
          <button 
            onClick={() => setActiveTab('address')}
            className={`flex-1 min-w-[120px] py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'address' ? 'border-accent-gold text-accent-gold bg-white' : 'border-transparent text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
          >
            Endereço Padrão
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex-1 min-w-[120px] py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'security' ? 'border-accent-gold text-accent-gold bg-white' : 'border-transparent text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
          >
            Segurança
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent-gold" size={32} /></div>
          ) : (
            <form id="profile-form" onSubmit={handleSave} className="space-y-6">
              
              {activeTab === 'personal' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-2 border border-gray-200">
                      <User size={40} />
                    </div>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        value={displayName} 
                        onChange={e => setDisplayName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone / Celular</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="tel" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'address' && (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-sm text-gray-500 mb-4 bg-blue-50 p-3 rounded border border-blue-100">
                    Este endereço será preenchido automaticamente no checkout para agilizar suas compras.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CEP</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={address.zip} 
                                onChange={handleZipChange}
                                onBlur={fetchAddress}
                                placeholder="00000-000"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                            />
                            <button type="button" onClick={fetchAddress} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-accent-gold hover:bg-gray-50 rounded">
                                <MapPin size={18} />
                            </button>
                        </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Endereço</label>
                    <input type="text" placeholder="Rua, Av..." value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Número</label>
                        <input type="text" value={address.number} onChange={e => setAddress({...address, number: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Complemento</label>
                        <input type="text" value={address.complement} onChange={e => setAddress({...address, complement: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bairro</label>
                    <input type="text" value={address.neighborhood} onChange={e => setAddress({...address, neighborhood: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cidade</label>
                        <input type="text" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label>
                        <input type="text" value={address.state} onChange={e => setAddress({...address, state: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none bg-gray-50" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                  <div className="space-y-6 animate-fade-in">
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 flex items-start gap-3">
                          <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={18} />
                          <p className="text-sm text-yellow-800">
                              Para sua segurança, se você fez login há muito tempo, pode ser necessário entrar novamente antes de alterar sua senha.
                          </p>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nova Senha</label>
                              <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                  <input 
                                      type="password" 
                                      value={newPassword} 
                                      onChange={e => setNewPassword(e.target.value)}
                                      placeholder="Mínimo de 6 caracteres"
                                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar Nova Senha</label>
                              <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                  <input 
                                      type="password" 
                                      value={confirmPassword} 
                                      onChange={e => setConfirmPassword(e.target.value)}
                                      placeholder="Digite a senha novamente"
                                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                                  />
                              </div>
                          </div>
                      </div>
                  </div>
              )}
            </form>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button 
            onClick={handleSave} // Trigger external form submit
            disabled={loading || saving}
            className={`w-full text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg ${activeTab === 'security' ? 'bg-gray-800 hover:bg-black' : 'bg-primary hover:bg-accent-gold'}`}
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {activeTab === 'security' ? 'Alterar Senha' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
