"use client";

import { useState, useEffect, use } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { getLessonQuestions } from "@/lib/services/questionService";
import { getLesson, updateLessonPublishStatus, updateLessonConfig, TeacherLesson } from "@/lib/services/lessonService";
import { useTranslation } from "@/i18n/useTranslation";
import { getLessonTitle } from "@/i18n/lessonTitle";

export default function LessonBuilderPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const resolvedParams = use(params);
  const { t, locale } = useTranslation();
  const [lesson, setLesson] = useState<TeacherLesson | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [optionsCount, setOptionsCount] = useState(0);
  const [readingCount, setReadingCount] = useState(0);
  const [hasPassage, setHasPassage] = useState(false);
  const [writingCount, setWritingCount] = useState(0);
  const [audioCount, setAudioCount] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  
  useEffect(() => {
    async function loadStats() {
      const l = await getLesson(resolvedParams.lessonId);
      setLesson(l);
      setHasPassage(!!(l?.readingPassage));
      
      const qs = await getLessonQuestions(resolvedParams.lessonId);
      setOptionsCount(qs.filter(q => q.questionType === "MULTIPLE_CHOICE" || q.questionType === "TRUE_FALSE").length);
      setReadingCount(qs.filter(q => q.questionType === "READING_MULTIPLE_CHOICE" || q.questionType === "READING_TRUE_FALSE").length);
      setWritingCount(qs.filter(q => q.questionType === "WRITING").length);
      setAudioCount(qs.filter(q => q.questionType === "AI_AUDIO").reduce((acc, q) => acc + ((q as any).questions?.length || 0), 0));
      setConversationCount(qs.filter(q => q.questionType === "AI_CONVERSATION").length);
      
      setLoading(false);
    }
    loadStats();
  }, [resolvedParams.lessonId]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const isPub = e.target.value === "Published";
    if (lesson) {
      setLesson({ ...lesson, isPublished: isPub });
      await updateLessonPublishStatus(resolvedParams.lessonId, isPub);
    }
  };

  const handleConfigChange = async (updates: Partial<TeacherLesson>) => {
    if (lesson) {
      setLesson({ ...lesson, ...updates });
      await updateLessonConfig(resolvedParams.lessonId, updates);
    }
  };

  const activities = [
    { 
      id: "options", 
      name: t("builder.optionsActivity"), 
      count: optionsCount, 
      completed: optionsCount > 0,
      href: `/teacher/lessons/${resolvedParams.lessonId}/builder/options`
    },
    { 
      id: "reading", 
      name: t("builder.readingActivity"), 
      count: readingCount, 
      label: hasPassage
        ? t("builder.passageWithQuestions", { count: readingCount })
        : t("builder.noPassageWithQuestions", { count: readingCount }),
      completed: hasPassage && readingCount > 0,
      href: `/teacher/lessons/${resolvedParams.lessonId}/builder/reading`
    },
    { 
      id: "writing", 
      name: t("builder.writingActivity"), 
      count: writingCount, 
      completed: writingCount > 0, 
      href: `/teacher/lessons/${resolvedParams.lessonId}/builder/writing` 
    },
    { 
      id: "audio", 
      name: t("builder.audioActivity"), 
      count: audioCount, 
      completed: audioCount > 0, 
      href: `/teacher/lessons/${resolvedParams.lessonId}/builder/audio` 
    },
    { 
      id: "conversation", 
      name: t("builder.conversationActivity"), 
      count: conversationCount, 
      completed: conversationCount > 0, 
      href: `/teacher/lessons/${resolvedParams.lessonId}/builder/conversation` 
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 bg-gray-100 p-6 rounded-xl border border-gray-400 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lesson ? getLessonTitle(lesson, locale, t("student.untitledLesson")) : t("state.loading")}</h1>
            <p className="text-gray-500 text-sm mt-1">ID: {resolvedParams.lessonId}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{t("builder.status")}</span>
            <select 
              value={lesson?.isPublished ? "Published" : "Draft"}
              onChange={handleStatusChange}
              disabled={!lesson}
              className="bg-gray-300 border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2"
            >
              <option value="Draft">{t("builder.draft")}</option>
              <option value="Published">{t("builder.published")}</option>
            </select>
          </div>
        </div>

        {/* Lesson Settings Row */}
        <div className="border-t border-gray-400 pt-4 flex flex-col sm:flex-row gap-6">
          {/* Attempts */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{t("builder.attempts")}</span>
            <select
              value={lesson?.maxAttempts ?? 0}
              onChange={(e) => handleConfigChange({ maxAttempts: parseInt(e.target.value) })}
              disabled={!lesson}
              className="bg-gray-300 border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2"
            >
              <option value={0}>{t("builder.unlimited")}</option>
              <option value={1}>{t("builder.oneAttempt")}</option>
              <option value={2}>{t("builder.twoAttempts")}</option>
              <option value={3}>{t("builder.threeAttempts")}</option>
            </select>
          </div>

          {/* Results */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{t("builder.results")}</span>
            <select
              value={lesson?.showAnswersImmediately ? "immediately" : "after_review"}
              onChange={(e) => handleConfigChange({ showAnswersImmediately: e.target.value === "immediately" })}
              disabled={!lesson}
              className="bg-gray-300 border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2"
            >
              <option value="immediately">{t("builder.immediately")}</option>
              <option value="after_review">{t("builder.afterReview")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="text-xl font-bold text-gray-900">{t("builder.activityTypes")}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((activity) => (
          <Link 
            href={activity.href}
            key={activity.id} 
            className={`block bg-gray-100 p-5 rounded-xl border transition-all hover:border-primary hover:shadow-md ${activity.completed ? 'border-gray-400' : 'border-dashed border-gray-400'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{activity.name}</h3>
              {activity.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-500" />
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              {loading ? "..." : (activity.label ? activity.label : t("builder.questionsCount", { count: activity.count }))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-400 flex justify-end">
              <span className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                {activity.completed ? t("builder.edit") : t("builder.add")} 
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
