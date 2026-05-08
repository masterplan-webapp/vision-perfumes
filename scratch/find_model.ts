
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_API_KEY || process.env.API_KEY;

async function listModels() {
  if (!apiKey) return;
  const ai = new GoogleGenAI({ apiKey });
  try {
    // The new SDK might not have listModels easily accessible or it's different.
    // Let's try to just find a working model.
    console.log("Listing models is not straightforward in the new SDK yet, trying common ones...");
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp", "gemini-2.0-flash"];
    for (const model of models) {
        try {
            const res = await ai.models.generateContent({ model, contents: [{role: 'user', parts:[{text: 'hi'}]}] });
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
