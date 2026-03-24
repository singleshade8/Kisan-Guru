/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY 
});

  export const predictCrop = async (soil: string, temp: number, humidity: number, rainfall: number, lang: string) => {
    const prompt = `You are an expert Indian agricultural scientist. 
    Based on these conditions:
    Soil: ${soil}
    Temperature: ${temp}°C
    Humidity: ${humidity}%
    Rainfall: ${rainfall}mm
    
    Recommend the TOP 3 best Indian crops.
    Provide the response in ${lang === 'hi' ? 'Hindi' : lang === 'ta' ? 'Tamil' : 'English'}.
    Format the response as JSON:
    {
      "recommendations": [
        {
          "crop": "Crop Name",
          "confidence": "Percentage",
          "yield": "Expected yield per acre",
          "cost": "Cost of cultivation per acre",
          "profit": "Estimated profit per acre",
          "market_price": "Current market price",
          "sow_month": "Best months to sow",
          "reason": "Why this crop?",
          "sustainability_score": 1-10,
          "weather_suitability": 1-10
        }
      ],
      "best_crop_index": 0
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  };

  export const checkSuitability = async (cropName: string, soil: string, temp: number, humidity: number, rainfall: number, lang: string) => {
    const prompt = `Check if the crop "${cropName}" is suitable for these current conditions:
    Soil: ${soil}
    Temperature: ${temp}°C
    Humidity: ${humidity}%
    Rainfall: ${rainfall}mm
    
    Provide the response in ${lang === 'hi' ? 'Hindi' : lang === 'ta' ? 'Tamil' : 'English'}.
    Format the response as JSON:
    {
      "suitable": boolean,
      "reason": "Detailed reason why or why not",
      "overall_score": 1-10,
      "factors": {
        "soil": 1-10,
        "temperature": 1-10,
        "humidity": 1-10,
        "rainfall": 1-10
      }
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  };

  export const detectDisease = async (imageBase64: string, lang: string) => {
    const prompt = `Analyze this plant leaf image. 
    Identify the disease and suggest a remedy in ${lang === 'hi' ? 'Hindi' : lang === 'ta' ? 'Tamil' : 'English'}.
    Format the response as JSON:
    {
      "disease": "Disease Name",
      "confidence": "Percentage",
      "remedy": "Simple remedy (e.g., medicine name or natural cure)"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: imageBase64.split(',')[1] } }
      ],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  };

  export const chatWithGemini = async (message: string, history: { role: string, parts: { text: string }[] }[], lang: string) => {
    const systemInstruction = `You are KISAN AI, a helpful Indian agricultural assistant. 
    Answer the user's queries about farming, crops, weather, and soil. 
    Keep the responses concise and helpful. 
    Provide the response in ${lang === 'hi' ? 'Hindi' : lang === 'ta' ? 'Tamil' : 'English'}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: { systemInstruction }
    });
    return response.text;
  };
