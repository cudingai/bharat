
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const TRANSACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    amount: { type: Type.NUMBER, description: "The transaction amount as a number" },
    merchant: { type: Type.STRING, description: "Name of the merchant or recipient" },
    category: { 
      type: Type.STRING, 
      description: "One of: Food, Travel, Subscriptions, Impulse, Misc, Utilities" 
    },
    timestamp: { type: Type.STRING, description: "ISO 8601 timestamp" },
  },
  required: ["amount", "merchant", "category", "timestamp"]
};

export async function parseTransactionFromText(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a financial parser. Extract transaction details into JSON. Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: TRANSACTION_SCHEMA
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Text Error:", error);
    return null;
  }
}

export async function parseTransactionFromImage(base64Data: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Extract transaction details from this receipt, screenshot, or payment alert into JSON format." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: TRANSACTION_SCHEMA
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Image Error:", error);
    return null;
  }
}

export async function parseTransactionFromAudio(base64Data: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "This is a voice recording of someone describing an expense. Extract the transaction details into JSON format." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: TRANSACTION_SCHEMA
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Audio Error:", error);
    return null;
  }
}

export async function generateWeeklyInsight(transactions: any[]) {
  try {
    if (transactions.length === 0) return "Start logging small spends to see patterns.";
    const summary = transactions.map(t => `₹${t.amount} at ${t.merchant} (${t.category})`).join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are Axiony, a calm, supportive financial AI. Based on these recent micro-spends: [${summary}], provide a single-sentence pearl of wisdom about financial awareness. Be encouraging, never judgmental.`,
    });
    return response.text;
  } catch (error) {
    return "Awareness is the first step to financial calm.";
  }
}
