
import { GoogleGenAI } from "@google/genai";
import type { GroundingResult } from '../types';

export class WisdomEngine {
    private static ai: GoogleGenAI | null = null;

    private static initialize(): GoogleGenAI {
        if (!this.ai) {
            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                console.error("[WisdomEngine] API_KEY is not defined. Please ensure it is set in your environment.");
                throw new Error("API_KEY is not defined");
            }
            this.ai = new GoogleGenAI({ apiKey });
        }
        return this.ai;
    }

    public static async getExplanation(topic: string): Promise<GroundingResult | null> {
        try {
            const ai = this.initialize();
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `Provide a concise, professional explanation for a software engineer about the importance of resolving the following issue: "${topic}". Focus on the negative impacts and best practices.`,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });

            const explanation = response.text;
            
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            // Fix: Explicitly type `sources` to prevent `uniqueSources` from being inferred as `unknown[]`.
            // This ensures proper type propagation through the `Map` constructor and `.values()` iterator.
            const sources: { uri: string; title: string }[] = groundingChunks
                ?.map((chunk: any) => chunk.web)
                .filter((web: any) => web?.uri && web?.title)
                .map((web: any) => ({ uri: web.uri, title: web.title })) ?? [];
            
            const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

            if (!explanation) {
                 return {
                    explanation: "No specific context was found from the web oracle for this topic.",
                    sources: []
                };
            }

            return { explanation, sources: uniqueSources };
        } catch (error) {
            console.error("[WisdomEngine] Error fetching explanation:", error);
            return {
                explanation: "The connection to the web oracle was disrupted. Unable to fetch context.",
                sources: []
            };
        }
    }
}
