'use client';

import { useState } from 'react';
import { GrammarLesson } from '@/types/grammar';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

export default function QuizClient({ lesson }: { lesson: GrammarLesson }) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const question = lesson.questions[currentIndex];
  const totalQuestions = lesson.questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleOptionSelect = (option: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [question.id]: option }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setIsSubmitted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const calculateScore = () => {
    let score = 0;
    lesson.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) score++;
    });
    return score;
  };

  if (isSubmitted) {
    const score = calculateScore();
    const percentage = Math.round((score / totalQuestions) * 100);
    
    return (
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-gray-100 rounded-2xl p-8 shadow-sm border border-gray-400 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("grammar.quizResult")}</h2>
          <div className="text-5xl font-bold text-primary mb-2">{score} / {totalQuestions}</div>
          <p className="text-gray-500 mb-8">{t("grammar.percentage", { percentage })}</p>
          
          <div className="space-y-4 text-start mb-8">
            {lesson.questions.map((q, i) => {
              const userAnswer = answers[q.id];
              const isCorrect = userAnswer === q.correctAnswer;
              
              return (
                <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-500/40' : 'bg-red-50 border-red-500/40'}`}>
                  <div className="flex items-start gap-3">
                    {isCorrect ? <CheckCircle2 className="text-green-500 shrink-0" /> : <XCircle className="text-red-500 shrink-0" />}
                    <div>
                      <p className="font-bold mb-2" dir="ltr">{i + 1}. {q.text}</p>
                      <p className="text-sm mb-1">
                        <span className="text-gray-500">{t("results.yourAnswer")}: </span>
                        <span className={isCorrect ? 'text-green-500' : 'text-red-500 line-through'} dir="ltr">{userAnswer || t("results.noAnswer")}</span>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm mb-2">
                          <span className="text-gray-500">{t("results.correctAnswer")}: </span>
                          <span className="text-green-500 font-bold" dir="ltr">{q.correctAnswer}</span>
                        </p>
                      )}
                      <p className="text-sm text-blue-700 mt-2 bg-blue-50 p-2 rounded-lg">{q.explanationAr}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Link href="/" className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-primary/90 transition-colors">
            {t("grammar.backToList")}
          </Link>
        </div>
      </div>
    );
  }

  const selectedAnswer = answers[question.id];

  return (
    <div className="max-w-2xl mx-auto p-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          <span>{t("grammar.exit")}</span>
        </Link>
        <div className="text-sm font-bold bg-primary-container text-on-primary-container px-4 py-1 rounded-full">
          {t("quiz.questionProgress", { current: currentIndex + 1, total: totalQuestions })}
        </div>
      </div>

      <div className="bg-gray-100 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-400 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-8 text-start" dir="ltr">
          {question.text}
        </h2>

        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(option)}
                dir="ltr"
                className={`w-full text-start p-4 rounded-xl border-2 transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary-container text-on-primary-container font-bold' 
                    : 'border-gray-400 hover:border-primary/50 text-gray-900'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex-1 py-4 font-bold text-gray-900 bg-gray-200 rounded-xl disabled:opacity-50"
        >
          {t("quiz.previous")}
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedAnswer}
          className="flex-1 py-4 font-bold text-white bg-primary rounded-xl disabled:opacity-50"
        >
          {isLastQuestion ? t("grammar.finishQuiz") : t("quiz.next")}
        </button>
      </div>
    </div>
  );
}
