import { NextResponse } from 'next/server';
import { getAllTutorials } from '@/lib/db';

export async function GET() {
    try {
        const tutorials = getAllTutorials();
        return NextResponse.json(tutorials);
    } catch (error) {
        console.error('Error fetching tutorials:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tutorials' },
            { status: 500 }
        );
    }
}
