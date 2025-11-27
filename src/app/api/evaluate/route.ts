import { NextResponse } from 'next/server';
import { generateCompletion } from '@/lib/llm';
import { generateSpeech } from '@/lib/tts';

const EVALUATION_SYSTEM_PROMPT = `
You are a helpful teacher. Evaluate the student's answer to the question.
Return a JSON object with:
- "isCorrect": boolean
- "explanation": string (brief, encouraging explanation, max 2 sentences)
`;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { question, correctAnswer, userAnswer, context } = body;

        if (!question || !userAnswer) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const prompt = `
      Context: ${context || 'No context provided.'}
      Question: ${question}
      Correct Answer: ${correctAnswer}
      Student Answer: ${userAnswer}
      
      Evaluate the student's answer.
    `;

        const geminiKey = request.headers.get('x-gemini-key') || undefined;
        const minimaxKey = request.headers.get('x-minimax-key') || "";
        const minimaxGroupId = request.headers.get('x-minimax-group-id') || "";

        const response = await generateCompletion(
            prompt,
            EVALUATION_SYSTEM_PROMPT,
            true,
            geminiKey
        );

        if (!response) {
            throw new Error("Failed to evaluate answer");
        }

        const result = JSON.parse(response);

        // Generate audio for the explanation (optional)
        let audioUrl = null;
        if (!body.skipAudio) {
            audioUrl = await generateSpeech(result.explanation, { apiKey: minimaxKey, groupId: minimaxGroupId });
        }

        return NextResponse.json({
            ...result,
            audioUrl
        });

    } catch (error) {
        console.error('Error in evaluate API:', error);
        return NextResponse.json(
            { error: 'Failed to evaluate answer' },
            { status: 500 }
        );
    }
}
