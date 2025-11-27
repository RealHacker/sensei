import { generateCompletion } from './llm';
import { chunkText } from './chunking';
import { Tutorial, TutorialNode, DifficultyLevel } from './types';
import { v4 as uuidv4 } from 'uuid';

const SYSTEM_PROMPT = `
You are an expert teacher "Sensei". Your goal is to create an interactive audio lesson from the provided text.
The lesson should be engaging, conversational, and easy to understand.
Structure the lesson as a series of "nodes".
A node can be either a "script" (what you say) or a "question" (interactive check for understanding).

Rules:
1. Break down the content into digestible parts.
2. Interleave scripts and questions.
3. Questions should test understanding of the immediately preceding content.
4. The first node MUST be a script (introduction).
5. The last node MUST be a script (summary/conclusion).
6. Output MUST be a valid JSON object with "title" and "nodes" fields.

Output Format:
{
  "title": "A short, engaging title for the lesson",
  "nodes": [
    ... nodes here ...
  ]
}

Node Formats:
Script Node: { "type": "script", "content": "text to speak" }
Question Node: { 
  "type": "question", 
  "questionType": "TRUE_FALSE" | "MULTIPLE_CHOICE" | "SHORT_ANSWER",
  "question": "question text",
  "options": ["option1", "option2"] (only for MULTIPLE_CHOICE),
  "correctAnswer": "answer string"
}
`;

export async function generateTutorial(
    text: string,
    apiKey?: string,
    defaultTitle: string = "Untitled Lesson",
    difficulty: DifficultyLevel = 'COMMON'
): Promise<Tutorial> {
    let difficultyPrompt = "";
    switch (difficulty) {
        case 'ELI5':
            difficultyPrompt = "Explain like I'm 5. Use simple words, analogies, and short sentences. Avoid jargon.";
            break;
        case 'PROFESSIONAL':
            difficultyPrompt = "Use professional terminology and in-depth technical explanations suitable for experts.";
            break;
        case 'COMMON':
        default:
            difficultyPrompt = "Use clear, standard language suitable for a general audience.";
            break;
    }

    const prompt = `
    Create an interactive lesson from the following text.
    Difficulty Level: ${difficulty}
    Style Guide: ${difficultyPrompt}
    
    Text:
    "${text}"
    
    Generate the JSON response with a creative title.
  `;

    const response = await generateCompletion(
        prompt,
        SYSTEM_PROMPT,
        true,
        apiKey
    );

    if (!response) {
        throw new Error("Failed to generate tutorial");
    }

    try {
        const parsed = JSON.parse(response);
        const nodes: TutorialNode[] = parsed.nodes.map((node: any) => ({
            ...node,
            id: uuidv4()
        }));

        return {
            id: uuidv4(),
            title: parsed.title || defaultTitle,
            nodes,
            createdAt: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error parsing generated tutorial:", error);
        throw new Error("Failed to parse generated tutorial");
    }
}
