"use client";

import { use, useEffect, useState } from "react";
import { buildAttemptQuestionMap } from "@/lib/attemptQuestions";
import { getAttempt } from "@/lib/services/resultService";
import { StudentAttempt } from "@/lib/schemas/result";
import { getLesson, TeacherLesson } from "@/lib/services/lessonService";
import { getLessonQuestions } from "@/lib/services/questionService";
import { getLessonWebActivities } from "@/lib/services/webActivityService";
import { ArrowLeft, Check, X, Clock3, AlertCircle, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";

export default function StudentAttemptReviewPage({ params }: { params: Promise<{ lessonId: string, attemptId: string }> }) {
  const resolvedParams = use(params);
  const { t } = useTranslation();
  const [lesson, setLesson] = useState<TeacherLesson | null>(null);
  const [attempt, setAttempt] = useState<StudentAttempt | null>(null);
  const [questions, setQuestions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const l = await getLesson(resolvedParams.lessonId);
      if (!l) return;
      setLesson(l);
      const a = await getAttempt(resolvedParams.attemptId);
      setAttempt(a);
      
      const qs = await getLessonQuestions(resolvedParams.lessonId);
      const ws = await getLessonWebActivities(resolvedParams.lessonId);
      
      const qMap = buildAttemptQuestionMap(qs, ws);
      
      setQuestions(qMap);
      setLoading(false);
    }
    load();
  }, [resolvedParams.lessonId, resolvedParams.attemptId]);

  if (loading) return <div className="text-center py-12"><p className="text-gray-500 font-medium animate-pulse">{t("results.loadingAttempt")}</p></div>;
  if (!attempt || !lesson) return <div className="text-center py-12"><p className="text-red-500 font-medium">{t("results.attemptNotFound")}</p></div>;

  const hasPending = attempt.hasPendingReview;
  // "Results: After Review" means reveal once the teacher has finished reviewing,
  // not hide forever - otherwise an approved grade and teacher comment could
  // never reach the student.
  const showAnswers = lesson.showAnswersImmediately !== false || !hasPending;
  const showResult = lesson.showResultToStudent !== false;

  let gradedScore = 0;
  let gradedMaxScore = 0;
  let pendingMaxScore = 0;

  attempt.answers.forEach(ans => {
    const q = questions[ans.questionId];
    if (!q) return;
        const maxScore = q.maxScore || 10;
    const isWriting = ans.questionType === "WRITING";
    const isConversation = ans.questionType === "AI_CONVERSATION";
    const isPending = (isWriting && ans.writingSpeakingData?.reviewState === "PENDING_REVIEW") || 
                      (isConversation && ans.conversationData?.reviewState === "PENDING_REVIEW");
    
    if (isPending) {
      pendingMaxScore += maxScore;
    } else {
      gradedMaxScore += maxScore;
      gradedScore += (ans.score || 0);
    }
  });

  if (expandedReviewId) {
    const ans = attempt.answers.find(a => a.questionId === expandedReviewId)!;
    const q = questions[expandedReviewId] || {};
    const isWriting = ans.questionType === "WRITING";
    const data = isWriting ? ans.writingSpeakingData : ans.conversationData;
    const isPending = data?.reviewState !== "GRADED";
    const maxScore = q.maxScore || 10;
    
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <button onClick={() => setExpandedReviewId(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" /> {t("review.backToAllQuestions")}
        </button>
        
        <div className="bg-gray-100 border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{isWriting ? t("results.writingReview") : t("results.conversationReview")}</h2>
            <p className="text-gray-600 mt-1">{q.question || t("results.topic") + q.topic}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t("results.yourOutput")}</h3>
            {isWriting ? (
              <p className="text-gray-900 whitespace-pre-wrap">{(data as any)?.finalAnswerText}</p>
            ) : (
              <div className="space-y-3">
                {ans.conversationData?.turns.map((turn, tIdx) => (
                  <div key={tIdx} className={`p-3 rounded-lg w-fit max-w-[85%] ${turn.speaker === "STUDENT" ? "bg-blue-50 text-blue-700 ms-auto" : "bg-gray-200 text-gray-900"}`}>
                    <p className="text-[10px] font-bold mb-1 opacity-60 uppercase">{turn.speaker === "STUDENT" ? t("review.speakerStudent") : t("review.speakerAi")}</p>
                    <p className="text-sm">{turn.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isPending ? (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center text-orange-600">
              <Clock3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">{t("results.pendingTeacherReview")}</p>
              <p className="text-sm mt-1 opacity-80">{t("results.checkBackLater")}</p>
            </div>
          ) : !showAnswers ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center text-blue-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">{t("results.feedbackHidden")}</p>
            </div>
          ) : (
            <div className="space-y-6 border-t border-gray-100 pt-6 mt-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t("result.finalScore")}</h3>
                <div className="inline-flex items-center justify-center px-4 py-2 bg-green-50 text-green-600 rounded-lg border border-green-200">
                  <span className="text-2xl font-bold me-1">{ans.score}</span> 
                  <span className="text-sm font-medium">/ {maxScore}</span>
                </div>
              </div>

              {data?.teacherComment && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-primary">{t("result.teacherComment")}</h3>
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap">{data.teacherComment}</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/lessons/${lesson.id}`} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 rtl:rotate-180" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{t("results.attemptReviewTitle", { attemptNumber: attempt.attemptNumber ?? 1 })}</h1>
      </div>

      <div className="bg-gray-100 border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t("results.quizSubmitted")}</h2>
          <p className="text-gray-500 text-sm mt-1">{new Date(attempt.timestamp).toLocaleString()}</p>
          
          {hasPending && (
            <div className="mt-4 flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-lg text-sm font-medium border border-orange-200/50 shadow-sm">
              <Clock3 className="w-4 h-4 shrink-0" />
              {t("results.underReviewNotice")}
            </div>
          )}
        </div>

        {showResult ? (
          <div className="flex gap-4">
            <div className="text-center bg-gray-50 px-6 py-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{t("result.currentScore")}</p>
              <p className="text-3xl font-bold text-gray-900">
                {gradedScore} <span className="text-lg text-gray-500">/ {gradedMaxScore} {t("results.graded")}</span>
              </p>
            </div>
            
            <div className="text-center bg-gray-50 px-6 py-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{t("result.finalScore")}</p>
              <p className="text-3xl font-bold text-gray-900">
                {hasPending ? (
                  <span className="text-orange-500 text-2xl">{t("state.pending")}</span>
                ) : (
                  <>{gradedScore} <span className="text-lg text-gray-500">/ {gradedMaxScore}</span></>
                )}
              </p>
              {hasPending && <p className="text-xs text-orange-600 font-medium mt-1">({t("results.pointsPendingCount", { count: pendingMaxScore })})</p>}
            </div>
          </div>
        ) : (
          <div className="text-center bg-gray-50 px-6 py-4 rounded-xl border border-gray-200 flex items-center gap-2 shadow-sm">
            <AlertCircle className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600 font-medium">{t("results.resultsHidden")}</span>
          </div>
        )}
      </div>

      {!showAnswers && (
        <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm font-medium flex items-center gap-2 border border-blue-100/50 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {t("results.feedbackAndAnswersHidden")}
        </div>
      )}

      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-bold text-gray-900">{t("results.allQuestions")}</h3>
        {attempt.answers.map((ans, idx) => {
          const q = questions[ans.questionId];
          if (!q) return null;
          
          const isWriting = ans.questionType === "WRITING";
          const isConversation = ans.questionType === "AI_CONVERSATION";
          const isReviewable = isWriting || isConversation;

          
          if (isReviewable) {
            const data = isWriting ? ans.writingSpeakingData : ans.conversationData;
            const isPending = data?.reviewState !== "GRADED";
            
            return (
              <div key={ans.questionId} className="bg-gray-100 border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      {t("review.questionNumber", { number: idx + 1 })} - {ans.questionType.replace("_", " ")}
                    </span>
                    <p className="text-gray-900 font-medium line-clamp-1">{q.question || t("results.topic") + q.topic}</p>
                  </div>
                  {isPending ? (
                    <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0">
                      <Clock3 className="w-3 h-3" /> {t("review.pendingShort")}
                    </span>
                  ) : (
                    showAnswers && <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3" /> {t("review.reviewedShort")}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                  {isWriting ? (data as any)?.finalAnswerText : (ans.conversationData?.turns.find(t => t.speaker === "STUDENT")?.text || t("review.startedConversation"))}
                </p>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  {isPending ? (
                    <span className="text-sm text-gray-500">{t("results.awaitingFinalGrade")}</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-900">{t("result.score")}: {ans.score} / {q.maxScore || 10}</span>
                  )}
                  <button onClick={() => setExpandedReviewId(ans.questionId)} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                    {t("results.viewReview")} <span className="rtl:hidden">&rarr;</span><span className="hidden rtl:inline">&larr;</span>
                  </button>
                </div>
              </div>
            );
          }

          // MCQ
          return (
            <div key={ans.questionId} className="bg-gray-100 border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {t("review.questionNumber", { number: idx + 1 })} - {ans.questionType.replace("_", " ")}
                  </span>
                  <p className="text-gray-900 font-medium">{q.question}</p>
                </div>
                {showAnswers && (
                  <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    ans.isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  }`}>
                    {ans.isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {ans.isCorrect ? t("review.correctShort") : t("review.wrongShort")}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase mb-1">{t("results.yourAnswer")}</p>
                  <p className={`font-medium ${ans.isCorrect && showAnswers ? "text-green-600" : (showAnswers ? "text-red-600" : "text-gray-900")}`}>{ans.selectedOption || t("results.noAnswer")}</p>
                </div>
                {showAnswers && !ans.isCorrect && (
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase mb-1">{t("results.correctAnswer")}</p>
                    <p className="font-medium text-green-600">{q.correctAnswer}</p>
                  </div>
                )}
              </div>
              {showAnswers && q.explanationArabic && (
                <div className="mt-3 bg-blue-50 p-3 rounded-lg text-sm text-blue-500">
                  <p className="font-semibold text-xs mb-1 uppercase">{t("results.explanation")}</p>
                  <p>{q.explanationArabic}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
