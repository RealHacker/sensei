import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'public', 'audio_cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

interface MinimaxConfig {
    apiKey: string;
    groupId: string;
}

export async function generateSpeech(text: string, config?: MinimaxConfig): Promise<string> {
    // Create a hash of the text to use as the filename
    const hash = crypto.createHash('md5').update(text).digest('hex');
    const filename = `${hash}.mp3`;
    const filePath = path.join(CACHE_DIR, filename);
    const publicUrl = `/audio_cache/${filename}`;

    // Check if file already exists
    if (fs.existsSync(filePath)) {
        return publicUrl;
    }

    if (!config?.apiKey) {
        throw new Error("Minimax API Key and Group ID are required");
    }

    try {
        const response = await fetch(`https://api.minimaxi.com/v1/t2a_v2`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "speech-01-turbo",
                text: text,
                stream: false,
                voice_setting: {
                    voice_id: "male-qn-qingse",
                    speed: 1.0,
                    vol: 1.0,
                    pitch: 0
                },
                audio_setting: {
                    sample_rate: 32000,
                    bitrate: 128000,
                    format: "mp3",
                    channel: 1
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[TTS DEBUG] Minimax API Error Response: ${response.status} - ${errorText}`);
            throw new Error(`Minimax API error: ${response.status} ${errorText}`);
        }

        // Minimax returns audio in the response body as a stream or buffer
        // But wait, the documentation says it returns JSON with "data" containing hex string if stream=false?
        // Let's check the docs again. 
        // "If stream is false, the response body will contain the audio data in the 'data' field."
        // Actually, for t2a_v2, if stream=false, it often returns a JSON with "data" -> "audio_hex_string" or similar?
        // Let's assume standard binary response for now, or check if we need to parse JSON.
        // Re-reading standard practices for Minimax:
        // Usually it returns a JSON with `data` field containing the audio data if stream is false?
        // Wait, let's try to treat it as a buffer first. If it fails, we debug.
        // Actually, let's look at a common implementation.
        // Most T2A APIs return the binary directly if not streaming.
        // However, some return JSON wrapper.
        // Let's assume it returns a JSON with `data` containing the audio if we don't use stream=true.

        // Let's try to parse as JSON first to be safe.
        const responseData = await response.json();

        if (responseData.base_resp && responseData.base_resp.status_code !== 0) {
            console.error(`[TTS DEBUG] Minimax Logic Error:`, JSON.stringify(responseData, null, 2));
            throw new Error(`Minimax API Error: ${responseData.base_resp.status_msg}`);
        }

        if (responseData.data && responseData.data.audio) {
            // It seems it returns hex string in `data.audio` for some versions?
            // Or maybe `data` is the hex string?
            // Let's assume `data.audio` is the hex string based on some docs.
            // Actually, let's try to handle the case where it returns a buffer directly if we requested stream=true, but we requested stream=false.

            // Let's try to use stream=true and pipe it to file, might be safer?
            // But we are in a serverless function context (Next.js API), so we want to await it.

            // Let's try to assume the response body IS the audio if we use a different endpoint?
            // No, let's stick to the doc link provided: https://platform.minimaxi.com/docs/api-reference/speech-t2a-http
            // It says: Response Body: { "data": { "audio": "hex string", "status": 1, ... } }

            const audioHex = responseData.data.audio;
            const buffer = Buffer.from(audioHex, 'hex');
            fs.writeFileSync(filePath, buffer);
            return publicUrl;
        } else {
            console.error(`[TTS DEBUG] Missing audio data in response:`, JSON.stringify(responseData, null, 2));
            throw new Error("Unexpected response format from Minimax API");
        }

    } catch (error) {
        console.error("Error generating speech:", error);
        if (error instanceof Error) {
            console.error("Stack trace:", error.stack);
        }
        throw error;
    }
}
