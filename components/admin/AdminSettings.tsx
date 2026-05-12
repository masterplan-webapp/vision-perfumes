import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Upload, Loader2, Sliders, CreditCard, Truck, Image as ImageIcon, Server } from 'lucide-react';
import { SiteSettings, HeroSlide } from '../../types';
import { getSiteSettings, updateSiteSettings } from '../../services/settingsService';
import { uploadImage } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

interface AdminSettingsProps {
  onProductUpdate: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onProductUpdate }) => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    getSiteSettings().then(data => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setLoading(true);
    try {
      await updateSiteSettings(settings);
      await onProductUpdate();
      addToast('Configurações atualizadas!', 'success');
    } catch {
      addToast('Erro ao salvar configurações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlide = () => {
    if (!settings) return;
    const newSlide: HeroSlide = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Novo Título',
      subtitle: 'Nova Sublegenda',
      buttonText: 'Botão',
      image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=2070&auto=format&fit=crop',
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
    } catch {
      addToast('Erro ao fazer upload.', 'error');
    } finally {
      setUploadingSlideIndex(null);
    }
  };

  if (loading && !settings) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="animate-spin text-accent-gold" size={32} />
      </div>
    );
  }
  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <form onSubmit={handleSave} className="space-y-8">
        {/* General */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
            <Sliders size={20} /> Configurações Gerais
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto Promocional (Topo)</label>
            <input
              type="text"
              value={settings.topBarText}
              onChange={e => setSettings({ ...settings, topBarText: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
            />
          </div>
        </div>

        {/* Payment */}
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
                onChange={e => setSettings({ ...settings, pagarmePublicKey: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Utilizada para criptografar os dados do cartão no frontend.</p>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL do Backend (Cloud Functions)</label>
              <div className="flex items-center gap-2">
                <Server size={16} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="https://us-central1-..."
                  value={settings.apiBaseUrl || ''}
                  onChange={e => setSettings({ ...settings, apiBaseUrl: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Deixe em branco para usar o <strong>Modo Simulação</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Logistics */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
            <Truck size={20} /> Logística (Melhor Envio)
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP de Origem (Estoque)</label>
                <input
                  type="text"
                  placeholder="00000-000"
                  value={settings.originZip || ''}
                  onChange={e => setSettings({ ...settings, originZip: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Ponto de partida para cálculo de frete.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token de Acesso Melhor Envio</label>
                <input
                  type="text"
                  placeholder="Cole o Bearer Token aqui"
                  value={settings.melhorEnvioToken || ''}
                  onChange={e => setSettings({ ...settings, melhorEnvioToken: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none font-mono text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">OAuth2 Bearer Token gerado no painel do Melhor Envio.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-4">
              <input
                type="checkbox"
                id="sandbox-mode"
                checked={settings.melhorEnvioSandbox ?? true}
                onChange={e => setSettings({ ...settings, melhorEnvioSandbox: e.target.checked })}
                className="w-5 h-5 accent-accent-gold rounded cursor-pointer"
              />
              <label htmlFor="sandbox-mode" className="text-sm font-medium text-gray-700 cursor-pointer">
                Usar Ambiente de Testes (Sandbox)
              </label>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mínimo para Frete Grátis (R$)</label>
              <input
                type="number"
                placeholder="Ex: 300.00"
                value={settings.freeShippingThreshold || ''}
                onChange={e => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">O frete mais barato será gratuito se o total ultrapassar este valor.</p>
            </div>
          </div>
        </div>

        {/* Hero Slides */}
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
                      onChange={e => handleSlideChange(index, 'title', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subtítulo</label>
                    <textarea
                      value={slide.subtitle}
                      onChange={e => handleSlideChange(index, 'subtitle', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none h-20 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto do Botão</label>
                    <input
                      type="text"
                      value={slide.buttonText}
                      onChange={e => handleSlideChange(index, 'buttonText', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link do Botão (CTA)</label>
                    <input
                      type="text"
                      placeholder="ex: #products"
                      value={slide.ctaLink || ''}
                      onChange={e => handleSlideChange(index, 'ctaLink', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Imagem de Fundo</label>
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3 border-2 border-transparent group-hover:border-accent-gold transition-colors">
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
                      onChange={e => handleSlideChange(index, 'image', e.target.value)}
                      placeholder="URL da Imagem"
                      className="flex-1 p-2 text-xs border border-gray-300 rounded focus:border-accent-gold outline-none"
                    />
                    <label className="cursor-pointer bg-primary text-white px-3 py-2 rounded text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-1">
                      <Upload size={14} /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleSlideImageUpload(index, e)}
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
            disabled={loading}
            className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-600/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
