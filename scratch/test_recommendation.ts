
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_API_KEY || process.env.API_KEY;

// Mock PRODUCTS since we can't easily import from constants.ts in ESM/TS context without more setup
const PRODUCTS = [
  { name: 'Sauvage Elixir', brand: 'Dior', category: 'Masculino', description: 'Especiarias e frescor.' },
  { name: 'Coco Mademoiselle', brand: 'Chanel', category: 'Feminino', description: 'Oriental e fresco.' }
];

async function testRecommendation() {
  if (!apiKey) return;
  const ai = new GoogleGenAI({ apiKey });
  
  const query = "Quero um perfume marcante para a noite.";
  const productList = PRODUCTS.map(p => `- ${p.name} (${p.brand}): ${p.category}, ${p.description}`).join('\n');
  const prompt = `
    Você é um especialista em perfumes da loja Vision Perfumes.
    Produtos:
    ${productList}
    Pergunta: "${query}"
    Sugira 1 perfume.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    console.log("✅ Recomendação do Consultor:", response.text);
  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

testRecommendation();
