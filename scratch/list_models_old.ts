
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_API_KEY || process.env.API_KEY;

async function listModels() {
  if (!apiKey) return;
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // Note: listModels is not on the genAI object directly in the same way, 
    // it's usually on the client. But let's try to find it.
    console.log("Listing models...");
    // Actually, I'll just try 'gemini-pro' and 'gemini-pro-vision'
    const models = ["gemini-pro", "gemini-1.0-pro", "gemini-1.5-flash-latest", "gemini-1.5-pro-latest"];
    for (const model of models) {
        try {
            const m = genAI.getGenerativeModel({ model });
            const res = await m.generateContent("hi");
            console.log(`✅ Model ${model} works!`);
            break;
        } catch (e: any) {
            console.log(`❌ Model ${model} failed: ${e.message}`);
        }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

listModels();
