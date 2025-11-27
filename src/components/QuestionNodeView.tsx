import React, { useState } from 'react';
import { QuestionNode } from '@/lib/types';

interface QuestionNodeViewProps {
    node: QuestionNode;
    isActive: boolean;
    onAnswer: (answer: string) => void;
    onContinue: () => void;
    isEvaluating: boolean;
    feedback: { isCorrect: boolean; explanation: string } | null;
}

export default function QuestionNodeView({ node, isActive, onAnswer, onContinue, isEvaluating, feedback }: QuestionNodeViewProps) {
    const [textAnswer, setTextAnswer] = useState("");
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const handleOptionClick = (option: string) => {
        if (!isEvaluating && !feedback) {
            setSelectedOption(option);
            onAnswer(option);
        }
    };

    const handleTextSubmit = () => {
        if (textAnswer.trim()) {
            onAnswer(textAnswer);
        }
    };

    const isInteractive = isActive && !feedback && !isEvaluating;

    return (
        <div className={`transition-all duration-700 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-50'}`}>
            <div className="bg-surface backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${isActive ? 'bg-gradient-to-br from-accent to-purple-600 text-white' : 'bg-surface-active text-secondary'}`}>
                            ?
                        </div>
                    </div>
                    <div className="flex-grow w-full space-y-6">
                        <h3 className="text-2xl font-bold leading-tight text-foreground">
                            {node.question}
                        </h3>

                        {/* Multiple Choice Grid */}
                        {node.questionType === "MULTIPLE_CHOICE" && node.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {node.options.map((option, idx) => {
                                    const isSelected = selectedOption === option;
                                    const isCorrect = feedback && option === node.correctAnswer;
                                    const isWrong = feedback && !feedback.isCorrect && isSelected;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleOptionClick(option)}
                                            disabled={!isInteractive}
                                            className={`group relative p-6 text-left rounded-2xl border transition-all duration-300
                                                ${!isInteractive ? 'cursor-default' : 'cursor-pointer hover:border-primary/50 hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98]'}
                                                ${isSelected && isEvaluating ? 'bg-primary/20 border-primary animate-pulse' : ''}
                                                ${isCorrect ? 'bg-success/20 border-success text-success' : ''}
                                                ${isWrong ? 'bg-error/20 border-error text-error' : ''}
                                                ${!feedback && !isSelected ? 'bg-black/20 border-white/10' : ''}
                                                ${feedback && !isCorrect && !isWrong ? 'opacity-50' : ''}
                                            `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-medium">{option}</span>
                                                {isSelected && isEvaluating && (
                                                    <span className="animate-spin">⏳</span>
                                                )}
                                            </div>
                                            {isInteractive && (
                                                <div className="absolute inset-0 rounded-2xl bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* True/False Cards */}
                        {node.questionType === "TRUE_FALSE" && (
                            <div className="flex gap-6">
                                {["True", "False"].map((option) => {
                                    const isSelected = selectedOption === option;
                                    const isCorrect = feedback && option === node.correctAnswer;
                                    const isWrong = feedback && !feedback.isCorrect && isSelected;

                                    return (
                                        <button
                                            key={option}
                                            onClick={() => handleOptionClick(option)}
                                            disabled={!isInteractive}
                                            className={`flex-1 p-8 rounded-2xl border text-center font-bold text-xl transition-all duration-300
                                                ${!isInteractive ? 'cursor-default' : 'cursor-pointer hover:shadow-xl hover:scale-105 active:scale-95'}
                                                ${option === "True" ? 'hover:border-success/50 hover:text-success' : 'hover:border-error/50 hover:text-error'}
                                                ${isSelected && isEvaluating ? 'bg-primary/20 border-primary animate-pulse' : ''}
                                                ${isCorrect ? 'bg-success/20 border-success text-success' : ''}
                                                ${isWrong ? 'bg-error/20 border-error text-error' : ''}
                                                ${!feedback && !isSelected ? 'bg-black/20 border-white/10' : ''}
                                                ${feedback && !isCorrect && !isWrong ? 'opacity-50' : ''}
                                            `}
                                        >
                                            <div className="flex items-center justify-center gap-3">
                                                {option}
                                                {isSelected && isEvaluating && (
                                                    <span className="animate-spin text-lg">⏳</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Short Answer Input */}
                        {node.questionType === "SHORT_ANSWER" && (
                            <div className="space-y-4">
                                <textarea
                                    value={textAnswer}
                                    onChange={(e) => setTextAnswer(e.target.value)}
                                    disabled={!isInteractive}
                                    placeholder="Type your answer here..."
                                    className="w-full p-6 rounded-2xl bg-black/20 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none min-h-[120px] text-lg transition-all"
                                />
                                {isInteractive && (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleTextSubmit}
                                            disabled={isEvaluating || !textAnswer.trim()}
                                            className="btn btn-primary px-10 py-4 text-lg shadow-xl hover:shadow-primary/30"
                                        >
                                            {isEvaluating ? "Checking..." : "Submit Answer"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Feedback Card */}
                        {feedback && (
                            <div className={`animate-fade-in p-6 rounded-2xl border ${feedback.isCorrect ? 'bg-success/10 border-success/20' : 'bg-error/10 border-error/20'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-2xl ${feedback.isCorrect ? 'text-success' : 'text-error'}`}>
                                        {feedback.isCorrect ? '🎉' : '❌'}
                                    </span>
                                    <h4 className={`text-lg font-bold ${feedback.isCorrect ? 'text-success' : 'text-error'}`}>
                                        {feedback.isCorrect ? "Correct!" : "Incorrect"}
                                    </h4>
                                </div>
                                <p className="text-foreground/90 leading-relaxed mb-6 pl-10">
                                    {feedback.explanation}
                                </p>
                                <div className="pl-10">
                                    <button
                                        onClick={onContinue}
                                        className="btn btn-secondary w-full md:w-auto min-w-[200px]"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
