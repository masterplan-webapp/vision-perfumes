import React, { useState } from 'react';
import { Facebook, Instagram, Twitter, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { subscribeToNewsletter } from '../services/newsletterService';
import { useToast } from '../context/ToastContext';

interface FooterProps {
  onAboutClick?: () => void;
  onContactClick?: () => void;
  onLegalClick?: (type: any) => void;
}

const Footer: React.FC<FooterProps> = ({ onAboutClick, onContactClick, onLegalClick }) => {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    try {
      const result = await subscribeToNewsletter(email);
      addToast(result.message, 'success');
      setIsSubscribed(true);
      setEmail('');
    } catch (error) {
      addToast('Erro ao assinar newsletter.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="bg-primary text-white pt-16 pb-8 mt-20 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img 
                src="/favicon.png" 
                alt="Vision Perfumes Icon" 
                className="h-12 w-auto object-contain brightness-110"
              />
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-medium text-accent-gold tracking-[0.2em] uppercase leading-none">
                  Vision
                </span>
                <span className="font-serif text-[8px] font-light text-white/60 tracking-[0.5em] uppercase mt-1">
                  Perfumes Importados
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Sua loja de perfumes importados premium. Fragrâncias exclusivas das melhores marcas do mundo, selecionadas para você.
            </p>
            <div className="flex gap-4">
              {[Facebook, Instagram, Twitter, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-accent-gold hover:text-white transition-all">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-serif text-lg font-bold text-accent-gold mb-6">Links Rápidos</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <button 
                  onClick={(e) => { e.preventDefault(); onAboutClick?.(); }}
                  className="hover:text-accent-gold transition-colors text-left"
                >
                  Sobre Nós
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => { e.preventDefault(); onLegalClick?.('privacy'); }}
                  className="hover:text-accent-gold transition-colors text-left"
                >
                  Privacidade
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => { e.preventDefault(); onLegalClick?.('terms'); }}
                  className="hover:text-accent-gold transition-colors text-left"
                >
                  Termos de Uso
                </button>
              </li>
              {['Catálogo', 'Ofertas'].map(link => (
                <li key={link}><a href="#" className="hover:text-accent-gold transition-colors">{link}</a></li>
              ))}
              <li>
                <button 
                  onClick={(e) => { e.preventDefault(); onContactClick?.(); }}
                  className="hover:text-accent-gold transition-colors text-left"
                >
                  Contato
                </button>
              </li>
            </ul>
          </div>

          {/* Service */}
          <div>
            <h4 className="font-serif text-lg font-bold text-accent-gold mb-6">Atendimento</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <button 
                  onClick={(e) => { e.preventDefault(); onLegalClick?.('returns'); }}
                  className="hover:text-accent-gold transition-colors text-left"
                >
                  Trocas e Devoluções
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => { e.preventDefault(); onLegalClick?.('shipping'); }}
                  className="hover:text-accent-gold transition-colors text-left"
                >
                  Frete e Entrega
                </button>
              </li>

            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-serif text-lg font-bold text-accent-gold mb-6">Newsletter</h4>
            <p className="text-gray-400 text-sm mb-4">Receba ofertas exclusivas e novidades em primeira mão.</p>
            
            {isSubscribed ? (
              <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-3 rounded-lg border border-green-500/20 animate-fade-in">
                <CheckCircle2 size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Inscrito com sucesso!</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input 
                  type="email" 
                  required
                  placeholder="Seu e-mail" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:border-accent-gold transition-colors"
                />
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-accent-gold text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#c49b2d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[100px] flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Assinar"}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-xs text-gray-500">
          <p>&copy; 2025 Vision Perfumes. Todos os direitos reservados. | Desenvolvido com React & Tailwind</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
