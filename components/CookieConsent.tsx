
import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('vision-perfumes-cookie-consent');
    if (!consent) {
      // Small delay to make it feel more organic
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('vision-perfumes-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] p-4 sm:p-6 animate-slide-up">
      <div className="max-w-6xl mx-auto">
        <div className="bg-primary-dark border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md bg-opacity-95">
          <div className="flex items-center gap-4 text-left">
            <div className="bg-accent-gold/10 p-3 rounded-full hidden sm:block">
              <ShieldCheck className="text-accent-gold" size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-white font-bold text-sm sm:text-base">Sua privacidade é nossa prioridade</h4>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
                Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência, personalizar publicidade e analisar o tráfego do site. Ao clicar em "Aceitar", você concorda com o uso de todas as ferramentas. Confira nossa <a href="#" className="text-accent-gold hover:underline">Política de Privacidade</a>.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => setIsVisible(false)}
              className="flex-1 md:flex-none px-6 py-3 text-sm font-bold text-white/60 hover:text-white transition-colors"
            >
              Configurar
            </button>
            <button 
              onClick={handleAccept}
              className="flex-1 md:flex-none px-8 py-3 bg-accent-gold text-primary-dark rounded-xl font-bold text-sm hover:bg-white transition-all shadow-lg shadow-accent-gold/20 whitespace-nowrap"
            >
              Aceitar Tudo
            </button>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-2 text-white/30 hover:text-white transition-colors hidden sm:block"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
