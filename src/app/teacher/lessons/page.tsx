"use client";
import { Loader2 } from "lucide-react";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, BookOpen, Clock, Users, MoreVertical, RefreshCw, } from "lucide-react";
import {
  getAllLessonsForTeacher,
  TeacherLesson,
  deleteLesson,
} from "@/lib/services/lessonService";

import { getTeacherId, getStudentId, getStudentName  } from "@/lib/config/auth";
import { useTranslation } from "@/i18n/useTranslation";
import { getLessonTitle } from "@/i18n/lessonTitle";



export default function LessonsPage() {
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, locale } = useTranslation();

  const fetchLessons = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllLessonsForTeacher(getTeacherId());
      setLessons(data);
    } catch (err) {
      console.error("Failed to load lessons:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to load lessons.";

      setError(message);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLessons();
  }, []);

  const handleDelete = async (lessonId: string) => {
    if (!window.confirm(t("common.confirm"))) return;
    try {
      await deleteLesson(lessonId);
      setLessons(prev => prev.filter(l => l.id !== lessonId));
    } catch (err) {
      console.error(err);
      alert(t("state.error"));
    }
  };


  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("nav.lessons")}</h1>

        <Link
          href="/teacher/lessons/create"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          {t("common.createLesson")}
        </Link>
      </div>

      {loading ? (
        <div className="bg-gray-100 rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t("state.loadingLessons")}</p>
        </div>
      ) : error ? (
        <div className="bg-gray-100 rounded-xl border border-red-200 shadow-sm p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            !
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("state.failedToLoad")}
          </h3>

          <p className="text-gray-500 mb-2">
            {t("state.error")}
          </p>

          <p className="text-xs text-red-500 mb-6 break-words">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void fetchLessons()}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {t("common.retry")}
          </button>
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-gray-100 rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("state.noResults")}
          </h3>

          <p className="text-gray-500 mb-6">
            {t("state.noLessonsDesc")}
          </p>

          <Link
            href="/teacher/lessons/create"
            className="inline-flex items-center gap-2 bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium shadow-sm"
          >
            {t("common.createLesson")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-gray-100 border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col group"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      lesson.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {lesson.isPublished ? t("builder.published") : t("builder.draft")}
                  </span>

                  
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {getLessonTitle(lesson, locale, t("student.untitledLesson"))}
                </h3>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {lesson.maxTimeMinutes
                      ? `${lesson.maxTimeMinutes}m`
                      : "No limit"}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    --
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 bg-gray-50 p-4 grid grid-cols-2 divide-x divide-gray-200">
                <Link
                  href={`/teacher/lessons/${lesson.id}/builder`}
                  className="text-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {t("common.edit")}
                </Link>

                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleDelete(lesson.id!); }}
                  className="text-center text-sm font-semibold text-red-600 hover:text-red-500 transition-colors"
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
