"use client";
import { useTranslation } from "@/i18n/useTranslation";
import { Loader2, ArrowLeft, Check, X, Clock3, Sparkles } from "lucide-react";
import { useEffect, useState, use} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getLesson, TeacherLesson } from "@/lib/services/lessonService";
import { getAttempt, updateAttempt } from "@/lib/services/resultService";
import { getLessonQuestions } from "@/lib/services/questionService";
import { getLessonWebActivities } from "@/lib/services/webActivityService";
import { StudentAttempt } from "@/lib/schemas/result";
import { TeacherQuestion } from "@/lib/schemas/question";
import { WebActivity } from "@/lib/schemas/webActivity";
import { buildAttemptQuestionMap } from "@/lib/attemptQuestions";

const AiAnalysisBadge = ({ label, value }: { label: string, value?: string }) => {
  const { t } = useTranslation();
  if (!value) return null;
  const colors: Record<string, string> = {
    "Excellent": "bg-green-100 text-green-600",
    "Good": "bg-blue-100 text-blue-700",
    "Medium": "bg-amber-50 text-amber-600",
    "Weak": "bg-red-100 text-red-600",
    "Complete": "bg-green-100 text-green-600",
    "Partial": "bg-amber-50 text-amber-600",
    "None": "bg-red-100 text-red-600",
    "N/A": "bg-gray-100 text-gray-700"
  };
  const color = colors[value] || colors["N/A"];
  return (
    <div className="flex justify-between items-center bg-gray-100 p-2 rounded border border-gray-100 shadow-sm">
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${color}`}>{t("analysis." + value.replace("/", "").toLowerCase())}</span>
    </div>
  );
};

export default function TeacherAttemptReviewPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolvedParams = use(params);
  const { t } = useTranslation();
  const router = useRouter();
  const [attempt, setAttempt] = useState<StudentAttempt | null>(null);
  const [lesson, setLesson] = useState<TeacherLesson | null>(null);
  const [questions, setQuestions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const [manualScores, setManualScores] = useState<Record<string, string>>({});
  const [teacherComments, setTeacherComments] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const a = await getAttempt(resolvedParams.attemptId);
      if (a) {
        setAttempt(a);
        const l = await getLesson(a.lessonId);
        setLesson(l);
        
        const qs = await getLessonQuestions(a.lessonId);
        const ws = await getLessonWebActivities(a.lessonId);
        
        const qMap = buildAttemptQuestionMap(qs, ws);
        
        setQuestions(qMap);
        
        const initScores: Record<string, string> = {};
        const initComments: Record<string, string> = {};
        
        a.answers.forEach(ans => {
          if (ans.questionType === "WRITING") {
             initScores[ans.questionId] = (ans.writingSpeakingData?.reviewState === "PENDING_REVIEW" ? ans.writingSpeakingData.aiScore : ans.score)?.toString() || "";
             initComments[ans.questionId] = ans.writingSpeakingData?.teacherComment || "";
          }
          if (ans.questionType === "AI_CONVERSATION") {
             initScores[ans.questionId] = (ans.conversationData?.reviewState === "PENDING_REVIEW" ? ans.conversationData.aiScore : ans.score)?.toString() || "";
             initComments[ans.questionId] = ans.conversationData?.teacherComment || "";
          }
        });
        setManualScores(initScores);
        setTeacherComments(initComments);
      }
      setLoading(false);
    }
    load();
  }, [resolvedParams.attemptId]);

  if (loading) return <div className="py-12 flex flex-col items-center justify-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/40" /><p>{t("state.loading")}</p></div>;
  if (!attempt || !lesson) return <div className="text-center py-12 text-red-500">{t("review.attemptNotFound")}</div>;

  const handleGrade = async (questionId: string, isOverride: boolean) => {
    if (!attempt) return;
    setSavingId(questionId);

    const finalScore = parseFloat(manualScores[questionId] || "0");
    const comment = teacherComments[questionId] || "";
    
    const newAnswers = [...attempt.answers];
    const ansIndex = newAnswers.findIndex(a => a.questionId === questionId);
    
    if (ansIndex > -1) {
      if (newAnswers[ansIndex].questionType === "WRITING") {
        newAnswers[ansIndex].writingSpeakingData = {
          ...newAnswers[ansIndex].writingSpeakingData!,
          reviewState: "GRADED",
          finalScore,
          teacherOverride: isOverride,
          teacherComment: comment,
        };
        newAnswers[ansIndex].score = finalScore;
      } else if (newAnswers[ansIndex].questionType === "AI_CONVERSATION") {
        newAnswers[ansIndex].conversationData = {
          ...newAnswers[ansIndex].conversationData!,
          reviewState: "GRADED",
          finalScore,
          teacherComment: comment,
        };
        newAnswers[ansIndex].score = finalScore;
      }
    }

    const newTotalScore = newAnswers.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const stillPending = newAnswers.some(a => 
      a.writingSpeakingData?.reviewState === "PENDING_REVIEW" || 
      a.conversationData?.reviewState === "PENDING_REVIEW"
    );

    const updates = {
      answers: newAnswers,
      currentScore: newTotalScore,
      hasPendingReview: stillPending,
      status: "COMPLETED" as const,
    };

    await updateAttempt(attempt.id!, updates);
    setAttempt({ ...attempt, ...updates });
    setSavingId(null);
    setExpandedReviewId(null);
    router.refresh();
  };

  // If a specific review is expanded
  if (expandedReviewId) {
    const ans = attempt.answers.find(a => a.questionId === expandedReviewId)!;
    const q = questions[expandedReviewId] || {};
    const isWriting = ans.questionType === "WRITING";
    const isConversation = ans.questionType === "AI_CONVERSATION";
    const data = isWriting ? ans.writingSpeakingData : ans.conversationData;
    const maxScore = q.maxScore || 10;
    
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <button onClick={() => setExpandedReviewId(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" /> {t("review.backToAllQuestions")}
        </button>
        
        <div className="bg-gray-100 border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{isWriting ? t("review.writingReview") : t("review.conversationReview")}</h2>
            <p className="text-gray-600 mt-1">{q.question || t("review.topicPrefix") + q.topic}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t("review.studentOutput")}</h3>
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

          {data?.aiAnalysis && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-blue-700">{t("review.aiAnalysis")}</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <AiAnalysisBadge label={t("review.grammarLabel")} value={data.aiAnalysis.grammar} />
                <AiAnalysisBadge label={t("review.vocabularyLabel")} value={data.aiAnalysis.vocabulary} />
                <AiAnalysisBadge label={t("review.sentencesLabel")} value={data.aiAnalysis.sentenceStrength} />
                <AiAnalysisBadge label={t("review.relevanceLabel")} value={data.aiAnalysis.topicRelevance} />
                {data.aiAnalysis.targetGrammar && <AiAnalysisBadge label={t("review.targetGrammarLabel")} value={data.aiAnalysis.targetGrammar} />}
              </div>

              {data.aiAnalysis.requiredVocabulary && (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg border border-blue-50">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">{t("review.requiredVocabCheck")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.aiAnalysis.requiredVocabulary.used.map((w: string) => (
                      <span key={w} className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs font-medium border border-green-200 flex items-center gap-1"><Check className="w-3 h-3" /> {w}</span>
                    ))}
                    {data.aiAnalysis.requiredVocabulary.missed.map((w: string) => (
                      <span key={w} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium border border-red-200 flex items-center gap-1"><X className="w-3 h-3" /> {w}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-100 p-4 rounded-lg border border-blue-50">
                  <h4 className="text-sm font-bold text-green-600 mb-2">{t("review.strengths")}</h4>
                  <ul className="list-disc ps-4 space-y-1 text-sm text-gray-700">
                    {data.aiAnalysis.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg border border-blue-50">
                  <h4 className="text-sm font-bold text-orange-600 mb-2">{t("review.areasForImprovement")}</h4>
                  <ul className="list-disc ps-4 space-y-1 text-sm text-gray-700">
                    {data.aiAnalysis.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-blue-100">
                <p className="text-sm font-medium text-gray-500 mb-1">{t("review.aiFeedbackSummary")}</p>
                <p className="text-gray-800">{data.aiFeedback}</p>
                <p className="text-sm font-bold text-blue-700 mt-2">{t("review.suggestedScore", { score: data.aiScore || 0, maxScore })}</p>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t("review.teacherFinalDecision")}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">{t("review.teacherScoreLabel", { maxScore })}</label>
                <input 
                  type="number" min="0" max={maxScore}
                  value={manualScores[ans.questionId] !== undefined ? manualScores[ans.questionId] : (data?.aiScore || "")}
                  onChange={(e) => setManualScores(prev => ({ ...prev, [ans.questionId]: e.target.value }))}
                  className="w-32 p-2 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">{t("review.teacherCommentLabel")}</label>
                <textarea 
                  rows={3}
                  placeholder={t("review.teacherCommentPlaceholder")}
                  value={teacherComments[ans.questionId] || ""}
                  onChange={(e) => setTeacherComments(prev => ({ ...prev, [ans.questionId]: e.target.value }))}
                  className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                />
              </div>
              
              <div className="flex gap-4 pt-2">
                {parseFloat(manualScores[ans.questionId]) === data?.aiScore ? (
                  <button
                    disabled={savingId === ans.questionId}
                    onClick={() => handleGrade(ans.questionId, false)}
                    className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {savingId === ans.questionId ? t("state.saving") : t("review.approveAndSave")}
                  </button>
                ) : (
                  <button
                    disabled={savingId === ans.questionId || manualScores[ans.questionId] === ""}
                    onClick={() => handleGrade(ans.questionId, true)}
                    className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                  >
                    {savingId === ans.questionId ? t("state.saving") : t("review.overrideAndSave")}
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Summary View
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href={`/teacher/results/${lesson.id}/students/${attempt.studentId}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("student.attemptNumber", { number: attempt.attemptNumber ?? 1 })}</h1>
        </div>
      </div>

      <div className="bg-gray-100 border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <p className="text-sm text-gray-500 mb-1">{t("review.submittedAt")}</p>
           <p className="font-semibold text-gray-900">{new Date(attempt.timestamp).toLocaleString()}</p>
        </div>
        <div className="text-center">
           <p className="text-sm text-gray-500 mb-1">{attempt.hasPendingReview ? t("review.currentScore") : t("review.finalScore")}</p>
           <p className="text-3xl font-bold text-gray-900">{attempt.currentScore} <span className="text-lg text-gray-400">/ {attempt.maxScore}</span></p>
        </div>
        {attempt.hasPendingReview ? (
          <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-lg text-sm font-medium border border-orange-200 flex items-center gap-2">
            <Clock3 className="w-4 h-4" /> {t("result.pendingReview")}
          </div>
        ) : (
          <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg text-sm font-medium border border-green-200 flex items-center gap-2">
            <Check className="w-4 h-4" /> {t("review.graded")}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {attempt.answers.map((ans, idx) => {
          const q = questions[ans.questionId];
          if (!q) return null;
          const isWriting = ans.questionType === "WRITING";
          const isConversation = ans.questionType === "AI_CONVERSATION";
          const isReviewable = isWriting || isConversation;

          
          let isPending = false;
          const maxScore = q.maxScore || 10;

          if (isWriting) {
            isPending = ans.writingSpeakingData?.reviewState === "PENDING_REVIEW";
          } else if (isConversation) {
            isPending = ans.conversationData?.reviewState === "PENDING_REVIEW";
          }

          if (isReviewable) {
            // Shortened Card
            const data = isWriting ? ans.writingSpeakingData : ans.conversationData;
            return (
              <div key={ans.questionId} className="bg-gray-100 border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      {t("review.questionNumber", { number: idx + 1 })} - {ans.questionType.replace("_", " ")}
                    </span>
                    <p className="text-gray-900 font-medium line-clamp-1">{q.question || t("review.topicPrefix") + q.topic}</p>
                  </div>
                  {isPending ? (
                    <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0">
                      <Clock3 className="w-3 h-3" /> {t("review.pendingShort")}
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3" /> {t("review.reviewedShort")}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                  {isWriting ? (data as any)?.finalAnswerText : (ans.conversationData?.turns.find(t => t.speaker === "STUDENT")?.text || t("review.startedConversation"))}
                </p>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  {isPending ? (
                    <span className="text-sm text-gray-500">{t("review.awaitingFinalGrade")}</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-900">{t("review.scoreOf", { score: ans.score ?? 0, maxScore })}</span>
                  )}
                  <button onClick={() => setExpandedReviewId(ans.questionId)} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                    {t("review.viewReview")} <span className="rtl:hidden">&rarr;</span><span className="hidden rtl:inline">&larr;</span>
                  </button>
                </div>
              </div>
            );
          }

          // Normal MCQ / Boolean Card
          return (
            <div key={ans.questionId} className="bg-gray-100 border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {t("review.questionNumber", { number: idx + 1 })} - {ans.questionType.replace("_", " ")}
                  </span>
                  <p className="text-gray-900 font-medium">{q.question}</p>
                </div>
                <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  ans.isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}>
                  {ans.isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {ans.isCorrect ? t("review.correctShort") : t("review.wrongShort")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase mb-1">{t("review.studentAnswer")}</p>
                  <p className={`font-medium ${ans.isCorrect ? "text-green-600" : "text-red-600"}`}>{ans.selectedOption || t("review.noAnswer")}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase mb-1">{t("review.correctAnswer")}</p>
                  <p className="font-medium text-green-600">{q.correctAnswer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
