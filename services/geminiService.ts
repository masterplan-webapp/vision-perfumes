import { GoogleGenerativeAI } from "@google/generative-ai";
import { Product } from '../types';

const getApiKey = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    return import.meta.env.VITE_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env && (process.env.VITE_API_KEY || process.env.API_KEY)) {
    return process.env.VITE_API_KEY || process.env.API_KEY;
  }
  return "";
};

const apiKey = (getApiKey() || "") as string;
const ai = new GoogleGenerativeAI(apiKey);

export interface RecommendedProduct {
  productId: string;
  reason: string;
}

export interface AiRecommendationResult {
  message: string;
  recommendations: RecommendedProduct[];
}

export const getPerfumeRecommendation = async (
  query: string,
  products: Product[]
): Promise<AiRecommendationResult> => {
  if (!apiKey) {
    return {
      message: "Por favor, configure a chave de API do Gemini (VITE_API_KEY) para usar este recurso.",
      recommendations: []
    };
  }

  // Build a concise catalog for the AI (id, name, brand, category, price, description)
  const productList = products.map(p =>
    `[ID:${p.id}] ${p.name} | ${p.brand} | ${p.category} | R$${p.price.toFixed(2)} | ${p.description?.substring(0, 120) || 'Sem descrição'}`
  ).join('\n');

  const prompt = `Você é um consultor de fragrâncias premium da loja Vision Perfumes.

REGRAS OBRIGATÓRIAS:
1. Você SOMENTE pode sugerir perfumes que estejam na lista abaixo. NUNCA invente ou sugira perfumes que não estejam nesta lista.
2. Para cada perfume sugerido, inclua o ID exato entre colchetes no formato [ID:xxx].
3. Sugira entre 1 e 3 perfumes que melhor atendam ao pedido do cliente.
4. Seja elegante, sofisticado e prestativo. Responda em português brasileiro.
5. Explique brevemente por que cada perfume combina com o pedido.
6. Mencione o preço de cada produto sugerido.

CATÁLOGO COMPLETO DA LOJA (APENAS estes produtos existem):
${productList}

PERGUNTA DO CLIENTE: "${query}"

Responda de forma natural e elegante, incluindo o [ID:xxx] de cada produto sugerido no texto.`;

  try {
    const model = ai.getGenerativeModel({ model: "gemini-pro" }, { apiVersion: "v1" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract product IDs from the response using [ID:xxx] pattern
    const idMatches = text.matchAll(/\[ID:([^\]]+)\]/g);
    const recommendations: RecommendedProduct[] = [];
    const seenIds = new Set<string>();

    for (const match of idMatches) {
      const productId = match[1].trim();
      if (!seenIds.has(productId) && products.some(p => p.id === productId)) {
        seenIds.add(productId);
        recommendations.push({ productId, reason: '' });
      }
    }

    // Clean the [ID:xxx] markers from the display text
    const cleanMessage = text.replace(/\s*\[ID:[^\]]+\]/g, '');

    return { message: cleanMessage, recommendations };
  } catch (error) {
    console.error("Erro ao consultar Gemini:", error);
    return {
      message: "Houve um erro ao conectar com nosso consultor virtual. Tente novamente mais tarde.",
      recommendations: []
    };
  }
};