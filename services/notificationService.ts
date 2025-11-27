
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Order, CartItem } from "../types";

const MAIL_COLLECTION = "mail";

// Templates de Email HTML simples
const getStyles = () => `
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #333;
  line-height: 1.6;
`;

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const sendOrderConfirmationEmail = async (order: Order) => {
  const itemsList = order.items.map(item => `
    <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
      <strong>${item.name}</strong> ${item.selectedVariation ? `(${item.selectedVariation.size})` : ''}<br/>
      Qtd: ${item.quantity} x ${formatCurrency(item.price)}
    </div>
  `).join('');

  const html = `
    <div style="${getStyles()}">
      <h2 style="color: #d4af37;">Obrigado pelo seu pedido, ${order.customerName}!</h2>
      <p>Recebemos seu pedido <strong>#${order.id.slice(0, 8)}</strong> e ele já está sendo processado.</p>
      
      <h3>Resumo do Pedido</h3>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
        ${itemsList}
        <div style="margin-top: 15px; text-align: right;">
          <strong>Total: ${formatCurrency(order.total)}</strong>
        </div>
      </div>

      <p>Você será notificado assim que o pacote for enviado.</p>
      <hr/>
      <small>Vision Perfumes</small>
    </div>
  `;

  await addDoc(collection(db, MAIL_COLLECTION), {
    to: [order.customerEmail],
    message: {
      subject: `Pedido Confirmado #${order.id.slice(0, 8)} - Vision Perfumes`,
      html: html,
    }
  });
};

export const sendAdminNewOrderEmail = async (order: Order) => {
  // Em um cenário real, o email do admin viria das configurações
  // Como fallback, usaremos um email fixo ou o do próprio usuário logado se for admin
  const adminEmail = "admin@visionperfumes.com"; 

  const html = `
    <div style="${getStyles()}">
      <h2 style="color: #333;">💰 Novo Pedido Recebido!</h2>
      <p>O cliente <strong>${order.customerName}</strong> acabou de realizar uma compra.</p>
      
      <ul>
        <li><strong>ID:</strong> #${order.id}</li>
        <li><strong>Valor:</strong> ${formatCurrency(order.total)}</li>
        <li><strong>Pagamento:</strong> Cartão de Crédito (Stripe)</li>
      </ul>

      <p>Acesse o Painel Administrativo para processar o envio.</p>
    </div>
  `;

  await addDoc(collection(db, MAIL_COLLECTION), {
    to: [adminEmail],
    message: {
      subject: `[Admin] Nova Venda: ${formatCurrency(order.total)}`,
      html: html,
    }
  });
};

export const sendOrderStatusEmail = async (order: Order, newStatus: string, trackingCode?: string) => {
  let subject = `Atualização do Pedido #${order.id.slice(0, 8)}`;
  let messageBody = "";

  switch (newStatus) {
    case 'processing':
      messageBody = "Seu pedido está sendo separado em nosso estoque e preparado para envio.";
      break;
    case 'shipped':
      subject = `Seu pedido #${order.id.slice(0, 8)} está a caminho! 🚚`;
      messageBody = `Boas notícias! Seu pedido foi enviado.`;
      if (trackingCode) {
        messageBody += `<br/><br/><strong>Código de Rastreio:</strong> ${trackingCode}<br/>
        <a href="https://melhorrastreio.com.br/rastreio/${trackingCode}">Clique aqui para acompanhar</a>`;
      }
      break;
    case 'delivered':
      subject = `Pedido Entregue - Vision Perfumes`;
      messageBody = "Seu pedido foi entregue! Esperamos que ame suas novas fragrâncias.";
      break;
    case 'cancelled':
      subject = `Cancelamento do Pedido #${order.id.slice(0, 8)}`;
      messageBody = "Seu pedido foi cancelado. Caso tenha dúvidas, entre em contato com nosso suporte.";
      break;
    default:
      return; // Não enviar email para outros status
  }

  const html = `
    <div style="${getStyles()}">
      <h2 style="color: #d4af37;">Olá, ${order.customerName}</h2>
      <p>${messageBody}</p>
      <br/>
      <p>Atenciosamente,<br/>Equipe Vision Perfumes</p>
    </div>
  `;

  await addDoc(collection(db, MAIL_COLLECTION), {
    to: [order.customerEmail],
    message: {
      subject: subject,
      html: html,
    }
  });
};
