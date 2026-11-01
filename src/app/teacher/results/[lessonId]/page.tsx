"use client";
import { useTranslation } from "@/i18n/useTranslation";
import { getLessonTitle } from "@/i18n/lessonTitle";
import { Loader2 } from "lucide-react";
import { } from "lucide-react";

import { useEffect, useState, use} from "react";
import Link from "next/link";
import { getLesson, TeacherLesson } from "@/lib/services/lessonService";
import { getLessonAttemptsForTeacher } from "@/lib/services/resultService";
import { StudentAttempt } from "@/lib/schemas/result";
import { ArrowLeft, UserCircle } from "lucide-react";

export default function TeacherLessonResultsPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const resolvedParams = use(params);
  const { t, locale } = useTranslation();
  const [lesson, setLesson] = useState<TeacherLesson | null>(null);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const l = await getLesson(resolvedParams.lessonId);
      setLesson(l);
      const atts = await getLessonAttemptsForTeacher(resolvedParams.lessonId);
      setAttempts(atts);
      setLoading(false);
    }
    load();
  }, [resolvedParams.lessonId]);

  if (loading) return <div className="py-12 flex flex-col items-center justify-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/40" /><p>{t("state.loading")}</p></div>;
  if (!lesson) return <div className="text-center py-12 text-red-500">{t("review.lessonNotFound")}</div>;

  // Group attempts by student
  const studentMap: Record<string, StudentAttempt[]> = {};
  attempts.forEach(a => {
    if (!studentMap[a.studentId]) studentMap[a.studentId] = [];
    studentMap[a.studentId].push(a);
  });

  const students = Object.entries(studentMap).map(([studentId, atts]) => ({
    studentId,
    attempts: atts.sort((a, b) => b.timestamp - a.timestamp), // latest first
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/results" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("teacher.lessonStudentsTitle", { title: getLessonTitle(lesson, locale, t("student.untitledLesson")) })}</h1>
          <p className="text-gray-500 text-sm">{t("teacher.totalAttempts", { count: attempts.length })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-gray-100 border border-gray-200 rounded-xl border-dashed">
            {t("teacher.noStudentAttempts")}
          </div>
        ) : (
          students.map(s => (
            <Link key={s.studentId} href={`/teacher/results/${lesson.id}/students/${s.studentId}`} className="bg-gray-100 border border-gray-200 p-6 rounded-2xl shadow-sm hover:border-primary hover:shadow-md transition-all flex items-center gap-4">
              <UserCircle className="w-10 h-10 text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900">{s.studentId}</h3>
                <p className="text-sm text-gray-500">{t("teacher.attemptsCount", { count: s.attempts.length })}</p>
                <p className="text-xs text-gray-400 mt-1">{t("teacher.latestAttempt", { number: s.attempts[0].attemptNumber ?? 1 })}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
