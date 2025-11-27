import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

const DEBUG_DIR = path.join(process.cwd(), 'public', 'debug_dumps');

if (!fs.existsSync(DEBUG_DIR)) {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
}

export const createClient = (apiKey?: string) => {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
        throw new Error("Gemini API Key is not set");
    }
    return new GoogleGenerativeAI(key);
};

export async function generateCompletion(prompt: string, systemInstruction?: string, jsonMode: boolean = false, apiKey?: string) {
    const genAI = createClient(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction,
        generationConfig: {
            responseMimeType: jsonMode ? "application/json" : "text/plain",
        }
    });

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Debug dump
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `llm_response_${timestamp}.json`;
        fs.writeFileSync(path.join(DEBUG_DIR, filename), text);
        console.log(`[DEBUG] LLM response dumped to ${filename}`);

        return text;
    } catch (error) {
        console.error("Error generating completion:", error);
        throw error;
    }
}
