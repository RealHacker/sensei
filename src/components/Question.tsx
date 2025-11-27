"use client";

import { useState } from "react";
import { QuestionNode } from "@/lib/types";

interface QuestionProps {
    node: QuestionNode;
    onAnswer: (userAnswer: string) => Promise<void>;
    isEvaluating: boolean;
}

export default function Question({ node, onAnswer, isEvaluating }: QuestionProps) {
    const [answer, setAnswer] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (answer.trim()) {
            onAnswer(answer);
        }
    };

    return (
        <div className="mt-6 p-6 bg-surface border border-border rounded-lg animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-semibold mb-4 text-primary">Question Time</h3>
            <p className="text-lg mb-6">{node.question}</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {node.questionType === "MULTIPLE_CHOICE" && node.options ? (
                    <div className="flex flex-col gap-3">
                        {node.options.map((option, index) => (
                            <label
                                key={index}
                                className={`
                  flex items-center p-4 rounded-lg border cursor-pointer transition-all
                  ${answer === option
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50 hover:bg-surface-hover"}
                `}
                            >
                                <input
                                    type="radio"
                                    name="mcq"
                                    value={option}
                                    checked={answer === option}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    className="mr-3 w-4 h-4 text-primary"
                                    disabled={isEvaluating}
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                ) : node.questionType === "TRUE_FALSE" ? (
                    <div className="flex gap-4">
                        {["True", "False"].map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setAnswer(option)}
                                className={`
                  flex-1 p-4 rounded-lg border transition-all font-medium
                  ${answer === option
                                        ? "border-primary bg-primary text-white"
                                        : "border-border hover:border-primary/50 hover:bg-surface-hover"}
                `}
                                disabled={isEvaluating}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                ) : (
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="input min-h-[100px]"
                        disabled={isEvaluating}
                    />
                )}

                <button
                    type="submit"
                    className="btn btn-primary self-end mt-2"
                    disabled={!answer || isEvaluating}
                >
                    {isEvaluating ? "Checking..." : "Submit Answer"}
                </button>
            </form>
        </div>
    );
}
