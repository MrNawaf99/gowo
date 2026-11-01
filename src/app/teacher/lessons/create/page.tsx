"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLesson } from "@/lib/services/lessonService";
import { useTranslation } from "@/i18n/useTranslation";

import { getTeacherId, getStudentId, getStudentName  } from "@/lib/config/auth";
import { AlertTriangle } from "lucide-react";

export default function CreateLessonPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    
    try {
      const devTeacherId = getTeacherId();
      const lessonId = await createLesson({
        teacherId: devTeacherId,
        title: titleEn + (titleAr.trim() ? ` - ${titleAr.trim()}` : ""), // fallback
        titleEn: titleEn,
        ...(titleAr.trim() ? { titleAr: titleAr.trim() } : {}),
        level: "Beginner", // default for now, could be added to form
        grammarRule: "General", 
        orderIndex: Date.now(),
        maxAttempts: 0,
        maxTimeMinutes: 0,
        showAnswersImmediately: true,
        showResultToStudent: true,
        isPublished: false
      });
      router.push(`/teacher/lessons/${lessonId}/builder`);
    } catch (err: unknown) {
      console.error("Failed to create lesson:", err);
      setError("teacher.errCreateLesson");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("teacher.createNewLesson")}</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex gap-3 text-sm border border-red-200">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{t(error)}</p>
        </div>
      )}

      <div className="bg-gray-100 rounded-xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label htmlFor="titleEn" className="block text-sm font-medium text-gray-700 mb-1">
              {t("teacher.lessonTitleEn")} <span className="text-red-500">*</span>
            </label>
            <input 
              id="titleEn"
              type="text" 
              required
              className="w-full bg-gray-100 border border-gray-300 text-gray-900 px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              placeholder={t("teacher.egDailyRoutine")}
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="titleAr" className="block text-sm font-medium text-gray-700 mb-1">
              {t("teacher.lessonTitleAr")} <span className="text-gray-400 text-xs font-normal">{t("common.optional")}</span>
            </label>
            <input 
              id="titleAr"
              type="text" 
              className="w-full bg-gray-100 border border-gray-300 text-gray-900 px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-end"
              placeholder="مثال: الروتين اليومي"
              dir="rtl"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit"
              disabled={!titleEn || isSubmitting}
              className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center min-w-[160px] shadow-sm"
            >
              {isSubmitting ? t("teacher.creating") : t("teacher.createAndContinue")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
