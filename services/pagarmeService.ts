

import { Address, CartItem } from "../types";
import { getSiteSettings } from "./settingsService";

export type PaymentMethod = 'credit_card' | 'pix' | 'boleto';

interface PagarmeCardData {
  number: string;
  holderName: string;
  expirationDate: string; // MM/YY
  cvv: string;
}

interface CustomerData {
  name: string;
  email: string;
  document: string;
  type: 'individual';
  phones: {
    mobile_phone: {
      country_code: string;
      area_code: string;
      number: string;
    }
  }
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
  pixCode?: string; // Copia e Cola
  pixQrCodeUrl?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
}

// Algoritmo de Luhn para validar número de cartão de crédito
export const isValidCardNumber = (value: string) => {
  if (/[^0-9-\s]+/.test(value)) return false;

  let nCheck = 0, nDigit = 0, bEven = false;
  value = value.replace(/\D/g, "");

  for (let n = value.length - 1; n >= 0; n--) {
    let cDigit = value.charAt(n),
      nDigit = parseInt(cDigit, 10);

    if (bEven) {
      if ((nDigit *= 2) > 9) nDigit -= 9;
    }

    nCheck += nDigit;
    bEven = !bEven;
  }

  return (nCheck % 10) == 0;
};

export const processPayment = async (
  amount: number,
  method: PaymentMethod,
  customer: CustomerData,
  items: CartItem[],
  billingAddress: Address,
  publicKey: string,
  cardData?: PagarmeCardData,
): Promise<PaymentResponse> => {
  
  // 1. Verificar se existe uma URL de backend configurada
  try {
      const settings = await getSiteSettings();
      const backendUrl = settings.apiBaseUrl;

      if (backendUrl && backendUrl.startsWith('http')) {
          console.log(`Enviando pagamento para backend: ${backendUrl}`);
          
          try {
              const response = await fetch(`${backendUrl}/createTransaction`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      amount: Math.round(amount * 100), // Enviar em centavos
                      method,
                      customer,
                      items: items.map(i => ({
                          id: i.id,
                          title: i.name,
                          unit_price: Math.round((i.selectedVariation?.price || i.price) * 100),
                          quantity: i.quantity,
                          tangible: true
                      })),
                      billingAddress,
                      cardData: method === 'credit_card' ? {
                          // Em produção real, você deve tokenizar o cartão no frontend com a Public Key
                          // e enviar apenas o card_token ou card_id, nunca os dados brutos.
                          // Para este exemplo híbrido, enviamos o objeto para a função tratar (assumindo HTTPS)
                          ...cardData
                      } : undefined
                  })
              });

              if (!response.ok) {
                  const errData = await response.json();
                  throw new Error(errData.message || 'Erro no processamento do pagamento via backend.');
              }

              return await response.json();

          } catch (backendError: any) {
              console.error("Erro ao comunicar com backend:", backendError);
              return { success: false, error: backendError.message || "Erro de conexão com o servidor de pagamento." };
          }
      }
  } catch (e) {
      console.warn("Erro ao ler configurações para pagamento, usando fallback simulado.");
  }

  // 2. MODO SIMULAÇÃO (Fallback se não houver backend configurado)
  console.log(`[SIMULAÇÃO] Processando pagamento via ${method.toUpperCase()}...`);
  console.log("Valor (centavos):", Math.round(amount * 100));

  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (method === 'credit_card') {
    // Validations
    if (!cardData || !isValidCardNumber(cardData.number)) {
        return { success: false, error: "Número de cartão inválido." };
    }
    // MM/YY validation
    const [month, year] = cardData.expirationDate.split('/');
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
        return { success: false, error: "Data de validade inválida." };
    }
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        return { success: false, error: "Cartão vencido." };
    }

    return { 
        success: true, 
        transactionId: `tid_cc_${Date.now()}` 
    };
  }

  if (method === 'pix') {
      // Retorna um QR Code estático de exemplo e um código copia e cola
      return {
          success: true,
          transactionId: `tid_pix_${Date.now()}`,
          pixCode: "00020126360014BR.GOV.BCB.PIX0114+55119999999952040000530398654041.005802BR5913Vision Perfumes6008Sao Paulo62070503***6304E2CA",
          pixQrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ExamplePixCode"
      };
  }

  if (method === 'boleto') {
      return {
          success: true,
          transactionId: `tid_bol_${Date.now()}`,
          boletoBarcode: "34191.79001 01043.510047 91020.150008 1 89550000010000",
          boletoUrl: "#" // Link para PDF fictício
      };
  }

  return { success: false, error: "Método de pagamento não suportado." };
};