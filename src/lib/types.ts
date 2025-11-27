export type NodeType = 'script' | 'question';

export type QuestionType = 'TRUE_FALSE' | 'MULTIPLE_CHOICE' | 'SHORT_ANSWER';

export type DifficultyLevel = 'ELI5' | 'COMMON' | 'PROFESSIONAL';

export interface BaseNode {
    id: string;
    type: NodeType;
}

export interface ScriptNode extends BaseNode {
    type: 'script';
    content: string;
    audioUrl?: string; // Populated after TTS
}

export interface QuestionNode extends BaseNode {
    type: 'question';
    questionType: QuestionType;
    question: string;
    options?: string[]; // For MCQ
    correctAnswer: string;
    explanation?: string; // Optional explanation for the answer
    relevantScriptId?: string; // ID of the script node this question relates to
}

export type TutorialNode = ScriptNode | QuestionNode;

export interface Tutorial {
    id: string;
    title: string;
    nodes: TutorialNode[];
    createdAt: string;
}
