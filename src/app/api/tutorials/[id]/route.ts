import { NextResponse } from 'next/server';
import { getTutorial, updateTutorialNode } from '@/lib/db';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const tutorial = getTutorial(params.id);
        if (!tutorial) {
            return NextResponse.json(
                { error: 'Tutorial not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(tutorial);
    } catch (error) {
        console.error('Error fetching tutorial:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tutorial' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const body = await request.json();
        const { nodeId, updates } = body;

        if (!nodeId || !updates) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        updateTutorialNode(params.id, nodeId, updates);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating tutorial:', error);
        return NextResponse.json(
            { error: 'Failed to update tutorial' },
            { status: 500 }
        );
    }
}
