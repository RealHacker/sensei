/**
 * Estimates the number of tokens in a text string.
 * Uses a simple approximation of 4 characters per token.
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Splits text into chunks that fit within the maxTokens limit.
 * Tries to split at paragraph boundaries first, then sentences.
 */
export function chunkText(text: string, maxTokens: number = 3000): string[] {
    const totalTokens = estimateTokens(text);
    if (totalTokens <= maxTokens) {
        return [text];
    }

    const chunks: string[] = [];
    let currentChunk = "";

    // Split by double newline (paragraphs)
    const paragraphs = text.split(/\n\s*\n/);

    for (const paragraph of paragraphs) {
        const paragraphTokens = estimateTokens(paragraph);
        const currentChunkTokens = estimateTokens(currentChunk);

        if (currentChunkTokens + paragraphTokens + 1 <= maxTokens) {
            currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
        } else {
            // If the paragraph itself is too large, we need to split it by sentences
            if (paragraphTokens > maxTokens) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = "";
                }

                // Split by sentence endings (.!?)
                const sentences = paragraph.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [paragraph];

                for (const sentence of sentences) {
                    const sentenceTokens = estimateTokens(sentence);
                    if (estimateTokens(currentChunk) + sentenceTokens + 1 <= maxTokens) {
                        currentChunk += (currentChunk ? " " : "") + sentence;
                    } else {
                        if (currentChunk) {
                            chunks.push(currentChunk);
                        }
                        currentChunk = sentence;
                    }
                }
            } else {
                // Push current chunk and start new one with this paragraph
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                currentChunk = paragraph;
            }
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}
