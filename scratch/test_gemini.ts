
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_API_KEY || process.env.API_KEY;

async function testGemini() {
  if (!apiKey) {
    console.error("❌ Erro: VITE_API_KEY não encontrada no .env.local");
    return;
  }

  console.log("Using API Key:", apiKey.substring(0, 5) + "...");
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: "Olá, quem é você?" }] }]
    });
    console.log("✅ Resposta do Gemini:", response.text);
  } catch (error) {
    console.error("❌ Erro ao chamar Gemini:", error);
  }
}

testGemini();
