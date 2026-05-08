
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_API_KEY || process.env.API_KEY;

async function checkKey() {
  if (!apiKey) {
      console.log("No API key found.");
      return;
  }
  console.log("Checking key with simple fetch...");
  try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      console.log("Models list response:", JSON.stringify(data, null, 2));
  } catch (e: any) {
      console.log("Fetch failed:", e.message);
  }
}

checkKey();
