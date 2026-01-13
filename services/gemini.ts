
import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from "../types";

/**
 * Analyzes business data and provides concise, actionable insights using Gemini 3 Flash.
 * Adheres to the latest @google/genai guidelines.
 */
export const getBusinessInsights = async (products: Product[], sales: Sale[]) => {
  // Use process.env.API_KEY directly as per SDK requirements.
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing. Insights will be disabled.");
    return "AI Insights are currently unavailable. Please check system configuration.";
  }

  // Create client right before usage to ensure up-to-date credentials.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze this spectacles business data and provide 3-4 concise, actionable business insights.
    
    Inventory: ${JSON.stringify(products.map(p => ({ brand: p.brand, model: p.model, stock: p.stockQuantity, price: p.sellingPrice })))}
    Recent Sales: ${JSON.stringify(sales.slice(-10).map(s => ({ product: s.productName, qty: s.quantity, total: s.totalAmount })))}
    
    Format the output as a friendly summary for an owner. Focus on stock optimization, popular items, or pricing suggestions.
  `;

  try {
    // Generate content using the recommended task-specific model.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    // Access response text as a property, not a method call.
    return response.text || "No actionable insights found based on current data.";
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    return "Could not generate insights at this moment. Please check your connectivity.";
  }
};
