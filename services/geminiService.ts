import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from '../constants';

// Safe access for both Vite (import.meta.env) and standard (process.env) environments
const getApiKey = () => {
  try {
    // Check for Vite environment
    // Cast to any to avoid TypeScript errors if types are missing
    const meta = import.meta as any;
    if (typeof meta !== 'undefined' && meta.env && meta.env.VITE_API_KEY) {
      return meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore error if import.meta is not supported
  }
  
  try {
    // Check for standard process.env
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore error
  }
  
  return "";
};

const apiKey = getApiKey();

const ai = new GoogleGenAI({ apiKey });

export const getPerfumeRecommendation = async (query: string): Promise<string> => {
  if (!apiKey) {
    return "Por favor, configure a chave de API do Gemini (VITE_API_KEY) para usar este recurso.";
  }

  // Create a context string with available products
  const productList = PRODUCTS.map(p => `- ${p.name} (${p.brand}): ${p.category}, ${p.description}`).join('\n');

  const prompt = `
    Você é um especialista em perfumes da loja Vision Perfumes.
    Aqui está a lista de produtos disponíveis:
    ${productList}

    O cliente perguntou: "${query}"

    Com base na pergunta do cliente e nos produtos disponíveis, sugira 1 ou 2 perfumes da lista.
    Explique brevemente por que eles combinam com o pedido.
    Seja elegante, sofisticado e prestativo. Responda em português.
    Não invente produtos que não estejam na lista.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster response
      }
    });
    
    return response.text || "Desculpe, não consegui encontrar uma recomendação no momento.";
  } catch (error) {
    console.error("Erro ao consultar Gemini:", error);
    return "Houve um erro ao conectar com nosso consultor virtual. Tente novamente mais tarde.";
  }
};