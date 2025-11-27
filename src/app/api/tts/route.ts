import { NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/tts';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text } = body;

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            );
        }

        const apiKey = request.headers.get('x-minimax-key') || "";
        const groupId = request.headers.get('x-minimax-group-id') || "";

        const audioUrl = await generateSpeech(text, { apiKey, groupId });
        return NextResponse.json({ url: audioUrl });
    } catch (error) {
        console.error('Error in TTS API:', error);
        // @ts-ignore
        if (error.message) console.error('Error Message:', error.message);
        return NextResponse.json(
            { error: 'Failed to generate speech' },
            { status: 500 }
        );
    }
}
