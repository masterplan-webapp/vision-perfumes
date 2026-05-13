
import React, { useState } from 'react';
import { X, Mail, Phone, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONTACT_EMAIL = "fabiozacari@gmail.com";
const WHATSAPP_NUMBER = "5511910193710";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Olá,%20gostaria%20de%20mais%20informações%20sobre%20os%20perfumes.`;
const FORMSPREE_URL = "https://formspree.io/f/mvzlyjka";

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => {
          setIsSubmitted(false);
          onClose();
        }, 3000);
      } else {
        alert("Houve um erro ao enviar sua mensagem. Por favor, tente novamente.");
      }
    } catch (error) {
      console.error("Form error:", error);
      alert("Houve um erro ao enviar sua mensagem. Verifique sua conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-primary-dark w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative border border-white/10 my-auto animate-slide-up">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <MessageSquare size={24} className="text-accent-gold" />
            <h2 className="font-serif text-2xl font-bold text-white tracking-wide">
              Fale Conosco
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 sm:p-10">
          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 size={64} className="text-green-500 mb-6 animate-bounce" />
              <h3 className="text-2xl font-bold text-white mb-2">Mensagem Enviada!</h3>
              <p className="text-gray-400">Agradecemos o seu contato. Retornaremos em breve no seu e-mail.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Info Column */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-accent-gold font-serif text-lg font-bold mb-4">Canais de Atendimento</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    Estamos aqui para ajudar você a encontrar a fragrância perfeita ou tirar qualquer dúvida sobre seu pedido.
                  </p>
                </div>

                <div className="space-y-4">
                  <a 
                    href={WHATSAPP_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl hover:bg-green-500/20 transition-all group"
                  >
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                      <Phone size={20} />
                    </div>
                    <div>
                      <span className="block text-xs text-green-500 font-bold uppercase tracking-widest">WhatsApp</span>
                      <span className="text-white font-medium">(11) 91019-3710</span>
                    </div>
                  </a>

                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-1 opacity-60">Atendimento</p>
                    <p className="text-white text-xs leading-relaxed">
                      Segunda a Sexta: 09h às 18h<br/>
                      Sábado: 09h às 13h
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Column */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-gold transition-all"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">E-mail</label>
                  <input 
                    required
                    type="email" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-gold transition-all"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Mensagem</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-gold transition-all resize-none"
                    placeholder="Como podemos ajudar?"
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-accent-gold text-primary-dark font-bold py-4 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xl shadow-accent-gold/20"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-primary-dark border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={18} />
                      Enviar Mensagem
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
