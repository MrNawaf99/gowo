"use client";
import { useTranslation } from "@/i18n/useTranslation";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Settings2, Sparkles, UploadCloud } from "lucide-react";
import Link from "next/link";
import { TeacherQuestion } from "@/lib/schemas/question";
import { getLessonQuestions, saveQuestion, deleteQuestion, reorderQuestions } from "@/lib/services/questionService";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Item Component ---
function SortableQuestionItem({ question, onEdit, onDelete }: { question: TeacherQuestion, onEdit: () => void, onDelete: () => void }) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isTF = question.questionType === "TRUE_FALSE";

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-100 border border-gray-400 rounded-lg p-4 flex items-start gap-4 group hover:border-primary/50 transition-colors">
      <div {...attributes} {...listeners} className="mt-1 cursor-grab text-gray-400 hover:text-gray-600">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {isTF ? t("builder.tf") : t("builder.mcqCount")}
          </span>
          <span className="text-xs text-gray-500">{t("builder.scoreLabel")}: {question.maxScore}</span>
        </div>
        <p className="text-gray-900 font-medium mb-2">{question.question}</p>
        <div className="text-sm text-gray-600 mb-2">
          {t("builder.correctAnswer")}: <span className="font-semibold text-green-600">{question.correctAnswer}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 md:opacity-50 hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="text-gray-500 hover:text-primary">
          <Settings2 className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="text-gray-500 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// --- Main Page Component ---
