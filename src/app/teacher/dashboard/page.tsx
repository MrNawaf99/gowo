"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllLessonsForTeacher, TeacherLesson } from "@/lib/services/lessonService";
import { getLessonAttemptsForTeacher } from "@/lib/services/resultService";
import { getTeacherId } from "@/lib/config/auth";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { getLessonTitle } from "@/i18n/lessonTitle";

export default function DashboardPage() {
  const { t, locale } = useTranslation();
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [pendingReviews, setPendingReviews] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const teacherId = getTeacherId();
        if (!teacherId) {
          setLoading(false);
          return;
        }

        const data = await getAllLessonsForTeacher(teacherId);
        data.sort((a, b) => (b.orderIndex || 0) - (a.orderIndex || 0));
        setLessons(data);

        // Calculate student count and pending reviews across teacher's lessons
        try {
          const attemptsNested = await Promise.all(
            data.map((l) => getLessonAttemptsForTeacher(l.id).catch(() => []))
          );
          const allAttempts = attemptsNested.flat();
          const uniqueStudents = new Set(allAttempts.map((a) => a.studentId));
          setTotalStudents(uniqueStudents.size);

          const pending = allAttempts.filter((a) => a.hasPendingReview).length;
          setPendingReviews(pending);
        } catch {
          setTotalStudents(0);
          setPendingReviews(0);
        }
      } catch (err) {
        console.error("Failed to load dashboard lessons", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-gray-900">{t("nav.dashboard")}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">{t("teacher.totalLessons")}</p>
          <p className="text-3xl font-bold text-gray-900">{loading ? "-" : lessons.length}</p>
        </div>
        <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">{t("teacher.totalStudents")}</p>
          <p className="text-3xl font-bold text-gray-900">
            {loading || totalStudents === null ? "-" : totalStudents}
          </p>
        </div>
        <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">{t("teacher.pendingReviews")}</p>
          <p className="text-3xl font-bold text-gray-900">
            {loading || pendingReviews === null ? "-" : pendingReviews}
          </p>
        </div>
      </div>
      
      <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">{t("teacher.recentLessons")}</h2>
        
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" /> {t("state.loading")}
          </div>
        ) : lessons.length === 0 ? (
          <p className="text-gray-500 text-sm">{t("teacher.noLessonsCreated")}</p>
        ) : (
          <div className="space-y-3">
            {lessons.slice(0, 5).map((lesson) => (
              <div key={lesson.id} className="flex justify-between items-center p-3 hover:bg-gray-200 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                <span className="font-medium text-gray-900">{getLessonTitle(lesson, locale, t("student.untitledLesson"))}</span>
                <Link href={`/teacher/lessons/${lesson.id}/builder`} className="text-sm font-semibold text-primary hover:underline">
                  {t("common.edit")}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
