import fs from 'fs';
import path from 'path';
import { Tutorial, TutorialNode } from './types';

const DATA_DIR = path.join(process.cwd(), 'data', 'tutorials');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function saveTutorial(tutorial: Tutorial): void {
    const filePath = path.join(DATA_DIR, `${tutorial.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(tutorial, null, 2));
}

export function getTutorial(id: string): Tutorial | null {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) {
        return null;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

export function getAllTutorials(): Tutorial[] {
    const files = fs.readdirSync(DATA_DIR);
    const tutorials: Tutorial[] = [];

    for (const file of files) {
        if (file.endsWith('.json')) {
            const filePath = path.join(DATA_DIR, file);
            try {
                const data = fs.readFileSync(filePath, 'utf-8');
                tutorials.push(JSON.parse(data));
            } catch (err) {
                console.error(`Failed to parse tutorial file: ${file}`, err);
            }
        }
    }

    // Sort by creation time if we had it, but for now maybe reverse order?
    return tutorials.reverse();
}

export function updateTutorialNode(tutorialId: string, nodeId: string, updates: Partial<TutorialNode>): void {
    const tutorial = getTutorial(tutorialId);
    if (!tutorial) {
        throw new Error(`Tutorial not found: ${tutorialId}`);
    }

    const nodeIndex = tutorial.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) {
        throw new Error(`Node not found: ${nodeId}`);
    }

    tutorial.nodes[nodeIndex] = { ...tutorial.nodes[nodeIndex], ...updates } as TutorialNode;
    saveTutorial(tutorial);
}
