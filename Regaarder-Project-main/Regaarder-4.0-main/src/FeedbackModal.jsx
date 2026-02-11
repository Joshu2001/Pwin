import React, { useState } from 'react';
import { X, Star, Send } from 'lucide-react';

export default function FeedbackModal({ isOpen, onClose, onSubmit, title, questions = [] }) {
    if (!isOpen) return null;

    const [answers, setAnswers] = useState({});

    const handleAnswerDate = (id, value) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = () => {
        onSubmit(answers);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 className="text-lg font-bold text-gray-900">{title || 'Feedback'}</h3>
                    <button 
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/50 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                    {questions.map((q) => (
                        <div key={q.id} className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-800">
                                {q.label}
                            </label>
                            
                            {q.type === 'likert' && (
                                <div className="flex items-center justify-between gap-2 px-2">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                        <button
                                            key={rating}
                                            onClick={() => handleAnswerDate(q.id, rating)}
                                            className={`
                                                flex flex-col items-center gap-1 group transition-all
                                                ${answers[q.id] === rating ? 'scale-110' : 'hover:scale-105'}
                                            `}
                                        >
                                            <div className={`
                                                w-10 h-10 rounded-full flex items-center justify-center shadow-sm border
                                                transition-all duration-200
                                                ${answers[q.id] === rating 
                                                    ? 'bg-yellow-400 border-yellow-500 text-white' 
                                                    : 'bg-gray-50 border-gray-200 text-gray-400 group-hover:border-yellow-300 group-hover:text-yellow-300'}
                                            `}>
                                                <Star className={answers[q.id] === rating ? 'fill-current' : ''} size={20} />
                                            </div>
                                            <span className="text-[10px] font-medium text-gray-500">
                                                {rating === 1 ? 'Poor' : rating === 5 ? 'Great' : rating}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                             {q.type === 'yesno' && (
                                <div className="flex gap-3">
                                    {['Yes', 'No'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => handleAnswerDate(q.id, opt)}
                                            className={`
                                                flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all
                                                ${answers[q.id] === opt
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
                                            `}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {q.type === 'text' && (
                                <textarea
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm min-h-[80px] resize-y bg-gray-50 focus:bg-white"
                                    placeholder={q.placeholder || "Your answer..."}
                                    value={answers[q.id] || ''}
                                    onChange={(e) => handleAnswerDate(q.id, e.target.value)}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
                    >
                        <span>Submit Feedback</span>
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
