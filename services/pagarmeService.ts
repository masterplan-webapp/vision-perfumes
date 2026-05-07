

import { Address, CartItem } from "../types";
import { getSiteSettings } from "./settingsService";

export type PaymentMethod = 'credit_card' | 'pix' | 'boleto';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface PagarmeCardData {
  number: string;
  holderName: string;
  expirationDate: string; // MM/YY
  cvv: string;
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  chargeId?: string;
  status?: string;
  error?: string;
  // PIX
  pixCode?: string;
  pixQrCodeUrl?: string;
  expiresAt?: string;
  // Boleto
  boletoUrl?: string;
  boletoBarcode?: string;
  boletoDueDate?: string;
  // Cartão
  cardBrand?: string;
  cardLastDigits?: string;
}

// ─── Validação de Cartão (Algoritmo de Luhn) ───────────────────────────────────

export const isValidCardNumber = (value: string) => {
  if (/[^0-9-\s]+/.test(value)) return false;

  let nCheck = 0, bEven = false;
  value = value.replace(/\D/g, "");

  if (value.length < 13 || value.length > 19) return false;

  for (let n = value.length - 1; n >= 0; n--) {
    let nDigit = parseInt(value.charAt(n), 10);

    if (bEven) {
      if ((nDigit *= 2) > 9) nDigit -= 9;
    }

    nCheck += nDigit;
    bEven = !bEven;
  }

  return (nCheck % 10) == 0;
};

// ─── Detectar bandeira do cartão ───────────────────────────────────────────────

function detectCardBrand(number: string): string {
  const clean = number.replace(/\D/g, "");
  if (/^4/.test(clean)) return "Visa";
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return "Mastercard";
  if (/^3[47]/.test(clean)) return "Amex";
  if (/^636368|438935|504175|451416|509/.test(clean)) return "Elo";
  if (/^606282|3841/.test(clean)) return "Hipercard";
  return "unknown";
}

// ─── Tokenização de Cartão (Frontend → Pagar.me direto) ───────────────────────

/**
 * Tokeniza os dados do cartão diretamente com a API Pagar.me V5.
 * Isso é feito no browser — os dados do cartão NUNCA passam pelo nosso backend.
 * 
 * @returns card_token (tok_xxx) para enviar ao backend
 */
export const tokenizeCard = async (
  cardData: PagarmeCardData,
  publicKey: string
): Promise<string> => {
  const [expMonth, expYear] = cardData.expirationDate.split('/');
  const fullYear = parseInt(expYear) < 100 ? 2000 + parseInt(expYear) : parseInt(expYear);

  const body = {
    type: "card",
    card: {
      number: cardData.number.replace(/\D/g, ""),
      holder_name: cardData.holderName,
      exp_month: parseInt(expMonth),
      exp_year: fullYear,
      cvv: cardData.cvv,
    },
  };

  const response = await fetch(
    `https://api.pagar.me/core/v5/tokens?appId=${publicKey}`,
    {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error("Tokenization error:", data);
    throw new Error(
      data.message || data.errors?.[0]?.message || "Erro ao processar dados do cartão."
    );
  }

  return data.id; // tok_xxx
};

// ─── Processamento de Pagamento ────────────────────────────────────────────────

export const processPayment = async (
  amount: number,
  method: PaymentMethod,
  customer: {
    name: string;
    email: string;
    document: string;
    phone: string;
  },
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
      console.log(`[Pagamento] Processando via backend: ${backendUrl}`);
      
      try {
        // ── Tokenizar cartão no frontend (PCI compliant) ──────────
        let cardToken: string | undefined;
        
        if (method === 'credit_card') {
          if (!cardData) {
            return { success: false, error: "Dados do cartão são obrigatórios." };
          }
          
          console.log("[Pagamento] Tokenizando cartão...");
          cardToken = await tokenizeCard(cardData, publicKey);
          console.log("[Pagamento] Cartão tokenizado com sucesso.");
        }

        // ── Enviar ao backend (Cloud Function) ────────────────────
        const response = await fetch(`${backendUrl}/createOrder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // Converter para centavos
            method,
            customer: {
              name: customer.name,
              email: customer.email,
              document: customer.document,
              phone: customer.phone,
            },
            items: items.map(i => ({
              id: i.id,
              title: `${i.name}${i.selectedVariation ? ` (${i.selectedVariation.size})` : ''}`,
              unit_price: Math.round((i.selectedVariation?.price || i.price) * 100),
              quantity: i.quantity,
            })),
            billingAddress,
            cardToken, // undefined para PIX/Boleto
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          return { 
            success: false, 
            error: result.error || 'Erro no processamento do pagamento.' 
          };
        }

        return result;

      } catch (backendError: any) {
        console.error("Erro ao comunicar com backend:", backendError);
        return { 
          success: false, 
          error: backendError.message || "Erro de conexão com o servidor de pagamento." 
        };
      }
    }
  } catch (e) {
    console.warn("Erro ao ler configurações para pagamento, usando fallback simulado.");
  }

  // ─── MODO SIMULAÇÃO (Fallback se não houver backend configurado) ───────────
  console.log(`[SIMULAÇÃO] Processando pagamento via ${method.toUpperCase()}...`);
  console.log("Valor (centavos):", Math.round(amount * 100));

  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (method === 'credit_card') {
    // Validations
    if (!cardData || !isValidCardNumber(cardData.number)) {
      return { success: false, error: "Número de cartão inválido." };
    }
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
      transactionId: `sim_cc_${Date.now()}`,
      cardBrand: detectCardBrand(cardData.number),
      cardLastDigits: cardData.number.replace(/\D/g, "").slice(-4),
    };
  }

  if (method === 'pix') {
    return {
      success: true,
      transactionId: `sim_pix_${Date.now()}`,
      pixCode: "00020126360014BR.GOV.BCB.PIX0114+55119999999952040000530398654041.005802BR5913Vision Perfumes6008Sao Paulo62070503***6304E2CA",
      pixQrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SimulacaoPix${Date.now()}`,
    };
  }

  if (method === 'boleto') {
    return {
      success: true,
      transactionId: `sim_bol_${Date.now()}`,
      boletoBarcode: "34191.79001 01043.510047 91020.150008 1 89550000010000",
      boletoUrl: "#",
    };
  }

  return { success: false, error: "Método de pagamento não suportado." };
};