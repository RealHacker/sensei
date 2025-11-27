"use client";

import { useState, useEffect } from "react";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [geminiKey, setGeminiKey] = useState("");
    const [minimaxKey, setMinimaxKey] = useState("");
    const [ttsProvider, setTtsProvider] = useState<"MINIMAX" | "LOCAL">("MINIMAX");
    const [downloadProgress, setDownloadProgress] = useState<any>(null);
    const [isModelReady, setIsModelReady] = useState(false);

    useEffect(() => {
        // Load saved keys from localStorage
        const savedGeminiKey = localStorage.getItem("gemini_api_key");
        const savedMinimaxKey = localStorage.getItem("minimax_api_key");
        const savedProvider = localStorage.getItem("tts_provider");

        if (savedGeminiKey) setGeminiKey(savedGeminiKey);
        if (savedMinimaxKey) setMinimaxKey(savedMinimaxKey);
        if (savedProvider) setTtsProvider(savedProvider as "MINIMAX" | "LOCAL");
    }, [isOpen]);

    const handleSave = () => {
        if (geminiKey.trim()) localStorage.setItem("gemini_api_key", geminiKey.trim());
        if (minimaxKey.trim()) localStorage.setItem("minimax_api_key", minimaxKey.trim());
        localStorage.setItem("tts_provider", ttsProvider);

        onClose();
    };

    const handleDownloadModel = async () => {
        try {
            const { loadPipeline, loadEmbeddings } = await import("@/lib/local-tts/tts");
            setDownloadProgress({ status: "initiating", file: "Model" });

            await loadPipeline((progress) => {
                setDownloadProgress(progress);
                if (progress.status === "ready") {
                    setIsModelReady(true);
                    setDownloadProgress(null);
                }
            });
            await loadEmbeddings();
            setIsModelReady(true);
        } catch (error) {
            console.error("Failed to load model:", error);
            setDownloadProgress({ status: "error", error });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="card w-full max-w-md bg-surface p-6 shadow-xl">
                <h2 className="text-xl font-bold mb-4">Settings</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-secondary">
                            Gemini API Key
                        </label>
                        <input
                            type="password"
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder="AIza..."
                            className="input w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-secondary">
                            TTS Provider
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTtsProvider("MINIMAX")}
                                className={`flex-1 p-2 rounded-lg border ${ttsProvider === "MINIMAX" ? "bg-primary/20 border-primary text-primary" : "border-white/10 hover:bg-white/5"}`}
                            >
                                Minimax API
                            </button>
                            <button
                                onClick={() => setTtsProvider("LOCAL")}
                                className={`flex-1 p-2 rounded-lg border ${ttsProvider === "LOCAL" ? "bg-primary/20 border-primary text-primary" : "border-white/10 hover:bg-white/5"}`}
                            >
                                Local (WebGPU)
                            </button>
                        </div>
                    </div>

                    {ttsProvider === "MINIMAX" ? (
                        <div>
                            <label className="block text-sm font-medium mb-2 text-secondary">
                                Minimax API Key
                            </label>
                            <input
                                type="password"
                                value={minimaxKey}
                                onChange={(e) => setMinimaxKey(e.target.value)}
                                placeholder="Minimax API Key"
                                className="input w-full"
                            />
                        </div>
                    ) : (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <h4 className="font-medium mb-2">Local Model (Supertonic)</h4>
                            <p className="text-xs text-secondary mb-4">
                                Runs entirely in your browser using WebGPU. Requires ~300MB download on first use.
                            </p>

                            {!isModelReady && !downloadProgress && (
                                <button
                                    onClick={handleDownloadModel}
                                    className="btn btn-secondary w-full text-sm"
                                >
                                    Download & Initialize Model
                                </button>
                            )}

                            {downloadProgress && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span>{downloadProgress.file || "Downloading..."}</span>
                                        <span>{downloadProgress.progress ? Math.round(downloadProgress.progress) + "%" : ""}</span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: `${downloadProgress.progress || 0}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-secondary text-center">{downloadProgress.status}</p>
                                </div>
                            )}

                            {isModelReady && (
                                <div className="flex items-center gap-2 text-success text-sm">
                                    <span>✓</span> Model ready for use
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="btn btn-secondary">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="btn btn-primary">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
