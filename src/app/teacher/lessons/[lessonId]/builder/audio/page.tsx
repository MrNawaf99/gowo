"use client";
import { useTranslation } from "@/i18n/useTranslation";
import { uploadAIAudioBase64 } from "@/lib/services/storageService";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEV_AUTH } from "@/lib/config/auth";
import { ArrowLeft, Sparkles, UploadCloud, Save, Music, RefreshCw, Trash2, Plus, GripVertical } from "lucide-react";
import { saveWebActivity } from "@/lib/services/webActivityService";

import { WebActivity } from "@/lib/schemas/webActivity";
import { DragEndEvent, DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface GeneratedQuestion {
  id: string;
  type: "MCQ" | "TF";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

function SortableQuestion({ 
  q, 
  index, 
  updateQuestion, 
  removeQuestion 
}: { 
  q: GeneratedQuestion, 
  index: number, 
  updateQuestion: (i: number, q: GeneratedQuestion) => void, 
  removeQuestion: (i: number) => void 
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: q.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-100 border border-gray-400 rounded-xl p-4 shadow-sm relative group">
      <div className="absolute top-4 start-2 cursor-grab text-gray-400 opacity-50 group-hover:opacity-100" {...attributes} {...listeners}>
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div className="ps-6 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1">{t("review.questionNumber", { number: index + 1 })} ({q.type})</label>
            <input 
              type="text" 
              value={q.question} 
              onChange={(e) => updateQuestion(index, { ...q, question: e.target.value })}
              className="w-full border-gray-300 rounded-md text-sm font-medium"
            />
          </div>
          <button onClick={() => removeQuestion(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {q.type === "MCQ" && q.options && (
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt, oIdx) => (
              <div key={oIdx} className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name={`q-${q.id}-correct`} 
                  checked={q.correctAnswer === opt}
                  onChange={() => updateQuestion(index, { ...q, correctAnswer: opt })}
                  className="w-4 h-4 text-primary"
                />
                <input 
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...q.options!];
                    newOpts[oIdx] = e.target.value;
                    updateQuestion(index, { ...q, options: newOpts, correctAnswer: q.correctAnswer === opt ? e.target.value : q.correctAnswer });
                  }}
                  className="flex-1 text-sm border-gray-300 rounded-md p-1.5"
                />
              </div>
            ))}
          </div>
        )}

        {q.type === "TF" && (
          <div className="flex gap-4">
            {["True", "False"].map(opt => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input 
                  type="radio" 
                  name={`q-${q.id}-correct`} 
                  checked={q.correctAnswer === opt}
                  onChange={() => updateQuestion(index, { ...q, correctAnswer: opt })}
                  className="w-4 h-4 text-primary"
                />
                {opt}
              </label>
            ))}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">{t("results.explanation")}</label>
          <input 
            type="text" 
            value={q.explanation} 
            onChange={(e) => updateQuestion(index, { ...q, explanation: e.target.value })}
            className="w-full border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>
    </div>
  );
}


