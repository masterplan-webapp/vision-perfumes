
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_API_KEY || process.env.API_KEY;

async function testOldGemini() {
  if (!apiKey) return;
  console.log("Testing with @google/generative-ai...");
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Olá, quem é você?");
    console.log("✅ Resposta (Old SDK):", result.response.text());
  } catch (error: any) {
    console.error("❌ Erro (Old SDK):", error.message);
  }
}

testOldGemini();
