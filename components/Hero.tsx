
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SiteSettings } from '../types';

interface HeroProps {
  onCtaClick: () => void;
  settings?: SiteSettings;
}

const Hero: React.FC<HeroProps> = ({ onCtaClick, settings }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = settings?.slides && settings.slides.length > 0 
    ? settings.slides 
    : [{
        id: 'default',
        title: "A Essência da Elegância",
        subtitle: "Descubra fragrâncias exclusivas das marcas mais prestigiadas do mundo.",
        buttonText: "Explorar Catálogo",
        image: "https://images.unsplash.com/photo-1585120040315-2241b774ad0f?q=80&w=2070&auto=format&fit=crop"
      }];

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000); // 6 seconds per slide

    return () => clearInterval(interval);
  }, [slides.length]);

  // Verificação de segurança: se os slides mudarem (ex: remoção) e o índice atual for inválido, resetar
  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative bg-primary overflow-hidden min-h-[600px] flex items-center group">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div 
          key={slide.id || index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${slide.image}')` }}
          >
             {/* Opacidade reduzida de 20% para 10% */}
             <div className="absolute inset-0 bg-black/10"></div>
          </div>
          
          {/* Gradient Overlay - Opacidade reduzida para tornar a imagem mais visível */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent"></div>

          {/* Content */}
          <div className="container mx-auto px-4 h-full flex items-center relative z-20">
            <div className="max-w-3xl py-24 text-center md:text-left">
              <h1 className={`font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-accent-gold mb-6 leading-tight drop-shadow-xl transform transition-all duration-700 delay-100 ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                 {slide.title}
              </h1>
              <p className={`text-gray-100 text-lg md:text-2xl mb-10 leading-relaxed font-medium drop-shadow-md max-w-2xl transform transition-all duration-700 delay-200 ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                {slide.subtitle}
              </p>
              <div className={`flex flex-col sm:flex-row gap-4 justify-center md:justify-start transform transition-all duration-700 delay-300 ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <button 
                  onClick={onCtaClick}
                  className="px-8 py-4 bg-accent-gold text-white rounded-full font-bold uppercase tracking-wide hover:bg-[#c49b2d] transform hover:-translate-y-1 transition-all shadow-lg hover:shadow-accent-gold/40 border border-transparent"
                >
                  {slide.buttonText}
                </button>
                <button className="px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white text-white rounded-full font-bold uppercase tracking-wide hover:bg-white hover:text-primary transform hover:-translate-y-1 transition-all shadow-lg">
                  Ver Ofertas
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Controls (Only if multiple slides) */}
      {slides.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-accent-gold transition-colors opacity-0 group-hover:opacity-100 duration-300"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-accent-gold transition-colors opacity-0 group-hover:opacity-100 duration-300"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-accent-gold w-8' : 'bg-white/50 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default Hero;
    