export default function AudioBuilderPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { t } = useTranslation();
  const resolvedParams = use(params);
  const router = useRouter();
  const [fileBase64, setFileBase64] = useState("");
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [mcqCount, setMcqCount] = useState(3);
  const [tfCount, setTfCount] = useState(2);
  const [difficulty, setDifficulty] = useState("Medium");

  const [loading, setLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  
  const [generatedData, setGeneratedData] = useState<{
    transcript: string;
    audioUrl: string;
    questions: GeneratedQuestion[];
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [scriptEdited, setScriptEdited] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (file.type === "application/pdf" || fileName.endsWith(".pdf")) {
        setFileBase64(res);
        setFileText("");
      } else {
        setFileText(res);
        setFileBase64("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    const t0 = performance.now();
    try {
      const res = await fetch("/api/ai/generate-audio-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pdfBase64: fileBase64, 
          fileText, 
          mcqCount, 
          tfCount, 
          difficulty,
          lessonId: resolvedParams.lessonId
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      const t1 = performance.now();
      console.log(`Generation API took ${Math.round(t1 - t0)}ms`);

      data.questions = data.questions.map((q: GeneratedQuestion) => ({ ...q, id: `q-${Date.now()}-${Math.random()}` }));
      
      // Convert Base64 to Blob to avoid browser hanging during Firebase upload
      setGeneratedData({
        transcript: data.transcript,
        questions: data.questions,
        audioUrl: data.audioUrl
      });
      setScriptEdited(false);
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : t("builder.errGenerateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateAudio = async () => {
    if (!generatedData) return;
    setRegenLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/regenerate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: generatedData.transcript })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      const activityId = `aiaudio_regen_${Date.now()}`;
      const audioUrl = await uploadAIAudioBase64(data.audioBase64, resolvedParams.lessonId, activityId);
      
      setGeneratedData({ ...generatedData, audioUrl });
      setScriptEdited(false);
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : t("builder.errRegenerateFailed"));
    } finally {
      setRegenLoading(false);
    }
  };

  const updateQuestion = (index: number, newQ: GeneratedQuestion) => {
    if (!generatedData) return;
    const newQs = [...generatedData.questions];
    newQs[index] = newQ;
    setGeneratedData({ ...generatedData, questions: newQs });
  };

  const removeQuestion = (index: number) => {
    if (!generatedData) return;
    const newQs = generatedData.questions.filter((_, i) => i !== index);
    setGeneratedData({ ...generatedData, questions: newQs });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && generatedData) {
      const oldIndex = generatedData.questions.findIndex(q => q.id === active.id);
      const newIndex = generatedData.questions.findIndex(q => q.id === over.id);
      setGeneratedData({
        ...generatedData,
        questions: arrayMove(generatedData.questions, oldIndex, newIndex)
      });
    }
  };

  const handleSave = async () => {
    if (!generatedData) return;
    if (scriptEdited) {
      setError(t("builder.errScriptModified"));
      return;
    }
    setSaving(true);
    setError("");
    const t0 = performance.now();
    try {
      // Audio is already uploaded, just save to Firestore
      const activity: WebActivity = {
        lessonId: resolvedParams.lessonId,
        teacherId: DEV_AUTH.currentTeacherId,
        questionType: "AI_AUDIO",
        orderIndex: Date.now(),
        maxScore: generatedData.questions.length,
        audioUrl: generatedData.audioUrl,
        audioScript: generatedData.transcript,
        difficulty,
        questions: generatedData.questions,
        question: "AI Audio Activity",
        createdAt: Date.now(),
        isDeleted: false
      };
      
      await saveWebActivity(activity);
      const t1 = performance.now();
      console.log(`Firestore Save took ${Math.round(t1 - t0)}ms`);
      
      router.push(`/teacher/lessons/${resolvedParams.lessonId}/builder`);
      router.refresh();
      const t2 = performance.now();
      console.log(`Navigation triggered at ${Math.round(t2 - t1)}ms`);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "Error") || "Failed to save");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href={`/teacher/lessons/${resolvedParams.lessonId}/builder`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("builder.audioActivity")}</h1>
          <p className="text-gray-500 text-sm">{t("builder.audioSubtitle")}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200">
          {error}
        </div>
      )}

      {!generatedData ? (
        <div className="bg-gray-100 border border-gray-400 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("builder.uploadSourceDoc")}</label>
            <div className="border-2 border-dashed border-gray-400 rounded-xl p-8 text-center hover:bg-gray-200 transition-colors">
              <UploadCloud className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-4">{fileName || t("builder.selectTxtPdf")}</p>
              <input type="file" accept=".txt,.pdf,text/plain,application/pdf" onChange={handleFileUpload} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer bg-gray-200 border border-gray-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300">
                {t("builder.browseFiles")}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("builder.mcqCount")}</label>
              <input type="number" min="0" max="10" value={mcqCount} onChange={(e) => setMcqCount(parseInt(e.target.value))} className="w-full border border-gray-300 text-gray-900 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("builder.tfCount")}</label>
              <input type="number" min="0" max="10" value={tfCount} onChange={(e) => setTfCount(parseInt(e.target.value))} className="w-full border border-gray-300 text-gray-900 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("builder.difficulty")}</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full border border-gray-300 text-gray-900 rounded-lg">
                <option value="Easy">{t("builder.easy")}</option>
                <option value="Medium">{t("builder.medium")}</option>
                <option value="Hard">{t("builder.hard")}</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || (!fileBase64 && !fileText)}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? t("builder.generating") : t("builder.generateViaAi")} <Sparkles className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-100 border border-gray-400 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t("builder.previewAndEdit")}</h2>
              <button onClick={() => setGeneratedData(null)} className="text-sm text-gray-500 hover:text-gray-900">{t("builder.discard")}</button>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">{t("builder.audioScript")}</span>
                </div>
                {scriptEdited && (
                  <button 
                    onClick={handleRegenerateAudio}
                    disabled={regenLoading}
                    className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${regenLoading ? 'animate-spin' : ''}`} />
                    {regenLoading ? t("builder.regenerating") : t("builder.regenerateAudio")}
                  </button>
                )}
              </div>
              <textarea 
                value={generatedData.transcript}
                onChange={(e) => {
                  setGeneratedData({ ...generatedData, transcript: e.target.value });
                  setScriptEdited(true);
                }}
                className="w-full bg-gray-300 border border-blue-200 rounded-lg p-3 text-sm text-gray-900 mb-4 focus:ring-2 focus:ring-blue-500"
                rows={5}
              />
              
              <div className="bg-gray-200 p-3 rounded-lg border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <span className="text-sm font-medium text-gray-600">{t("builder.audioPreview")}</span>
                <audio controls src={generatedData.audioUrl} className="h-10 w-full md:w-auto" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                {t("builder.questionsCount", { count: generatedData.questions.length })}
                <button 
                  onClick={() => setGeneratedData({ 
                    ...generatedData, 
                    questions: [...generatedData.questions, { id: `q-${Date.now()}`, type: "TF", question: "New Question", correctAnswer: "True", explanation: "" }] 
                  })}
                  className="text-primary flex items-center gap-1 text-sm hover:underline"
                >
                  <Plus className="w-4 h-4" /> {t("builder.addQuestion")}
                </button>
              </h3>
              
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={generatedData.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {generatedData.questions.map((q, i) => (
                      <SortableQuestion 
                        key={q.id} 
                        q={q} 
                        index={i} 
                        updateQuestion={updateQuestion}
                        removeQuestion={removeQuestion}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="mt-8">
              <button 
                onClick={handleSave}
                disabled={saving || scriptEdited}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm shadow-green-200"
              >
                {saving ? t("state.saving") : scriptEdited ? t("builder.regenerateToSave") : t("builder.approveAndSaveActivity")} 
                {!saving && !scriptEdited && <Save className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







