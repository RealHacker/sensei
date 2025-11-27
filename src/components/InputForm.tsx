"use client";

import { useState } from "react";

interface InputFormProps {
    onSubmit: (text: string) => Promise<void>;
    isLoading: boolean;
}

export default function InputForm({ onSubmit, isLoading: isGenerating }: InputFormProps) {
    const [input, setInput] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSubmit(input);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative group">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste text, article content, or a topic..."
                    className="w-full h-48 p-6 rounded-3xl bg-surface/50 backdrop-blur-xl border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none resize-none text-lg placeholder-secondary/50 transition-all shadow-inner"
                    disabled={isGenerating}
                />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
            </div>

            <button
                type="submit"
                disabled={isGenerating || !input.trim()}
                className="btn btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
                {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⚡</span> Generating Lesson...
                    </span>
                ) : (
                    "Generate Interactive Lesson ✨"
                )}
            </button>
        </form>
    );
}
