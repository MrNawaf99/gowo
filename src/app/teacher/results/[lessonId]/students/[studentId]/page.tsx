"use client";
import { useTranslation } from "@/i18n/useTranslation";
import { getLessonTitle } from "@/i18n/lessonTitle";
import { Loader2 } from "lucide-react";
import { } from "lucide-react";

import { useEffect, useState, use} from "react";
import Link from "next/link";
import { getLesson, TeacherLesson } from "@/lib/services/lessonService";
import { getStudentAttempts } from "@/lib/services/resultService";
import { StudentAttempt } from "@/lib/schemas/result";
import { ArrowLeft, Clock, Clock3, CheckCircle } from "lucide-react";

export default function TeacherStudentAttemptsPage({ params }: { params: Promise<{ lessonId: string, studentId: string }> }) {
  const resolvedParams = use(params);
  const { t, locale } = useTranslation();
  const [lesson, setLesson] = useState<TeacherLesson | null>(null);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const l = await getLesson(resolvedParams.lessonId);
      setLesson(l);
      const atts = await getStudentAttempts(resolvedParams.lessonId, resolvedParams.studentId);
      setAttempts(atts);
      setLoading(false);
    }
    load();
  }, [resolvedParams.lessonId, resolvedParams.studentId]);

  if (loading) return <div className="py-12 flex flex-col items-center justify-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/40" /><p>{t("state.loading")}</p></div>;
  if (!lesson) return <div className="text-center py-12 text-red-500">{t("review.lessonNotFound")}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/teacher/results/${lesson.id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("teacher.studentAttemptsTitle", { studentName: resolvedParams.studentId })}</h1>
          <p className="text-gray-500 text-sm">{getLessonTitle(lesson, locale, t("student.untitledLesson"))}</p>
        </div>
      </div>

      <div className="space-y-4">
        {attempts.map(attempt => (
          <div key={attempt.id} className="bg-gray-100 border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">{t("student.attemptNumber", { number: attempt.attemptNumber ?? 1 })}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(attempt.timestamp).toLocaleString()}</span>
                {attempt.hasPendingReview ? (
                  <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 rounded-full"><Clock3 className="w-3 h-3" /> {t("review.needsReview")}</span>
                ) : (
                  <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 rounded-full"><CheckCircle className="w-3 h-3" /> {t("review.fullyGraded")}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-end">
                <p className="text-sm text-gray-500">{t("builder.scoreLabel")}</p>
                <p className="font-bold text-lg text-gray-900">{attempt.currentScore} / {attempt.maxScore}</p>
              </div>
              <Link 
                href={`/teacher/results/attempts/${attempt.id}`}
                className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {t("review.reviewDetails")}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
