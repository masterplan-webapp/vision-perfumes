
import React from 'react';
import { X, ShieldCheck, FileText, RefreshCcw, Truck } from 'lucide-react';

export type LegalType = 'terms' | 'privacy' | 'returns' | 'shipping';

interface LegalModalProps {
  type: LegalType | null;
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const content = {
    terms: {
      title: 'Termos de Uso',
      icon: <FileText size={24} className="text-accent-gold" />,
      text: (
        <div className="space-y-6 text-gray-300 text-sm sm:text-base leading-relaxed">
          <section>
            <h4 className="text-white font-bold mb-3">1. Aceitação dos Termos</h4>
            <p>Ao acessar e utilizar o site da Vision Perfumes, você concorda em cumprir e estar vinculado aos seguintes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">2. Uso do Site</h4>
            <p>Este site é destinado à venda de fragrâncias de luxo e produtos relacionados. É proibido o uso do site para qualquer finalidade ilegal ou não autorizada. Você concorda em não reproduzir, duplicar ou copiar qualquer parte do serviço sem permissão expressa.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">3. Cadastro e Segurança</h4>
            <p>Para realizar compras, você pode precisar criar uma conta. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">4. Preços e Pagamentos</h4>
            <p>A Vision Perfumes se reserva o direito de alterar preços e disponibilidade de produtos sem aviso prévio. Todos os pagamentos são processados de forma segura através de nossos parceiros de pagamento.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">5. Limitação de Responsabilidade</h4>
            <p>A Vision Perfumes não será responsável por quaisquer danos diretos, indiretos ou incidentais resultantes do uso ou da incapacidade de usar os produtos adquiridos através do site.</p>
          </section>
        </div>
      )
    },
    privacy: {
      title: 'Política de Privacidade',
      icon: <ShieldCheck size={24} className="text-accent-gold" />,
      text: (
        <div className="space-y-6 text-gray-300 text-sm sm:text-base leading-relaxed">
          <section>
            <h4 className="text-white font-bold mb-3">1. Coleta de Informações</h4>
            <p>Coletamos informações que você nos fornece diretamente, como nome, e-mail, endereço e detalhes de pagamento ao realizar uma compra ou se cadastrar em nossa newsletter.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">2. Uso dos Dados</h4>
            <p>Seus dados são utilizados para processar pedidos, enviar atualizações sobre sua entrega, melhorar sua experiência no site e, com seu consentimento, enviar comunicações de marketing.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">3. Proteção e Segurança</h4>
            <p>Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados pessoais contra acesso não autorizado, perda ou alteração, em conformidade com a LGPD (Lei Geral de Proteção de Dados).</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">4. Compartilhamento com Terceiros</h4>
            <p>Compartilhamos seus dados apenas com parceiros essenciais para a operação, como empresas de logística (para entrega) e processadores de pagamento. Não vendemos seus dados a terceiros.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">5. Seus Direitos</h4>
            <p>Você tem o direito de acessar, corrigir ou solicitar a exclusão de seus dados pessoais a qualquer momento através de nossa central de atendimento.</p>
          </section>
        </div>
      )
    },
    returns: {
      title: 'Política de Troca e Devolução',
      icon: <RefreshCcw size={24} className="text-accent-gold" />,
      text: (
        <div className="space-y-6 text-gray-300 text-sm sm:text-base leading-relaxed">
          <section>
            <h4 className="text-white font-bold mb-3">1. Direito de Arrependimento</h4>
            <p>Conforme o Código de Defesa do Consumidor, você tem até 7 (sete) dias corridos após o recebimento do produto para solicitar a devolução por arrependimento.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">2. Condições do Produto</h4>
            <p className="text-accent-rose font-bold">IMPORTANTE: Por se tratar de produtos de perfumaria, a troca ou devolução só será aceita se o produto estiver com o lacre original intacto e em sua embalagem original sem sinais de uso.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">3. Produtos com Defeito</h4>
            <p>Caso receba um produto com defeito de fabricação ou avaria no transporte, entre em contato conosco em até 30 dias para providenciarmos a troca sem custos adicionais.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">4. Processo de Reembolso</h4>
            <p>O reembolso será processado através do mesmo método de pagamento utilizado na compra após o recebimento e conferência do produto em nosso centro de distribuição.</p>
          </section>
        </div>
      )
    },
    shipping: {
      title: 'Política de Envio e Entrega',
      icon: <Truck size={24} className="text-accent-gold" />,
      text: (
        <div className="space-y-6 text-gray-300 text-sm sm:text-base leading-relaxed">
          <section>
            <h4 className="text-white font-bold mb-3">1. Prazos de Entrega</h4>
            <p>O prazo de entrega varia de acordo com a região e o método de envio selecionado no checkout. O prazo começa a contar a partir da confirmação do pagamento.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">2. Processamento do Pedido</h4>
            <p>Pedidos confirmados até as 12h em dias úteis são geralmente postados no mesmo dia. Pedidos após esse horário ou em finais de semana serão processados no próximo dia útil.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">3. Rastreamento</h4>
            <p>Após a postagem, você receberá um código de rastreamento por e-mail para acompanhar cada etapa da entrega em tempo real através do nosso site ou do site da transportadora.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">4. Tentativas de Entrega</h4>
            <p>As transportadoras realizam até 3 tentativas de entrega. Certifique-se de que haverá alguém disponível no endereço indicado para receber o pedido.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-3">5. Frete Grátis</h4>
            <p>Oferecemos frete grátis para compras acima de um valor determinado (verificar banner no topo do site). A modalidade de envio para frete grátis é definida pela Vision Perfumes.</p>
          </section>
        </div>
      )
    }
  };

  const activeContent = content[type];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-primary-dark w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl relative border border-white/10 my-auto animate-slide-up">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            {activeContent.icon}
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
              {activeContent.title}
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

        <div className="p-8 sm:p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {activeContent.text}
        </div>

        <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-accent-gold text-primary-dark rounded-xl font-bold hover:bg-white transition-all shadow-lg shadow-accent-gold/20"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
