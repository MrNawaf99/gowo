"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { getLessonTitle } from "@/i18n/lessonTitle";
import { getLesson, TeacherLesson } from "@/lib/services/lessonService";
import { getStudentAttempts } from "@/lib/services/resultService";
import { getLessonQuestions } from "@/lib/services/questionService";
import { StudentAttempt } from "@/lib/schemas/result";
import { ArrowLeft, Play, Clock, CheckCircle, Clock3, Calendar, GraduationCap, Lock } from "lucide-react";
// No format needed

import { getTeacherId, getStudentId, getStudentName  } from "@/lib/config/auth";



export default function StudentLessonDetailsPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { t, locale } = useTranslation();
  const resolvedParams = use(params);
  const [lesson, setLesson] = useState<TeacherLesson | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const l = await getLesson(resolvedParams.lessonId);
        setLesson(l);
        
        if (l) {
          const qs = await getLessonQuestions(resolvedParams.lessonId);
          setQuestionCount(qs.length);

          const pastAttempts = await getStudentAttempts(resolvedParams.lessonId, getStudentId());
          setAttempts(pastAttempts);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.lessonId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium">{t("state.loading")}</p>
    </div>
  );
  if (!lesson) return <div className="text-center py-12 text-red-500 font-medium">{t("student.lessonNotFound")}</div>;

  const maxAttempts = lesson.maxAttempts || 0;
  const currentAttempts = attempts.length;
  const isUnlimited = maxAttempts === 0;
  const remaining = isUnlimited ? t("student.unlimited") : Math.max(0, maxAttempts - currentAttempts);
  const canAttempt = isUnlimited || currentAttempts < maxAttempts;

  return (
    <div className="w-full space-y-8 animate-in fade-in">
      <div className="flex items-center gap-3">
        <Link href={`/teachers/${lesson.teacherId}`} className="p-2 -ms-2 hover:bg-gray-100 rounded-full transition-colors active:bg-gray-200">
          <ArrowLeft className="w-6 h-6 text-gray-800 rtl:rotate-180" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{getLessonTitle(lesson, locale, t("student.untitledLesson"))}</h1>
      </div>

      <div className="bg-gray-100 border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center sm:items-start text-center sm:text-start">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{t("student.questions")}</p>
            <p className="text-2xl font-extrabold text-gray-900">{questionCount}</p>
          </div>
          <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center sm:items-start text-center sm:text-start">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{t("student.timeLimit")}</p>
            <p className="text-2xl font-extrabold text-gray-900">{lesson.maxTimeMinutes === 0 ? t("student.none") : `${lesson.maxTimeMinutes}m`}</p>
          </div>
          <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center sm:items-start text-center sm:text-start">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{t("student.totalAttempts")}</p>
            <p className="text-2xl font-extrabold text-gray-900">{isUnlimited ? t("student.unlimited") : maxAttempts}</p>
          </div>
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex flex-col items-center sm:items-start text-center sm:text-start">
            <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">{t("student.remaining")}</p>
            <p className={`text-2xl font-extrabold ${canAttempt ? "text-primary" : "text-red-500"}`}>{remaining}</p>
          </div>
        </div>

        <div className="flex justify-center sm:justify-start">
          {canAttempt ? (
            <Link 
              href={`/lessons/${lesson.id}/quiz`}
              className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md hover:shadow-lg shadow-primary/30"
            >
              {t("student.startQuiz")} <Play className="w-5 h-5 fill-current" />
            </Link>
          ) : (
            <div className="bg-red-50 text-red-700 px-6 py-4 rounded-2xl font-bold border border-red-100 text-center w-full flex items-center justify-center gap-2">
              <Lock className="w-5 h-5" /> {t("student.noAttemptsLeft")}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-gray-400" /> {t("student.yourAttempts")}
        </h2>
        {attempts.length === 0 ? (
          <div className="bg-gray-100 border border-gray-100 rounded-3xl p-8 text-center shadow-sm">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">{t("student.notTakenYet")}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="bg-gray-100 border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm hover:border-primary/30 transition-all">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{t("student.attemptNumber", { number: attempt.attemptNumber ?? 1 })}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                      <Calendar className="w-4 h-4" /> {new Date(attempt.timestamp).toLocaleString()}
                    </span>
                    {attempt.hasPendingReview ? (
                      <span className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                        <Clock3 className="w-4 h-4" /> {t("results.pendingTeacherReview")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">
                        <CheckCircle className="w-4 h-4" /> {t("review.graded")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full pt-4 sm:pt-0 border-t border-gray-50 sm:border-none">
                  <div className="text-start sm:text-end">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{t("student.score")}</p>
                    {lesson.showResultToStudent ? (
                      <p className="font-extrabold text-2xl text-gray-900 leading-none">
                        {attempt.currentScore} <span className="text-base text-gray-400 font-medium">/ {attempt.maxScore}</span>
                      </p>
                    ) : (
                      <p className="font-medium text-sm text-gray-400 italic mt-1 bg-gray-50 px-2 py-0.5 rounded">{t("student.hidden")}</p>
                    )}
                  </div>
                  <Link 
                    href={`/lessons/${lesson.id}/attempts/${attempt.id}`}
                    className="px-5 py-2.5 bg-gray-50 hover:bg-primary/10 text-gray-700 hover:text-primary rounded-xl text-sm font-bold transition-colors"
                  >
                    {t("results.viewReview")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