export default function OptionsBuilderPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { t } = useTranslation();
  const resolvedParams = use(params);
  const [mode, setMode] = useState<"Manual" | "AI">("Manual");
  const [qType, setQType] = useState<"MULTIPLE_CHOICE" | "TRUE_FALSE">("MULTIPLE_CHOICE");
  
  const [questions, setQuestions] = useState<TeacherQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [score, setScore] = useState(1);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  
  // AI State
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [mcqCount, setMcqCount] = useState(3);
  const [tfCount, setTfCount] = useState(2);
  const [difficulty, setDifficulty] = useState("Medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [generatedPreview, setGeneratedPreview] = useState<Record<string, unknown>[] | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileText(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!fileText) {
      setAiError(t("builder.errUploadFile"));
      return;
    }
    setIsGenerating(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai/generate-options-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileText, mcqCount, tfCount, difficulty })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGeneratedPreview(data.questions);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : t("builder.errGenerateFailed"));
    } finally {
      setIsGenerating(false);
    }
  };

  const approvePreview = async () => {
    if (!generatedPreview) return;
    setIsGenerating(true);
    try {
      const promises = generatedPreview.map((q, idx) => {
        const questionData = {
          lessonId: resolvedParams.lessonId,
          questionType: q.type as "MULTIPLE_CHOICE" | "TRUE_FALSE",
          question: q.question as string,
          optionsJson: JSON.stringify(q.options || []),
          correctAnswer: q.correctAnswer as string,
          maxScore: 1,
          orderIndex: Date.now() + idx,
          isDeleted: false
        } as TeacherQuestion;
        return saveQuestion(questionData);
      });
      await Promise.all(promises);
      setGeneratedPreview(null);
      await loadQuestions(); // Refresh list
    } catch(err: unknown) {
      alert(t("errors.failedToSave"));
    } finally {
      setIsGenerating(false);
    }
  };

  const discardPreview = () => {
    setGeneratedPreview(null);
  };

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.lessonId]);

  const loadQuestions = async () => {
    setLoading(true);
    const qs = await getLessonQuestions(resolvedParams.lessonId);
    // Filter only normal options/TF
    setQuestions(qs.filter(q => q.questionType === "MULTIPLE_CHOICE" || q.questionType === "TRUE_FALSE"));
    setLoading(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over?.id);
      
      const newOrder = arrayMove(questions, oldIndex, newIndex);
      setQuestions(newOrder);
      
      // Update order in backend
      await reorderQuestions(newOrder);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
    setExplanation("");
    setScore(1);
  };

  const handleEdit = (q: TeacherQuestion) => {
    setEditingId(q.id!);
    setQType(q.questionType as "MULTIPLE_CHOICE" | "TRUE_FALSE");
    setQuestionText(q.question);
    setExplanation(q.explanationArabic || "");
    setScore(q.maxScore);
    setCorrectAnswer(q.correctAnswer);
    if (q.questionType === "MULTIPLE_CHOICE") {
      try {
        const parsed = JSON.parse(q.optionsJson);
        setOptions(parsed);
      } catch {
        setOptions(["", "", "", ""]);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
      await deleteQuestion(id);
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      alert(t("builder.errQuestionRequired"));
      return;
    }
    if (!correctAnswer.trim()) {
      alert(t("builder.errCorrectAnswerRequired"));
      return;
    }

    let optionsJson = '["True", "False"]';
    if (qType === "MULTIPLE_CHOICE") {
      const validOptions = options.filter(o => o.trim() !== "");
      if (validOptions.length < 2) {
        alert(t("builder.errTwoOptions"));
        return;
      }
      if (!validOptions.includes(correctAnswer)) {
        alert(t("builder.errAnswerMustMatchOption"));
        return;
      }
      optionsJson = JSON.stringify(validOptions);
    }

    const newQ: TeacherQuestion = {
      id: editingId || undefined,
      lessonId: resolvedParams.lessonId,
      questionType: qType,
      question: questionText,
      optionsJson,
      correctAnswer,
      explanationArabic: explanation,
      maxScore: score,
      isDeleted: false,
      orderIndex: editingId ? questions.find(q => q.id === editingId)?.orderIndex ?? questions.length : questions.length
    };

    const savedId = await saveQuestion(newQ);
    newQ.id = savedId;
    
    if (editingId) {
      setQuestions(questions.map(q => q.id === editingId ? newQ : q));
    } else {
      setQuestions([...questions, newQ]);
    }
    
    resetForm();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/teacher/lessons/${resolvedParams.lessonId}/builder`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 rtl:rotate-180" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t("builder.optionsActivity")}</h1>
      </div>

      {/* Mode Switcher */}
      <div className="bg-gray-100 p-1 rounded-lg border border-gray-400 inline-flex">
        <button 
          onClick={() => setMode("Manual")}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${mode === "Manual" ? "bg-primary text-white shadow" : "text-gray-600 hover:text-gray-900"}`}
        >
          {t("builder.manualMode")}
        </button>
        <button 
          onClick={() => setMode("AI")}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${mode === "AI" ? "bg-primary text-white shadow" : "text-gray-600 hover:text-gray-900"}`}
        >
          <Sparkles className="w-4 h-4" /> {t("builder.aiMode")}
        </button>
      </div>

      
      {mode === "AI" ? (
        <div className="space-y-6">
          {aiError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200">
              {aiError}
            </div>
          )}

          {!generatedPreview ? (
            <div className="bg-gray-100 border border-gray-400 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("builder.uploadSource")}</label>
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
                  <input type="number" min="0" max="10" value={mcqCount} onChange={(e) => setMcqCount(parseInt(e.target.value)||0)} className="w-full border border-gray-300 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("builder.tfCount")}</label>
                  <input type="number" min="0" max="10" value={tfCount} onChange={(e) => setTfCount(parseInt(e.target.value)||0)} className="w-full border border-gray-300 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("builder.difficulty")}</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full border border-gray-300 text-gray-900">
                    <option value="Easy">{t("builder.easy")}</option>
                    <option value="Medium">{t("builder.medium")}</option>
                    <option value="Hard">{t("builder.hard")}</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !fileText || (mcqCount === 0 && tfCount === 0)}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? t("builder.generating") : t("builder.generateViaAi")} <Sparkles className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="bg-gray-100 border border-gray-400 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{t("builder.previewGeneration", { count: generatedPreview.length })}</h2>
                <div className="flex gap-2">
                  <button onClick={discardPreview} className="px-4 py-2 text-gray-600 border border-gray-400 rounded-lg hover:bg-gray-200 text-sm font-medium">
                    {t("builder.discard")}
                  </button>
                  <button onClick={approvePreview} disabled={isGenerating} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium">
                    {isGenerating ? t("state.saving") : t("builder.approveAndSave")}
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {generatedPreview.map((q, idx) => (
                  <div key={idx} className="border border-blue-200 bg-blue-50/30 rounded-xl p-4">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">{q.type === "MULTIPLE_CHOICE" ? t("builder.mcq") : t("builder.tf")}</span>
                    </div>
                    <p className="font-medium text-gray-900 mt-2">{String(q.question)}</p>
                    {q.type === "MULTIPLE_CHOICE" && Array.isArray(q.options) && (
                      <ul className="mt-2 space-y-1">
                        {q.options.map((o: string, i: number) => (
                          <li key={i} className={`text-sm ${o === q.correctAnswer ? "text-green-700 font-semibold" : "text-gray-600"}`}>
                            {o === q.correctAnswer ? "✓ " : "• "}{o}
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.type === "TRUE_FALSE" && (
                      <div className="mt-2 text-sm">
                        <span className="font-semibold text-green-700">✓ {String(q.correctAnswer)}</span>
                      </div>
                    )}
                    <div className="mt-3 p-2 bg-gray-200/60 rounded text-sm text-gray-700 text-right" dir="rtl">
                      <span className="font-semibold">{t("builder.explanationPrefix")} </span>{String(q.explanationArabic)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Question Editor */}
          <div className="lg:col-span-7 bg-gray-100 rounded-xl border border-gray-400 shadow-sm p-6">
            
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => { setQType("MULTIPLE_CHOICE"); setCorrectAnswer(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${qType === "MULTIPLE_CHOICE" ? "bg-primary/10 border-primary text-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                {t("builder.mcqCount")}
              </button>
              <button 
                onClick={() => { setQType("TRUE_FALSE"); setCorrectAnswer(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${qType === "TRUE_FALSE" ? "bg-primary/10 border-primary text-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                {t("builder.tfCount")}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("builder.questionLabel")}</label>
                <textarea 
                  required
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {qType === "MULTIPLE_CHOICE" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">{t("builder.optionsLabel")}</label>
                  {options.map((opt, idx) => (
                    <input 
                      key={idx}
                      type="text"
                      placeholder={t("builder.optionN", { number: idx + 1 })}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...options];
                        newOpts[idx] = e.target.value;
                        setOptions(newOpts);
                      }}
                      className="w-full border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  ))}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">{t("builder.correctAnswer")}</label>
                    <select 
                      required
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="w-full border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">{t("builder.selectCorrectOption")}</option>
                      {options.filter(o => o.trim() !== "").map((opt, idx) => (
                        <option key={idx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {qType === "TRUE_FALSE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("builder.correctAnswer")}</label>
                  <select 
                    required
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">{t("builder.selectPlaceholder")}</option>
                    <option value="True">{t("builder.true")}</option>
                    <option value="False">{t("builder.false")}</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("builder.explanationAr")}</label>
                <textarea 
                  rows={2}
                  dir="rtl"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("builder.scoreLabel")}</label>
                <input 
                  type="number"
                  min="1"
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex gap-2 pt-4">
                {editingId && (
                  <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    {t("common.cancel")}
                  </button>
                )}
                <button type="submit" className="flex-1 bg-primary text-white py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium">
                  {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? t("builder.updateQuestion") : t("builder.addQuestion")}
                </button>
              </div>
            </form>
          </div>

          {/* Questions List */}
          <div className="lg:col-span-5 bg-gray-50 rounded-xl border border-gray-200 p-4 min-h-[400px]">
            <h3 className="font-semibold text-gray-900 mb-4 flex justify-between items-center">
              {t("builder.questionsCount", { count: questions.length })}
            </h3>
            
            {loading ? (
              <div className="text-center py-12 text-gray-500">{t("state.loading")}</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                {t("builder.noQuestionsYet")}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={questions.map(q => q.id!)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {questions.map((q) => (
                      <SortableQuestionItem 
                        key={q.id} 
                        question={q} 
                        onEdit={() => handleEdit(q)}
                        onDelete={() => handleDelete(q.id!)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
