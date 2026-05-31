const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key Loaded:", apiKey ? `YES (${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)})` : "NO");

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  try {
    console.log("Calling listModels()...");
    const result = await genAI.listModels();
    console.log("Available Models for this API Key:");
    for (const model of result.models) {
      console.log(`- Name: ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
    }
  } catch (err) {
    console.error("API Call Error Details:", err);
  }
}

run();
