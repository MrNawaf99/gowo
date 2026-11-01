"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { getLessonTitle } from "@/i18n/lessonTitle";
import { getPublishedLessons, TeacherLesson } from "@/lib/services/lessonService";
import { getTeacherProfile, TeacherProfile } from "@/lib/services/teacherService";
import { ArrowLeft, Clock, Play, GraduationCap, Inbox } from "lucide-react";

export default function TeacherLessonsPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const { t, locale } = useTranslation();
  const resolvedParams = use(params);
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profile, list] = await Promise.all([
          getTeacherProfile(resolvedParams.teacherId),
          getPublishedLessons(resolvedParams.teacherId)
        ]);
        setTeacher(profile);
        setLessons(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [resolvedParams.teacherId]);

  return (
    <div className="w-full space-y-6 animate-in fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/teachers" className="p-2 -ms-2 hover:bg-gray-100 rounded-full transition-colors active:bg-gray-200">
          <ArrowLeft className="w-6 h-6 text-gray-800 rtl:rotate-180" />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {teacher ? `${t("student.teachersLessons", { name: teacher.name })}` : "Published Lessons"}
          </h1>
          {teacher && <p className="text-sm text-gray-500 font-medium">@{teacher.username}</p>}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 border border-gray-100 rounded-2xl p-5 shadow-sm animate-pulse flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded-md w-1/2"></div>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-6 bg-gray-50 rounded w-16"></div>
                <div className="h-6 bg-gray-50 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20 bg-gray-100 border border-gray-100 rounded-3xl shadow-sm px-6">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Inbox className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t("student.noLessonsYet")}</h3>
          <p className="text-gray-500 max-w-sm mx-auto">{t("student.noPublishedLessons")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {lessons.map(lesson => (
            <Link key={lesson.id} href={`/lessons/${lesson.id}`} className="group bg-gray-100 border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all flex flex-col">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                      {lesson.level}
                    </span>
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-gray-500 text-sm font-medium truncate max-w-[120px] sm:max-w-[150px]">
                      {lesson.grammarRule}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                    {getLessonTitle(lesson, locale, t("student.untitledLesson"))}
                  </h2>
                </div>
                <div className="bg-gray-50 group-hover:bg-primary/10 p-3 rounded-full text-gray-400 group-hover:text-primary transition-colors shrink-0">
                  <Play className="w-5 h-5 ms-0.5" />
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {lesson.maxTimeMinutes === 0 ? "No Time Limit" : `${lesson.maxTimeMinutes} mins`}
                </div>
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  {lesson.maxAttempts === 0 ? "Unlimited Attempts" : `${t("student.attempts", { count: lesson.maxAttempts })}`}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
