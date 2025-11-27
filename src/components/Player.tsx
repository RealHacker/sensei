"use client";

import { useState, useEffect, useRef } from "react";
import { Tutorial, ScriptNode, QuestionNode } from "@/lib/types";
import ScriptNodeView from "./ScriptNodeView";
import QuestionNodeView from "./QuestionNodeView";

interface PlayerProps {
    tutorial: Tutorial;
    onRestart: () => void;
}

export default function Player({ tutorial, onRestart }: PlayerProps) {
    const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);

    // Local state to track audio URLs if they are generated on the fly and not yet saved
    const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

    const currentNode = tutorial.nodes[currentNodeIndex];

    // Initialize audio element
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.onended = handleAudioEnded;
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Auto-scroll to active node
    useEffect(() => {
        if (nodeRefs.current[currentNodeIndex]) {
            nodeRefs.current[currentNodeIndex]?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }, [currentNodeIndex]);

    // Effect to handle node changes
    useEffect(() => {
        setFeedback(null); // Clear feedback when node changes

        if (!currentNode) return;

        if (currentNode.type === "script") {
            playScriptNode(currentNode as ScriptNode);
        } else if (currentNode.type === "question") {
            setIsWaitingForAnswer(true);
            setIsPlaying(false);
        }
    }, [currentNodeIndex]);

    const playScriptNode = async (node: ScriptNode) => {
        try {
            let url = node.audioUrl || audioUrls[node.id];

            if (!url) {
                const provider = localStorage.getItem("tts_provider") || "MINIMAX";

                if (provider === "LOCAL") {
                    url = await generateLocalAudio(node.content);
                } else {
                    const minimaxKey = localStorage.getItem("minimax_api_key") || "";
                    const res = await fetch("/api/tts", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-minimax-key": minimaxKey,
                        },
                        body: JSON.stringify({ text: node.content }),
                    });

                    if (!res.ok) throw new Error("TTS failed");

                    const data = await res.json();
                    url = data.url;
                }

                if (url) {
                    // Save audio URL to DB (only if it's a remote URL or we want to persist local blobs - local blobs are temporary though)
                    // For local blobs, we might not want to save them to DB as they are blob: URLs.
                    // But the current logic saves them.
                    // If it's a blob url, we can't save it to DB effectively for persistence across sessions unless we convert to base64.
                    // For now, let's only save if it starts with http (remote).
                    if (url.startsWith("http")) {
                        await fetch(`/api/tutorials/${tutorial.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ nodeId: node.id, updates: { audioUrl: url } })
                        });
                    }

                    // Update local state
                    setAudioUrls(prev => ({ ...prev, [node.id]: url }));
                }
            }

            if (audioRef.current && url) {
                audioRef.current.src = url;
                try {
                    await audioRef.current.play();
                    setIsPlaying(true);
                } catch (playError) {
                    console.warn("Playback interrupted or failed:", playError);
                    setIsPlaying(false);
                }
            }
        } catch (err) {
            console.error("Playback error:", err);
            setIsPlaying(false);
        }
    };

    const generateLocalAudio = async (text: string): Promise<string> => {
        try {
            const { loadPipeline, loadEmbeddings, streamTTS, createAudioBlob } = await import("@/lib/local-tts/tts");

            // Ensure model is loaded
            const tts = await loadPipeline((progress) => {
                console.log("Loading model...", progress);
            });
            const embeddings = await loadEmbeddings();

            const chunks: Float32Array[] = [];
            // Use default voice 'Female' and default quality/speed
            const speaker_embeddings = embeddings['Female'];

            for await (const result of streamTTS(text, tts, speaker_embeddings, 5, 1.0)) {
                chunks.push(result.audio.audio);
            }

            const blob = createAudioBlob(chunks, 44100); // 44100 is SAMPLE_RATE
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error("Local TTS generation failed:", error);
            throw error;
        }
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
        // If it was feedback audio, move to next node
        if (feedback) {
            setFeedback(null);
            advanceNode();
            return;
        }

        // If it was a script node, check what's next
        if (currentNode && currentNode.type === "script") {
            advanceNode();
        }
    };

    const advanceNode = () => {
        if (currentNodeIndex < tutorial.nodes.length - 1) {
            setCurrentNodeIndex((prev) => prev + 1);
        } else {
            console.log("Tutorial finished");
            // Optionally set index to length to show completion screen
            setCurrentNodeIndex(tutorial.nodes.length);
        }
    };

    const handleAnswer = async (userAnswer: string) => {
        setIsEvaluating(true);
        const questionNode = currentNode as QuestionNode;

        // Find relevant context (previous script node)
        const prevNode = currentNodeIndex > 0 ? tutorial.nodes[currentNodeIndex - 1] : null;
        const context = prevNode?.type === 'script' ? (prevNode as ScriptNode).content : '';

        try {
            const geminiKey = localStorage.getItem("gemini_api_key") || "";
            const minimaxKey = localStorage.getItem("minimax_api_key") || "";

            const provider = localStorage.getItem("tts_provider") || "MINIMAX";
            const isLocal = provider === "LOCAL";

            const res = await fetch("/api/evaluate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-gemini-key": geminiKey,
                    "x-minimax-key": minimaxKey,
                },
                body: JSON.stringify({
                    question: questionNode.question,
                    correctAnswer: questionNode.correctAnswer,
                    userAnswer,
                    context,
                    skipAudio: isLocal // Skip server-side TTS if using local
                }),
            });

            const data = await res.json();

            setFeedback({
                isCorrect: data.isCorrect,
                explanation: data.explanation
            });

            setIsWaitingForAnswer(false);

            // Play feedback audio
            let audioUrl = data.audioUrl;
            if (isLocal && data.explanation) {
                audioUrl = await generateLocalAudio(data.explanation);
            }

            if (audioRef.current && audioUrl) {
                audioRef.current.src = audioUrl;
                try {
                    await audioRef.current.play();
                    setIsPlaying(true);
                } catch (playError) {
                    console.warn("Feedback playback interrupted:", playError);
                }
            }

        } catch (err) {
            console.error("Evaluation error:", err);
        } finally {
            setIsEvaluating(false);
            // Scroll to show feedback
            setTimeout(() => {
                if (nodeRefs.current[currentNodeIndex]) {
                    nodeRefs.current[currentNodeIndex]?.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }
            }, 100);
        }
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.warn("Play failed", e));
            }
            setIsPlaying(!isPlaying);
        }
    };

    if (!currentNode) {
        return (
            <div className="w-full max-w-4xl mx-auto pb-40 px-4 text-center py-20 animate-fade-in">
                <div className="bg-surface/30 backdrop-blur-xl border border-white/10 rounded-[2rem] p-12 shadow-2xl">
                    <div className="text-6xl mb-6">🎉</div>
                    <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Lesson Complete!</h2>
                    <p className="text-xl text-secondary mb-8">You've finished "{tutorial.title}". Great job!</p>
                    <button onClick={onRestart} className="btn btn-primary px-8 py-4 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40">
                        Back to Library
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto pb-40 px-4">
            <div className="space-y-12 relative">
                {/* Timeline Line */}
                <div className="absolute left-[2.25rem] top-12 bottom-12 w-0.5 bg-gradient-to-b from-primary/50 via-accent/50 to-transparent opacity-20" />

                {tutorial.nodes.map((node, index) => {
                    const isActive = index === currentNodeIndex;
                    const isPast = index < currentNodeIndex;

                    // Only show nodes up to current index + 1 (preview next)
                    if (index > currentNodeIndex) return null;

                    return (
                        <div
                            key={node.id}
                            ref={el => { nodeRefs.current[index] = el; }}
                            className={`relative z-10 transition-all duration-700 ${isPast ? 'opacity-40 grayscale' : 'opacity-100'}`}
                        >
                            {node.type === 'script' ? (
                                <ScriptNodeView
                                    node={node as ScriptNode}
                                    isActive={isActive}
                                    isPlaying={isActive && isPlaying}
                                    onPlay={togglePlay}
                                    onPause={togglePlay}
                                />
                            ) : (
                                <QuestionNodeView
                                    node={node as QuestionNode}
                                    isActive={isActive}
                                    onAnswer={handleAnswer}
                                    onContinue={handleAudioEnded}
                                    isEvaluating={isEvaluating}
                                    feedback={isActive ? feedback : null}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Floating Bottom Controls */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full p-4 shadow-2xl flex items-center justify-between gap-6">
                    <button
                        onClick={onRestart}
                        className="btn btn-ghost rounded-full w-12 h-12 flex items-center justify-center hover:bg-white/10"
                        title="Back to Library"
                    >
                        <span className="text-xl">←</span>
                    </button>

                    <div className="flex-1 flex items-center justify-center gap-6">
                        {currentNode.type === 'script' && (
                            <button
                                onClick={togglePlay}
                                className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all active:scale-95"
                            >
                                {isPlaying ? (
                                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                                        <rect x="6" y="4" width="4" height="16" rx="1" />
                                        <rect x="14" y="4" width="4" height="16" rx="1" />
                                    </svg>
                                ) : (
                                    <svg className="w-8 h-8 fill-current ml-1" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="w-12 h-12 flex items-center justify-center font-mono text-sm text-secondary">
                        {currentNodeIndex + 1}/{tutorial.nodes.length}
                    </div>
                </div>
            </div>
        </div>
    );
}
