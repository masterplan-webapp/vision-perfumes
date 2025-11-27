
import React, { useState } from 'react';
import { X, Sparkles, Send } from 'lucide-react';
import { getPerfumeRecommendation } from '../services/geminiService';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse('');
    
    const result = await getPerfumeRecommendation(query);
    
    setResponse(result);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                <Sparkles size={24} />
            </div>
            <div>
                <h3 className="font-bold text-xl">Vision Consultor Virtual</h3>
                <p className="text-white/80 text-xs">Seu consultor de fragrâncias pessoal</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
           {!response && !isLoading && (
               <div className="text-center text-gray-500 py-8">
                   <p className="mb-4">Olá! Estou aqui para ajudar você a encontrar o perfume perfeito.</p>
                   <p className="text-sm">Experimente perguntar:</p>
                   <ul className="text-sm italic mt-2 space-y-2">
                       <li>"Quero um perfume marcante para um encontro à noite."</li>
                       <li>"Preciso de um presente suave para minha mãe."</li>
                       <li>"Busco algo fresco para usar no trabalho no verão."</li>
                   </ul>
               </div>
           )}

           {isLoading && (
               <div className="flex flex-col items-center justify-center py-10">
                   <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                   <p className="text-purple-600 font-medium animate-pulse">Consultando especialistas...</p>
               </div>
           )}

           {response && (
               <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 prose prose-sm max-w-none text-gray-700">
                   <div className="whitespace-pre-line">{response}</div>
               </div>
           )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={handleSubmit} className="relative">
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Qual é a ocasião ou preferência?"
                    className="w-full py-3 pl-4 pr-12 bg-gray-100 border-transparent focus:bg-white border focus:border-purple-500 rounded-xl focus:ring-0 transition-all"
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    disabled={!query.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AiAdvisorModal;
