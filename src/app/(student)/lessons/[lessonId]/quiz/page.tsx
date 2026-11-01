"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { getLesson, TeacherLesson } from "@/lib/services/lessonService";
import { getLessonQuestions } from "@/lib/services/questionService";
import { saveAttempt, getStudentAttempts } from "@/lib/services/resultService";
import { TeacherQuestion } from "@/lib/schemas/question";
import { AnswerData, WritingSpeakingResult } from "@/lib/schemas/result";
import { ArrowLeft, CheckCircle, AlertTriangle, BookOpen, Play } from "lucide-react";
import WritingSpeakingActivity from "@/components/quiz/WritingSpeakingActivity";
import AiConversationActivity from "@/components/quiz/AiConversationActivity";
import AiAudioActivity from "@/components/quiz/AiAudioActivity";
import { useTranslation } from "@/i18n/useTranslation";
import { getStudentId } from "@/lib/config/auth";

export default function StudentQuizPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { t } = useTranslation();
  
  const [lesson, setLesson] = useState<TeacherLesson | null>(null);
  const [questions, setQuestions] = useState<TeacherQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerData>>({});

  useEffect(() => {
    const saved = localStorage.getItem("quiz_draft_" + resolvedParams.lessonId);
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch {}
    }
  }, [resolvedParams.lessonId]);

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem("quiz_draft_" + resolvedParams.lessonId, JSON.stringify(answers));
    }
  }, [answers, resolvedParams.lessonId]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const isSubmittingRef = useRef(false);

  const [loadError, setLoadError] = useState("");
  const [priorAttempts, setPriorAttempts] = useState(0);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const l = await getLesson(resolvedParams.lessonId);
      setLesson(l);
      const qs = await getLessonQuestions(resolvedParams.lessonId);
      setQuestions(qs.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
      const prior = await getStudentAttempts(resolvedParams.lessonId, getStudentId());
      setPriorAttempts(prior.length);
    } catch (error) {
      console.error("Failed to load quiz:", error);
      setLoadError(t("quiz.errLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, [resolvedParams.lessonId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium animate-pulse">{t("quiz.preparing")}</p>
    </div>
  );

  if (loadError) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 p-4 text-center">
      <AlertTriangle className="w-12 h-12 text-red-500" />
      <p className="text-gray-900 font-medium">{loadError}</p>
      <button 
        onClick={loadQuiz}
        className="px-6 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors"
      >
        {t("common.retry")}
      </button>
    </div>
  );
  
  if (!lesson || questions.length === 0) return <div className="text-center py-12 text-red-500">{t("quiz.notAvailable")}</div>;

  const currentQ = questions[currentIndex];
  const progressPct = ((currentIndex + 1) / questions.length) * 100;
  const isReading = currentQ.questionType.includes("READING");

  const handleSelectOption = (qId: string, opt: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], questionId: qId, selectedOption: opt, questionType: currentQ.questionType }
    }));
  };
  
  const handleAiAudioChange = (subId: string, opt: string) => {
    setAnswers(prev => ({
      ...prev,
      [subId]: { ...prev[subId], questionId: subId, selectedOption: opt, questionType: "AI_AUDIO_SUB" }
    }));
  };

  const handleConversationChange = (qId: string, res: any) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], questionId: qId, questionType: "AI_CONVERSATION", conversationData: res }
    }));
  };

  const handleWritingSpeakingChange = (qId: string, res: WritingSpeakingResult) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], questionId: qId, questionType: currentQ.questionType, writingSpeakingData: res }
    }));
  };

  const isAnswered = (q: TeacherQuestion) => {
    if (q.questionType === "AI_AUDIO") {
      const subQs = (q as unknown as { questions: {id: string, type: string, correctAnswer: string}[] }).questions || [];
      return subQs.every((subQ: {id: string}) => !!answers[`${q.id}_${subQ.id}`]?.selectedOption);
    }
    
    const ans = answers[q.id!];
    if (!ans) return false;
    
    if ((q.questionType as string) === "AI_CONVERSATION") {
      const conv = ans.conversationData;
      if (!conv) return false;
      const maxTurns = (q as any).aiReplies || 11;
      const aiTurns = conv.turns.filter((t: any) => t.speaker === "AI").length;
      return aiTurns >= maxTurns;
    } else if (q.questionType === "WRITING") {
      const req = 'requiredCharacterCount' in q ? (q.requiredCharacterCount as number) : 0;
      const text = ans.writingSpeakingData?.finalAnswerText;
      if (!text) return false;
      if (req > 0 && text.length < req) return false;
      return true;
    }
    return !!ans.selectedOption;
  };

  const allAnswered = questions.every(isAnswered);

  const handleSubmit = async () => {
    if (!lesson) return;
    if (isSubmittingRef.current) return;
    const maxAttempts = lesson.maxAttempts || 0;
    if (maxAttempts > 0 && priorAttempts >= maxAttempts) {
      setSubmitError(t("student.noAttemptsLeft"));
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      let currentScore = 0;
      let maxScore = 0;
      let hasPendingReview = false;
      
      const attemptId = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

      const finalAnswers = [...questions.flatMap(q => {
        if (q.questionType === "AI_AUDIO") {
          return ((q.questions as {id: string, type: string, correctAnswer: string}[]) || []).map((subQ) => {
            const subId = `${q.id}_${subQ.id}`;
            const ans = answers[subId] || { questionId: subId, questionType: subQ.type };
            const mappedQ = {
              ...q,
              id: subId,
              questionType: subQ.type === "MCQ" ? "AUDIO_MCQ" : "AUDIO_TRUE_FALSE",
              maxScore: 1,
              correctAnswer: subQ.correctAnswer
            };
            return { ...ans, q: mappedQ as unknown as TeacherQuestion };
          });
        }
        const ans = answers[q.id!] || { questionId: q.id!, questionType: q.questionType };
        return { ...ans, q }; 
      })];

      const processedAnswers: AnswerData[] = [];
      
      for (const ans of finalAnswers) {
        const q = ans.q;

        maxScore += q.maxScore || 1;
        
        if ((q.questionType as string) === "AI_CONVERSATION") {
          hasPendingReview = true;
          if (!ans.conversationData) ans.conversationData = { turns: [] } as any;
          ans.conversationData!.reviewState = "PENDING_REVIEW";
        } else if (q.questionType === "WRITING") {
          hasPendingReview = true;
          if (!ans.writingSpeakingData) ans.writingSpeakingData = {} as any;
          ans.writingSpeakingData!.reviewState = "PENDING_REVIEW";
        } else {
          if (ans.selectedOption === q.correctAnswer) {
            currentScore += q.maxScore || 1;
            ans.isCorrect = true;
            ans.score = q.maxScore || 1;
          } else {
            ans.isCorrect = false;
            ans.score = 0;
          }
        }
        
        const { q: _, ...cleanAnswer } = ans as any;
        processedAnswers.push(cleanAnswer as AnswerData);
      }

      await saveAttempt({
        id: attemptId,
        studentId: getStudentId(),
        lessonId: resolvedParams.lessonId,
        teacherId: lesson.teacherId,
        attemptNumber: priorAttempts + 1,
        timestamp: Date.now(),
        currentScore,
        maxScore,
        hasPendingReview,
        status: "COMPLETED",
        answers: processedAnswers
      });

      localStorage.removeItem("quiz_draft_" + resolvedParams.lessonId);
      router.push(`/lessons/${resolvedParams.lessonId}/attempts/${attemptId}`);
    } catch (error) {
      console.error("Submit failed:", error);
      setSubmitError(t("quiz.errSubmitFailed"));
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar with Progress */}
      <div className="bg-gray-100 rounded-3xl p-4 md:p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between gap-4 mb-4">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t("nav.back")}
          </button>
          
          <span className="text-sm font-bold text-gray-700 bg-gray-200 px-3 py-1 rounded-full">
            {t("quiz.questionProgress", { current: currentIndex + 1, total: questions.length })}
          </span>
        </div>

        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reading Passage Panel (if applicable) */}
        {isReading && (
          <div className="lg:col-span-5 bg-gray-100 rounded-3xl p-6 border border-gray-200 shadow-sm h-fit">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> {t("quiz.readingPassage")}
            </h4>
            <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100 whitespace-pre-line leading-relaxed">
              {lesson.readingPassage || t("quiz.noPassage")}
            </div>
          </div>
        )}

        {/* Question Content Panel */}
        <div className={isReading ? "lg:col-span-7" : "lg:col-span-12"}>
          <div className="bg-gray-100 rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm flex flex-col justify-between min-h-[450px]">
            <div>
              {currentQ.questionType === "AI_AUDIO" ? (
                <AiAudioActivity 
                  activity={currentQ}
                  answers={answers}
                  onChange={handleAiAudioChange}
                />
              ) : currentQ.questionType === "AI_CONVERSATION" ? (
                <AiConversationActivity 
                  activity={currentQ} 
                  initialValue={answers[currentQ.id!]?.conversationData}
                  onChange={(res) => handleConversationChange(currentQ.id!, res)}
                />
              ) : currentQ.questionType === "WRITING" ? (
                <WritingSpeakingActivity 
                  question={currentQ} 
                  initialValue={answers[currentQ.id!]?.writingSpeakingData}
                  onChange={(res) => handleWritingSpeakingChange(currentQ.id!, res)}
                />
              ) : (
                <div className="space-y-8">
                  {currentQ.audioUrl && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 md:p-5">
                      <p className="text-sm font-semibold text-blue-500 mb-3 flex items-center gap-2">
                        <Play className="w-4 h-4 fill-current" /> {t("quiz.listenBeforeAnswering")}
                      </p>
                      <audio controls src={currentQ.audioUrl} className="w-full h-11" />
                    </div>
                  )}
                  
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                    {currentQ.question}
                  </h3>
                  
                  <div className="space-y-3">
                    {currentQ.questionType.includes("MULTIPLE_CHOICE") ? (
                      JSON.parse(currentQ.optionsJson || "[]").map((opt: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleSelectOption(currentQ.id!, opt)}
                          className={`w-full text-start px-5 py-4 rounded-2xl border-2 transition-all duration-200 text-base md:text-lg ${
                            answers[currentQ.id!]?.selectedOption === opt 
                            ? "border-primary bg-primary/5 font-bold text-primary shadow-sm" 
                            : "border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))
                    ) : (
                      ["True", "False"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleSelectOption(currentQ.id!, opt)}
                          className={`w-full text-start px-5 py-4 rounded-2xl border-2 transition-all duration-200 text-base md:text-lg ${
                            answers[currentQ.id!]?.selectedOption === opt 
                            ? "border-primary bg-primary/5 font-bold text-primary shadow-sm" 
                            : "border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <button 
                onClick={() => setCurrentIndex(c => Math.max(0, c - 1))}
                disabled={currentIndex === 0}
                className="px-6 py-3.5 rounded-2xl font-semibold text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200 disabled:opacity-40 transition-all shadow-sm"
              >
                {t("quiz.previous")}
              </button>

              {currentIndex === questions.length - 1 ? (
                <button 
                  onClick={() => setShowConfirm(true)}
                  className="px-8 py-3.5 rounded-2xl font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm shadow-primary/30 flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> {t("quiz.submitQuiz")}
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentIndex(c => Math.min(questions.length - 1, c + 1))}
                  className="px-8 py-3.5 rounded-2xl font-bold text-gray-100 bg-gray-900 hover:bg-gray-800 transition-all shadow-sm"
                >
                  {t("quiz.nextQuestion")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-100 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{t("quiz.submitTitle")}</h3>
            <p className="text-gray-500 mb-6">{t("quiz.submitDesc")}</p>
            
            {submitError && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex gap-3 text-sm mb-6">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>{submitError}</p>
              </div>
            )}

            {!allAnswered && (
              <div className="bg-orange-50 border border-orange-100 text-orange-700 p-4 rounded-2xl flex gap-3 text-sm mb-6">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>{t("quiz.unansweredWarning")}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => { setShowConfirm(false); setSubmitError(""); }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
              >
                {t("quiz.keepReviewing")}
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center"
              >
                {isSubmitting ? t("state.submitting") : t("quiz.yesSubmit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
