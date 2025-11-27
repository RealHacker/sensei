import { NextResponse } from 'next/server';
import { generateTutorial } from '@/lib/generator';
import { saveTutorial } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { text, difficulty } = await req.json();
        const apiKey = req.headers.get("x-gemini-key") || undefined;

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        const tutorial = await generateTutorial(text, apiKey, "Untitled Lesson", difficulty);
        await saveTutorial(tutorial);

        return NextResponse.json(tutorial);
    } catch (error) {
        console.error("Generation error:", error);
        return NextResponse.json({ error: "Failed to generate tutorial" }, { status: 500 });
    }
}
