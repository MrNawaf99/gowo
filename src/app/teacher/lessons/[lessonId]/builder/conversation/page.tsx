"use client";
import { useTranslation } from "@/i18n/useTranslation";
import { getLessonTitle } from "@/i18n/lessonTitle";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, UploadCloud, Plus, Loader2, RefreshCw } from "lucide-react";
import { WebActivity } from "@/lib/schemas/webActivity";
import { saveWebActivity } from "@/lib/services/webActivityService";
import { getLesson, TeacherLesson } from "@/lib/services/lessonService";
import { DEV_AUTH } from "@/lib/config/auth";

export default function AIConversationBuilderPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { t, locale } = useTranslation();
  const resolvedParams = use(params);
  const router = useRouter();

  const [lesson, setLesson] = useState<TeacherLesson | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [fileText, setFileText] = useState("");

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(true);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopicInput, setCustomTopicInput] = useState("");

  const [style, setStyle] = useState<"Teacher" | "Natural Conversation" | "Mixed">("Mixed");
  const [difficulty, setDifficulty] = useState("Medium");
  const [aiReplies, setAiReplies] = useState(11);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    async function fetchLesson() {
      if (!lesson) {
        const l = await getLesson(resolvedParams.lessonId);
        if (l) setLesson(l as TeacherLesson);
      }
    }
    fetchLesson();
  }, [lesson, resolvedParams.lessonId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setFileName(selected.name);
    setAnalyzed(false);

    if (selected.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFileBase64(evt.target?.result as string);
        setFileText("");
      };
      reader.readAsDataURL(selected);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFileText(evt.target?.result as string);
        setFileBase64("");
      };
      reader.readAsText(selected);
    }
  };

  const handleAnalyze = async () => {
    if (!fileBase64 && !fileText) {
      setError(t("builder.errSelectFile"));
      return;
    }
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch("/api/ai/analyze-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64: fileBase64, fileText })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setSuggestedTopics(data.topics || []);
      setAnalyzed(true);
    } catch (err: any) {
      setError(err.message || t("builder.errAnalyzeFailed"));
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(prev => prev.filter(t => t !== topic));
    } else {
      setSelectedTopics(prev => [...prev, topic]);
    }
  };

  const addCustomTopic = () => {
    const t = customTopicInput.trim();
    if (t && !suggestedTopics.includes(t)) {
      setSuggestedTopics(prev => [...prev, t]);
      setSelectedTopics(prev => [...prev, t]);
      setCustomTopicInput("");
    }
  };

  const handleSave = async () => {
    if (selectedTopics.length === 0) {
      setError(t("builder.errSelectTopic"));
      return;
    }
    if (aiReplies < 5 || aiReplies > 21 || aiReplies % 2 === 0) {
      setError(t("builder.errRepliesRange"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      const activity: any = {
        lessonId: resolvedParams.lessonId,
        teacherId: DEV_AUTH.currentTeacherId,
        questionType: "AI_CONVERSATION",
        orderIndex: Date.now(),
        maxScore: 10, // Max score for conversation
        question: "AI Conversation Activity",
        selectedTopics: selectedTopics,
        style: style,
        difficulty: difficulty,
        aiReplies: aiReplies,
        audioScript: lesson?.title || "Conversation", // Keep context
        createdAt: Date.now(),
        isDeleted: false
      };
      
      await saveWebActivity(activity);
      router.push(`/teacher/lessons/${resolvedParams.lessonId}/builder`);
    } catch (err: any) {
      console.error(err);
      setError(t("errors.failedToSave"));
      setSaving(false);
    }
  };

  const repliesOptions = [5, 7, 9, 11, 13, 15, 17, 19, 21];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gray-100 border-b border-gray-400 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            {t("builder.backToBuilder")}
          </button>
          <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            {t("builder.conversationActivity")}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("builder.conversationActivity")}</h1>
        <p className="text-gray-600 mb-8">{t("builder.conversationSubtitle")}</p>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="bg-gray-100 rounded-2xl shadow-sm border border-gray-400 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t("builder.step1LessonContent")}</h2>
          <div className="border-2 border-dashed border-gray-400 rounded-xl p-8 text-center bg-gray-50/50">
            <UploadCloud className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-4">{fileName || t("builder.uploadSourceDoc")}</p>
            <input type="file" accept=".txt,.pdf,text/plain,application/pdf" onChange={handleFileUpload} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer bg-gray-200 border border-gray-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300">
              {t("builder.browseFiles")}
            </label>
          </div>
          {file && !analyzed && (
            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleAnalyze} 
                disabled={analyzing}
                className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {t("builder.analyzeFile")}
              </button>
            </div>
          )}
        </div>

        {analyzed && (
          <>
            <div className="bg-gray-100 rounded-2xl shadow-sm border border-gray-400 p-8 mb-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{t("builder.step2Topics")}</h2>
                <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {t("builder.selectedCount", { count: selectedTopics.length })}
                </span>
              </div>
              
              <div className="space-y-3 mb-6">
                {suggestedTopics.map(topic => (
                  <label key={topic} className="flex items-center gap-3 p-3 rounded-lg border border-gray-400 hover:bg-gray-200 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedTopics.includes(topic)}
                      onChange={() => toggleTopic(topic)}
                      className="w-5 h-5 text-primary border-gray-400 rounded focus:ring-primary"
                    />
                    <span className="text-gray-700">{topic}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder={t("builder.addOwnTopic")}
                  value={customTopicInput}
                  onChange={(e) => setCustomTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTopic()}
                  className="flex-1 border border-gray-400 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-gray-200 text-gray-900"
                />
                <button onClick={addCustomTopic} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {t("builder.addTopic")}
                </button>
              </div>
            </div>

            <div className="bg-gray-100 rounded-2xl shadow-sm border border-gray-400 p-8 mb-8 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t("builder.step3Settings")}</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">{t("builder.aiResponseStyle")}</label>
                  <select 
                    value={style} 
                    onChange={(e) => setStyle(e.target.value as any)}
                    className="w-full border border-gray-400 rounded-xl px-4 py-3 bg-gray-300 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none cursor-pointer"
                  >
                    <option value="Teacher">{t("builder.styleTeacher")}</option>
                    <option value="Natural Conversation">{t("builder.styleNatural")}</option>
                    <option value="Mixed">{t("builder.styleMixed")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">{t("builder.difficulty")}</label>
                  <select 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full border border-gray-400 rounded-xl px-4 py-3 bg-gray-300 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none cursor-pointer"
                  >
                    <option value="Easy">{t("builder.easy")}</option>
                    <option value="Medium">{t("builder.medium")}</option>
                    <option value="Hard">{t("builder.hard")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">{t("builder.aiRepliesTotal")}</label>
                  <select 
                    value={aiReplies} 
                    onChange={(e) => setAiReplies(Number(e.target.value))}
                    className="w-full border border-gray-400 rounded-xl px-4 py-3 bg-gray-300 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none cursor-pointer"
                  >
                    {repliesOptions.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-8 mb-8 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-bold text-blue-900 mb-4">{t("builder.summary")}</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li><span className="font-semibold">{t("builder.summaryLesson")}</span> {getLessonTitle(lesson, locale, t("state.noData"))}</li>
                <li><span className="font-semibold">{t("builder.summaryTopics")}</span> {selectedTopics.join(", ")}</li>
                <li><span className="font-semibold">{t("builder.summaryStyle")}</span> {t("builder.style" + style.replace(/\s/g, ""))}</li>
                <li><span className="font-semibold">{t("builder.summaryDifficulty")}</span> {t("builder." + difficulty.toLowerCase())}</li>
                <li><span className="font-semibold">{t("builder.summaryTotalReplies")}</span> {t("builder.repliesIncluding", { count: aiReplies })}</li>
              </ul>
              
              <button 
                onClick={handleSave}
                disabled={saving}
                className="mt-6 w-full bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm shadow-green-200"
              >
                {saving ? t("state.saving") : t("builder.saveActivity")} 
                {!saving && <Save className="w-5 h-5" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


