"use client";

import { useState, useEffect } from "react";
import InputForm from "./InputForm";
import Player from "./Player";
import SettingsModal from "./SettingsModal";
import { Tutorial } from "@/lib/types";

export default function MainApp() {
    const [tutorial, setTutorial] = useState<Tutorial | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [view, setView] = useState<'home' | 'library'>('home');
    const [savedTutorials, setSavedTutorials] = useState<Tutorial[]>([]);

    const [pendingText, setPendingText] = useState<string | null>(null);
    const [showDifficultyModal, setShowDifficultyModal] = useState(false);

    useEffect(() => {
        fetchTutorials();
    }, [view]);

    const fetchTutorials = async () => {
        try {
            const res = await fetch('/api/tutorials');
            if (res.ok) {
                const data = await res.json();
                setSavedTutorials(data);
            }
        } catch (err) {
            console.error("Failed to fetch tutorials", err);
        }
    };

    const handleGenerateClick = async (text: string) => {
        setPendingText(text);
        setShowDifficultyModal(true);
    };

    const confirmGenerate = async (difficulty: 'ELI5' | 'COMMON' | 'PROFESSIONAL') => {
        setShowDifficultyModal(false);
        if (!pendingText) return;

        setIsLoading(true);
        setError(null);
        try {
            const geminiKey = localStorage.getItem("gemini_api_key") || "";
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-gemini-key": geminiKey
                },
                body: JSON.stringify({ text: pendingText, difficulty }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate tutorial");
            }

            const data = await response.json();
            setTutorial(data);
            setView('home'); // Ensure we are in the player view context (conceptually)
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
            setPendingText(null);
        }
    };

    const handleSelectTutorial = (t: Tutorial) => {
        setTutorial(t);
        setView('home');
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setTutorial(null); setView('home'); }}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
                            S
                        </div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            Sensei
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => { setTutorial(null); setView('library'); }}
                            className={`text-sm font-medium transition-colors ${view === 'library' ? 'text-primary' : 'text-secondary hover:text-foreground'}`}
                        >
                            Library
                        </button>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
                        >
                            ⚙️
                        </button>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error rounded-xl animate-fade-in">
                            {error}
                        </div>
                    )}

                    {tutorial ? (
                        <div className="animate-fade-in">
                            <div className="mb-8 flex items-center gap-3">
                                <button
                                    onClick={() => setTutorial(null)}
                                    className="text-secondary hover:text-foreground transition-colors"
                                >
                                    ← Back
                                </button>
                                <h2 className="text-3xl font-bold">{tutorial.title}</h2>
                            </div>
                            <Player tutorial={tutorial} onRestart={() => setTutorial(null)} />
                        </div>
                    ) : view === 'library' ? (
                        <div className="animate-fade-in">
                            <h2 className="text-3xl font-bold mb-8">Your Library</h2>
                            {savedTutorials.length === 0 ? (
                                <div className="text-center py-20 text-secondary border-2 border-dashed border-white/5 rounded-3xl">
                                    <p className="text-xl mb-4">No saved lessons yet.</p>
                                    <button
                                        onClick={() => setView('home')}
                                        className="btn btn-secondary"
                                    >
                                        Create your first lesson
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {savedTutorials.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleSelectTutorial(t)}
                                            className="group text-left p-6 rounded-3xl bg-surface border border-white/5 hover:border-primary/30 hover:bg-surface-hover transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-primary/5"
                                        >
                                            <h4 className="font-bold text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                                {t.title}
                                            </h4>
                                            <div className="flex items-center gap-4 text-sm text-secondary">
                                                <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                                                    ⏱️ {t.nodes.length} steps
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    Date: {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Unknown'}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            {/* Left Column: Create */}
                            <div className="lg:col-span-5 space-y-8">
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-bold leading-tight">
                                        Learn anything <br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                                            interactively.
                                        </span>
                                    </h2>
                                    <p className="text-lg text-secondary leading-relaxed">
                                        Paste any text, article content, or topic to generate a personalized, interactive audio tutorial powered by AI.
                                    </p>
                                </div>
                                <InputForm onSubmit={handleGenerateClick} isLoading={isLoading} />
                            </div>

                            {/* Right Column: Recent (Mini Library) */}
                            <div className="lg:col-span-7">
                                <div className="bg-surface/30 backdrop-blur-sm rounded-[2rem] border border-white/5 p-8 h-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-semibold flex items-center gap-2">
                                            <span className="text-primary">📚</span> Recent Lessons
                                        </h3>
                                        <button
                                            onClick={() => setView('library')}
                                            className="text-sm text-primary hover:text-primary-hover transition-colors"
                                        >
                                            View All →
                                        </button>
                                    </div>

                                    {savedTutorials.slice(0, 3).length === 0 ? (
                                        <div className="text-center py-12 text-secondary">
                                            <p>Your recent lessons will appear here.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {savedTutorials.slice(0, 3).map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => handleSelectTutorial(t)}
                                                    className="w-full text-left p-4 rounded-2xl bg-surface border border-white/5 hover:bg-surface-hover transition-all flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">{t.title}</h4>
                                                        <p className="text-xs text-secondary">{new Date(t.createdAt).toLocaleDateString()} • {t.nodes.length} steps</p>
                                                    </div>
                                                    <span className="text-secondary group-hover:translate-x-1 transition-transform">→</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {isSettingsOpen && (
                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}

            {showDifficultyModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in">
                    <div className="bg-surface border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl transform transition-all scale-100">
                        <h3 className="text-2xl font-bold mb-2">Select Difficulty</h3>
                        <p className="text-secondary mb-8">Choose how you want the lesson to be explained.</p>

                        <div className="space-y-4">
                            <button
                                onClick={() => confirmGenerate('ELI5')}
                                className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all text-left group"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-lg group-hover:text-primary transition-colors">👶 ELI5</span>
                                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Simple</span>
                                </div>
                                <p className="text-sm text-secondary">Explain Like I'm 5. Simple words, analogies, no jargon.</p>
                            </button>

                            <button
                                onClick={() => confirmGenerate('COMMON')}
                                className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all text-left group"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-lg group-hover:text-primary transition-colors">👤 Common</span>
                                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Standard</span>
                                </div>
                                <p className="text-sm text-secondary">Standard explanation for a general audience.</p>
                            </button>

                            <button
                                onClick={() => confirmGenerate('PROFESSIONAL')}
                                className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all text-left group"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-lg group-hover:text-primary transition-colors">🎓 Professional</span>
                                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Expert</span>
                                </div>
                                <p className="text-sm text-secondary">Technical terminology and in-depth analysis.</p>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowDifficultyModal(false)}
                            className="mt-8 w-full py-3 text-secondary hover:text-foreground transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
