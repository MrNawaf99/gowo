"use client";
import { useTranslation } from "@/i18n/useTranslation";
import { getLessonTitle } from "@/i18n/lessonTitle";
import { Loader2 } from "lucide-react";
import { } from "lucide-react";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllLessonsForTeacher, TeacherLesson } from "@/lib/services/lessonService";
import { BookOpen } from "lucide-react";

import { getTeacherId, getStudentId, getStudentName  } from "@/lib/config/auth";



export default function TeacherResultsPage() {
  const { t, locale } = useTranslation();
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const list = await getAllLessonsForTeacher(getTeacherId());
      setLessons(list);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("teacher.studentResults")}</h1>
        <p className="text-gray-500">{t("teacher.selectLessonToView")}</p>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/40" /><p>{t("teacher.loadingLessons")}</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map(lesson => (
            <Link key={lesson.id} href={`/teacher/results/${lesson.id}`} className="bg-gray-100 border border-gray-200 p-6 rounded-2xl shadow-sm hover:border-primary hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-lg text-primary group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 flex-1 truncate">{getLessonTitle(lesson, locale, t("student.untitledLesson"))}</h3>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{lesson.level}</span>
                <span className={lesson.isPublished ? "bg-green-50 text-green-700 font-medium px-3 py-1 rounded-full text-xs" : "bg-amber-50 text-amber-700 font-medium px-3 py-1 rounded-full text-xs"}>
                  {lesson.isPublished ? t("builder.published") : t("builder.draft")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
