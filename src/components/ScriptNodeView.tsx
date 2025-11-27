import React from 'react';
import { ScriptNode } from '@/lib/types';

interface ScriptNodeViewProps {
    node: ScriptNode;
    isActive: boolean;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
}

export default function ScriptNodeView({ node, isActive, isPlaying, onPlay, onPause }: ScriptNodeViewProps) {
    return (
        <div className={`transition-all duration-700 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-50'}`}>
            <div className={`p-6 rounded-3xl transition-all duration-500 ${isActive ? 'bg-surface backdrop-blur-xl border border-white/10 shadow-2xl' : 'hover:bg-white/5'}`}>
                <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 mt-1">
                        {isActive ? (
                            <button
                                onClick={isPlaying ? onPause : onPlay}
                                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-cyan-600 text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all"
                            >
                                {isPlaying ? (
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <rect x="6" y="4" width="4" height="16" rx="1" />
                                        <rect x="14" y="4" width="4" height="16" rx="1" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 fill-current ml-1" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>
                        ) : (
                            <div className="w-12 h-12 rounded-2xl bg-surface-active flex items-center justify-center text-secondary text-xl">
                                💬
                            </div>
                        )}
                    </div>
                    <div className="flex-grow pt-2">
                        <p className={`text-lg leading-relaxed font-light tracking-wide ${isActive ? 'text-foreground' : 'text-secondary'}`}>
                            {node.content}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
