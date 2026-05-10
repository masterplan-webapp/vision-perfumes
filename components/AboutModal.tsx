import React from 'react';
import { X, Award, ShieldCheck, History, Heart, CheckCircle2 } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-primary-dark w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl relative border border-white/10 my-auto">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-white/50 hover:text-white z-10 p-2 bg-white/5 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Hero Image / Left Side */}
          <div className="lg:w-2/5 relative h-64 lg:h-auto">
            <img 
              src="https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800" 
              alt="Heritage Perfumes" 
              className="w-full h-full object-cover grayscale opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-primary-dark via-primary-dark/40 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-[2px] bg-accent-gold" />
                    <span className="text-accent-gold font-bold uppercase tracking-widest text-xs">Desde 2004</span>
                </div>
                <h2 className="font-serif text-4xl font-bold text-white leading-tight">
                    Duas Décadas <br /> de Excelência
                </h2>
            </div>
          </div>

          {/* Content / Right Side */}
          <div className="lg:w-3/5 p-8 lg:p-16">
            <div className="space-y-8">
              <section>
                <h3 className="font-serif text-2xl text-accent-gold mb-6">Nossa História</h3>
                <p className="text-gray-300 leading-relaxed text-lg">
                  A <strong>Vision Perfumes</strong> nasceu de uma paixão profunda pela arte da perfumaria. Com mais de 20 anos de experiência no mercado de fragrâncias importadas, consolidamos nossa posição como referência em sofisticação e curadoria de luxo.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4 text-lg">
                  Nossa jornada começou com o compromisso de trazer para o Brasil não apenas fragrâncias, mas experiências sensoriais únicas, conectando nossos clientes com as casas de perfumaria mais prestigiadas do mundo.
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y border-white/5">
                <div className="flex gap-4">
                  <div className="bg-accent-gold/10 p-3 rounded-xl shrink-0 h-fit">
                    <ShieldCheck className="text-accent-gold" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">100% Originalidade</h4>
                    <p className="text-gray-400 text-sm">Trabalhamos exclusivamente com produtos originais e procedência garantida.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-accent-gold/10 p-3 rounded-xl shrink-0 h-fit">
                    <Award className="text-accent-gold" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Curadoria de Luxo</h4>
                    <p className="text-gray-400 text-sm">Seleção criteriosa das melhores fragrâncias árabes e designers internacionais.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-accent-gold/10 p-3 rounded-xl shrink-0 h-fit">
                    <History className="text-accent-gold" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">20 Anos de Mercado</h4>
                    <p className="text-gray-400 text-sm">Tradição e confiança construídas ao longo de duas décadas de atendimento premium.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-accent-gold/10 p-3 rounded-xl shrink-0 h-fit">
                    <Heart className="text-accent-gold" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Atendimento V.I.P</h4>
                    <p className="text-gray-400 text-sm">Consultoria personalizada para ajudar você a encontrar sua assinatura olfativa.</p>
                  </div>
                </div>
              </div>

              <section className="bg-white/5 p-8 rounded-2xl border border-accent-gold/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CheckCircle2 size={120} className="text-accent-gold" />
                </div>
                <h4 className="text-accent-gold font-bold uppercase tracking-widest text-sm mb-4">Compromisso Vision</h4>
                <p className="text-white text-xl font-serif italic leading-relaxed relative z-10">
                  "Nossa missão é democratizar o acesso ao luxo internacional, garantindo que cada cliente receba não apenas um frasco, mas a garantia de autenticidade e o respeito que uma trajetória de 20 anos exige."
                </p>
                <div className="mt-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-gold flex items-center justify-center font-bold text-primary-dark">V</div>
                    <div>
                        <p className="text-white font-bold text-sm">Diretoria Vision Perfumes</p>
                        <p className="text-accent-gold text-xs uppercase tracking-tighter">Excelência em Perfumaria</p>
                    </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
