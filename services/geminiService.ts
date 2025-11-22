import { GoogleGenAI, Type } from "@google/genai";
import { MILELION_SYSTEM_PROMPT } from "../constants";
import { AIExtractionResponse } from "../types";

// Initialize GenAI client
// Note: In a production app, API keys should be handled via a backend proxy.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractBillData = async (base64Data: string, mimeType: string = "image/png"): Promise<AIExtractionResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: `Analyze this credit card statement document. It often contains multiple different cards (e.g. a consolidated bank statement).

            CRITICAL INSTRUCTION FOR MULTI-CARD STATEMENTS (e.g., Citibank, DBS):
            1. Look immediately for a "Payment Slip", "Account Summary", "Your Citibank Cards", or "Consolidated Statement" table on the first 1-2 pages.
            2. This table lists EVERY card account and its "Current Balance" or "Total Amount Due". Use this as the primary source for Card Name and Total Amount.
            3. Do NOT assume only one card exists. Extract EVERY card listed in that summary table as a separate bill entry.
            
            For EACH card account found:
            1. Bank Name (e.g., Citibank, DBS, UOB)
            2. Card Name (e.g., "Citi Prestige", "DBS Woman's World", "UOB Lady's Card") - Be precise.
            3. Total Amount Due / Current Balance for that specific card.
            4. Payment Due Date (found in the summary or header).
            5. Statement Date.
            6. Transactions: Scan the subsequent pages for transaction lists belonging to this specific card number or section.
            
            For each transaction:
            - Date (YYYY-MM-DD)
            - Description
            - Amount
            - Category (Guess based on merchant: Dining, Transport, Online, Travel, Shopping, Groceries)`,
          },
        ],
      },
      config: {
        systemInstruction: MILELION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bankName: { type: Type.STRING },
                  cardName: { type: Type.STRING },
                  totalAmount: { type: Type.NUMBER },
                  dueDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
                  statementDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
                  transactions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        date: { type: Type.STRING, description: "YYYY-MM-DD format" },
                        description: { type: Type.STRING },
                        amount: { type: Type.NUMBER },
                        category: { type: Type.STRING },
                      },
                    },
                  },
                },
                required: ["bankName", "totalAmount", "dueDate", "transactions"],
              },
            },
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIExtractionResponse;
    }
    throw new Error("Empty response from Gemini");
  } catch (error) {
    console.error("Error extracting bill data:", error);
    throw error;
  }
};

export const generateOptimizationAdvice = async (transactions: any[]) => {
  try {
    if (!transactions || transactions.length === 0) {
        return { advice: "Upload bills to generate insights.", riskScore: 0, missedMiles: 0, anomalies: [] };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze these transactions based on Singapore specific credit card strategies (Milelion). 
      Identify which transactions missed a bonus mile opportunity (e.g. using a general card for online spend instead of DBS WWMC).
      Return a short summary advice and a 'risk score' (0-100) based on how many late payment risks or bad card choices exist.
      
      Transactions JSON: ${JSON.stringify(transactions)}`,
      config: {
        systemInstruction: MILELION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: { type: Type.STRING },
            riskScore: { type: Type.NUMBER },
            missedMiles: { type: Type.NUMBER, description: "Estimated missed miles count" },
            anomalies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of unusual transactions" }
          }
        }
      }
    });
     if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error(error);
    return { advice: "Could not generate advice.", riskScore: 0, missedMiles: 0, anomalies: [] };
  }
};

export const generateEmailDraft = async (bills: any[]) => {
  try {
    const unpaidBills = bills.filter((b: any) => !b.isPaid);
    if (unpaidBills.length === 0) return "No unpaid bills.";

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Write a polite but urgent email reminder to myself about these upcoming unpaid credit card bills. 
        Include the Bank, Amount, and Due Date.
        Bills: ${JSON.stringify(unpaidBills)}`,
    });
    return response.text;
  } catch (error) {
      return "Error generating email.";
  }
}