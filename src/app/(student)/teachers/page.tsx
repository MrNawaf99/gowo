"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { User, BookOpen, ChevronRight } from "lucide-react";
import { getVisibleTeachers, getTeacherLessonCount, TeacherProfile } from "@/lib/services/teacherService";

interface TeacherWithCount extends TeacherProfile {
  lessonCount: number;
}

export default function TeachersPage() {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<TeacherWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const visibleTeachers = await getVisibleTeachers();
        const teachersWithCounts = await Promise.all(
          visibleTeachers.map(async (t) => {
            const count = await getTeacherLessonCount(t.id);
            return { ...t, lessonCount: count };
          })
        );
        setTeachers(teachersWithCounts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="w-full space-y-6 animate-in fade-in">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">{t("student.ourTeachers")}</h1>
        <p className="text-gray-500">{t("student.chooseTeacher")}</p>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 border border-gray-100 rounded-3xl p-5 shadow-sm animate-pulse h-32">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-20 bg-gray-100 border border-gray-100 rounded-3xl shadow-sm px-6">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t("student.noTeachers")}</h3>
          <p className="text-gray-500 max-w-sm mx-auto">{t("student.noVisibleTeachers")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {teachers.map(teacher => (
            <Link key={teacher.id} href={`/teachers/${teacher.id}`} className="group bg-gray-100 border border-gray-100 rounded-3xl p-5 shadow-sm hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 end-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                <ChevronRight className="w-6 h-6 text-primary rtl:rotate-180" />
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{teacher.name}</h2>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl text-sm font-semibold">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  {t("common.lessonsCount", { count: teacher.lessonCount })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
