import React from 'react';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-white pt-16 pb-8 mt-20 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-gold to-accent-rose rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl">
                VP
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight">Vision Perfumes</span>
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
              {['Sobre Nós', 'Catálogo', 'Ofertas', 'Blog', 'Contato'].map(link => (
                <li key={link}><a href="#" className="hover:text-accent-gold transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>

          {/* Service */}
          <div>
            <h4 className="font-serif text-lg font-bold text-accent-gold mb-6">Atendimento</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              {['Central de Ajuda', 'Política de Trocas', 'Frete e Entrega', 'Formas de Pagamento', 'Rastreamento'].map(link => (
                <li key={link}><a href="#" className="hover:text-accent-gold transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-serif text-lg font-bold text-accent-gold mb-6">Newsletter</h4>
            <p className="text-gray-400 text-sm mb-4">Receba ofertas exclusivas e novidades em primeira mão.</p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="Seu e-mail" 
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:border-accent-gold transition-colors"
              />
              <button type="button" className="bg-accent-gold text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#c49b2d] transition-colors">
                Assinar
              </button>
            </form>
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
