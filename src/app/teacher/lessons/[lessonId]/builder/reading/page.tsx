"use client";
import { useTranslation } from "@/i18n/useTranslation";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Sparkles, UploadCloud, BookOpenText } from "lucide-react";
import Link from "next/link";
import { TeacherQuestion } from "@/lib/schemas/question";
import { getLessonQuestions, saveQuestion, deleteQuestion, reorderQuestions } from "@/lib/services/questionService";
import { getLessonPassage, updateLessonPassage } from "@/lib/services/lessonService";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Sortable Item Component ---
function SortableQuestionItem({ question, onEdit, onDelete }: { question: TeacherQuestion, onEdit: () => void, onDelete: () => void }) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id! });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={"bg-gray-100 p-4 rounded-xl border flex gap-4 " + (isDragging ? "shadow-lg border-primary" : "border-gray-400")}>
      <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">
            {question.questionType === "READING_MULTIPLE_CHOICE" ? t("builder.mcq") : t("builder.tf")}
          </span>
          <div className="flex gap-2">
            <button onClick={onEdit} className="text-sm text-gray-500 hover:text-primary font-medium">{t("common.edit")}</button>
            <button onClick={onDelete} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <p className="font-medium text-gray-900 mb-2">{question.question}</p>
        
        {question.questionType === "READING_MULTIPLE_CHOICE" && (
          <ul className="space-y-1 mb-3">
            {(() => {
              try {
                const opts = JSON.parse(question.optionsJson);
                return opts.map((o: string, i: number) => (
                  <li key={i} className={"text-sm " + (o === question.correctAnswer ? "text-green-700 font-semibold" : "text-gray-600")}>
                    {o === question.correctAnswer ? "✓ " : "• "}{o}
                  </li>
                ));
              } catch(e) { return null; }
            })()}
          </ul>
        )}
        
        {question.questionType === "READING_TRUE_FALSE" && (
          <div className="mb-3 text-sm font-semibold text-green-700">✓ {question.correctAnswer}</div>
        )}
        
        {question.explanationArabic && (
          <div className="bg-gray-50 p-2 rounded text-sm text-gray-700 text-right" dir="rtl">
            <span className="font-semibold">{t("builder.explanationPrefix")} </span>{question.explanationArabic}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReadingBuilderPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { t } = useTranslation();
  const resolvedParams = use(params);
  const [questions, setQuestions] = useState<TeacherQuestion[]>([]);
  const [passage, setPassage] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modes
  const [activeTab, setActiveTab] = useState<"MANUAL" | "AI">("MANUAL");
  
  // Form State (Manual)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qType, setQType] = useState<"READING_MULTIPLE_CHOICE" | "READING_TRUE_FALSE">("READING_MULTIPLE_CHOICE");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [score, setScore] = useState(1);

  // AI State
  const [mcqCount, setMcqCount] = useState(3);
  const [tfCount, setTfCount] = useState(2);
  const [difficulty, setDifficulty] = useState("Medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  
  // File State
  const [selectedFileName, setSelectedFileName] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  
  // AI Preview State
  const [previewPassage, setPreviewPassage] = useState("");
  const [generatedPreview, setGeneratedPreview] = useState<Record<string, unknown>[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function loadData() {
    setLoading(true);
    try {
      const p = await getLessonPassage(resolvedParams.lessonId);
      setPassage(p);
      const allQs = await getLessonQuestions(resolvedParams.lessonId);
      const readingQs = allQs.filter(q => q.questionType === "READING_MULTIPLE_CHOICE" || q.questionType === "READING_TRUE_FALSE");
      setQuestions(readingQs);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [resolvedParams.lessonId]);

  // Handle Passage Save
  const handleSavePassage = async () => {
    if (!passage.trim()) {
      alert(t("builder.errPassageRequired"));
      return;
    }
    try {
      await updateLessonPassage(resolvedParams.lessonId, passage);
      alert(t("builder.passageSaved"));
    } catch (error) {
      alert(t("builder.errPassageSaveFailed"));
    }
  };

  // Drag End
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over.id);
      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      const previousOrder = questions;
      setQuestions(newQuestions);
      try {
        await reorderQuestions(newQuestions);
      } catch (err) {
        // Undo the optimistic move so the list never disagrees with storage.
        console.error("Failed to save reorder", err);
        setQuestions(previousOrder);
        alert(t("builder.errReorderFailed"));
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
    setExplanation("");
    setScore(1);
    setQType("READING_MULTIPLE_CHOICE");
  };

  const handleEdit = (q: TeacherQuestion) => {
    setEditingId(q.id!);
    setQType(q.questionType as "READING_MULTIPLE_CHOICE" | "READING_TRUE_FALSE");
    setQuestionText(q.question);
    setExplanation(q.explanationArabic || "");
    setCorrectAnswer(q.correctAnswer);
    setScore(q.maxScore || 1);
    if (q.questionType === "READING_MULTIPLE_CHOICE" && q.optionsJson) {
      try {
        const parsed = JSON.parse(q.optionsJson);
        const newOpts = ["", "", "", ""];
        parsed.forEach((val: string, i: number) => { if(i < 4) newOpts[i] = val; });
        setOptions(newOpts);
      } catch (e) {}
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("builder.confirmDeleteQuestion"))) return;
    try {
      await deleteQuestion(id);
      setQuestions(questions.filter(q => q.id !== id));
    } catch (err) {
      alert(t("builder.errDeleteFailed"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enforce passage
    if (!passage.trim()) {
      alert(t("builder.errPassageFirst"));
      return;
    }

    if (qType === "READING_MULTIPLE_CHOICE" && !options.some(o => o.trim() !== "")) {
      alert(t("builder.errOneOption"));
      return;
    }
    if (!correctAnswer) {
      alert(t("builder.errCorrectAnswerRequired"));
      return;
    }
    
    const validOptions = qType === "READING_MULTIPLE_CHOICE" ? options.filter(o => o.trim() !== "") : [];

    try {
      const qData: Partial<TeacherQuestion> = {
        lessonId: resolvedParams.lessonId,
        questionType: qType,
        question: questionText,
        optionsJson: JSON.stringify(validOptions),
        correctAnswer: correctAnswer,
        explanationArabic: explanation,
        maxScore: score,
        isDeleted: false
      };
      
      if (!editingId) {
        qData.orderIndex = Date.now();
      } else {
        const existing = questions.find(q => q.id === editingId);
        if (existing) qData.orderIndex = existing.orderIndex;
      }

      await saveQuestion({ id: editingId || undefined, ...qData } as TeacherQuestion);
      await loadData();
      resetForm();
    } catch (err) {
      alert(t("errors.failedToSave"));
    }
  };

  // AI File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setFileBase64(ev.target.result.toString());
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAI = async () => {
    if (!fileBase64) {
      setAiError(t("builder.errUploadPdfTxt"));
      return;
    }
    if (mcqCount === 0 && tfCount === 0) {
      setAiError(t("builder.errAtLeastOneQuestion"));
      return;
    }

    setIsGenerating(true);
    setAiError("");
    setGeneratedPreview(null);
    setPreviewPassage("");

    try {
      const res = await fetch("/api/ai/generate-reading-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileText: fileBase64,
          mcqCount,
          tfCount,
          difficulty
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setPreviewPassage(data.passage || "");
      setGeneratedPreview(data.questions || []);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : t("builder.errGenerateFailed"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveAI = async () => {
    if (!generatedPreview || !previewPassage) return;
    setIsGenerating(true);
    try {
      // 1. Save Passage
      await updateLessonPassage(resolvedParams.lessonId, previewPassage);
      setPassage(previewPassage);

      // 2. Save Questions
      const promises = generatedPreview.map((q, idx) => {
        const questionData = {
          lessonId: resolvedParams.lessonId,
          questionType: q.type as "READING_MULTIPLE_CHOICE" | "READING_TRUE_FALSE",
          question: q.question as string,
          optionsJson: JSON.stringify(q.options || []),
          correctAnswer: q.correctAnswer as string,
          explanationArabic: q.explanationArabic as string,
          maxScore: 1,
          orderIndex: Date.now() + idx,
          isDeleted: false
        } as TeacherQuestion;
        return saveQuestion(questionData);
      });
      await Promise.all(promises);
      
      setGeneratedPreview(null);
      setPreviewPassage("");
      await loadData();
      
      setActiveTab("MANUAL"); // Switch back to view
      alert(t("builder.readingSaved"));
    } catch(err: unknown) {
      alert(t("errors.failedToSave"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdatePreviewQuestion = (index: number, field: string, value: string | string[]) => {
    if (!generatedPreview) return;
    const newPreview = [...generatedPreview];
    newPreview[index] = { ...newPreview[index], [field]: value };
    setGeneratedPreview(newPreview);
  };

  const handleDeletePreviewQuestion = (index: number) => {
    if (!generatedPreview) return;
    const newPreview = [...generatedPreview];
    newPreview.splice(index, 1);
    setGeneratedPreview(newPreview);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/teacher/lessons/${resolvedParams.lessonId}/builder`} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("builder.readingActivity")}</h1>
            <p className="text-sm text-gray-500 mt-1">{t("builder.readingSubtitle")}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab("MANUAL")}
          className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "MANUAL" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          {t("builder.manualSetup")}
        </button>
        <button 
          onClick={() => setActiveTab("AI")}
          className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "AI" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <Sparkles className="w-4 h-4" /> {t("builder.aiGeneration")}
        </button>
      </div>

      {activeTab === "AI" ? (
        <div className="space-y-6">
          {!generatedPreview ? (
            <div className="bg-gray-100 rounded-xl border border-gray-400 shadow-sm p-6 lg:p-8">
              <div className="max-w-2xl mx-auto space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("builder.step1Upload")}</h3>
                  <p className="text-sm text-gray-500 mb-4">{t("builder.uploadPdfTxt")}</p>
                  <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-primary/50 transition-colors cursor-pointer">
                    <input type="file" accept=".pdf,.txt" className="hidden" onChange={handleFileUpload} />
                    <UploadCloud className="w-10 h-10 text-gray-400 mb-4" />
                    <p className="text-sm font-medium text-gray-900">{selectedFileName || t("builder.clickToUpload")}</p>
                    <p className="text-xs text-gray-500 mt-1">{t("builder.maxSize")}</p>
                  </label>
                </div>

                <div className="space-y-6 border-t pt-8">
                  <h3 className="text-lg font-semibold text-gray-900">{t("builder.step2Configuration")}</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("builder.mcqCount")}</label>
                      <input type="number" min="0" max="10" value={mcqCount} onChange={(e) => setMcqCount(parseInt(e.target.value) || 0)} className="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("builder.tfCount")}</label>
                      <input type="number" min="0" max="10" value={tfCount} onChange={(e) => setTfCount(parseInt(e.target.value) || 0)} className="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("builder.difficultyAndLength")}</label>
                    <div className="flex gap-2">
                      {["Easy", "Medium", "Hard"].map(lvl => (
                        <button key={lvl} onClick={() => setDifficulty(lvl)} className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${difficulty === lvl ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                          {t("builder." + lvl.toLowerCase())}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {aiError && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                    {aiError}
                  </div>
                )}

                <button 
                  onClick={handleGenerateAI}
                  disabled={isGenerating || (mcqCount === 0 && tfCount === 0)}
                  className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>{t("builder.generatingReading")}</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> {t("builder.generateReading")}</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <div>
                  <h3 className="font-semibold text-blue-900">{t("builder.reviewGenerated")}</h3>
                  <p className="text-sm text-blue-700 mt-1">{t("builder.reviewInstructions")}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setGeneratedPreview(null)} className="px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 rounded-lg transition-colors">
                    {t("builder.discard")}
                  </button>
                  <button onClick={handleApproveAI} disabled={isGenerating} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
                    <Save className="w-4 h-4" /> {isGenerating ? t("state.saving") : t("builder.approveAndSave")}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Passage Preview/Editor */}
                <div className="bg-gray-100 rounded-xl border border-gray-400 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpenText className="w-5 h-5 text-primary" /> {t("builder.generatedPassage")}
                  </h3>
                  <textarea 
                    rows={20}
                    value={previewPassage}
                    onChange={(e) => setPreviewPassage(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-4 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder={t("builder.editPassagePlaceholder")}
                  />
                  <p className="text-xs text-gray-500 mt-2">{t("builder.passageMustReview")}</p>
                </div>
                
                {/* Questions List Editor */}
                <div className="space-y-4">
                  {generatedPreview.map((q, qIdx) => (
                    <div key={qIdx} className="bg-gray-100 rounded-xl border border-gray-400 p-5 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">{q.type === "READING_MULTIPLE_CHOICE" ? t("builder.mcq") : t("builder.tf")}</span>
                        <button onClick={() => handleDeletePreviewQuestion(qIdx)} className="text-red-500 hover:text-red-700 text-sm">{t("builder.remove")}</button>
                      </div>
                      
                      <input 
                        type="text" 
                        value={String(q.question)} 
                        onChange={(e) => handleUpdatePreviewQuestion(qIdx, "question", e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 mb-3 font-medium text-gray-900"
                        placeholder={t("builder.questionTextPlaceholder")}
                      />
                      
                      {q.type === "READING_MULTIPLE_CHOICE" && Array.isArray(q.options) && (
                        <div className="space-y-2 mb-3">
                          {q.options.map((o: string, i: number) => (
                            <div key={i} className="flex gap-2 items-center">
                              <span className="text-sm font-semibold text-gray-500 w-4">{i+1}.</span>
                              <input 
                                type="text"
                                value={o}
                                onChange={(e) => {
                                  const newOpts = [...q.options as string[]];
                                  newOpts[i] = e.target.value;
                                  handleUpdatePreviewQuestion(qIdx, "options", newOpts);
                                }}
                                className={`flex-1 border p-1.5 text-sm rounded ${o === q.correctAnswer ? "border-green-500 bg-green-50" : "border-gray-300"}`}
                              />
                              <input 
                                type="radio" 
                                name={`correct-${qIdx}`} 
                                checked={o === q.correctAnswer}
                                onChange={() => handleUpdatePreviewQuestion(qIdx, "correctAnswer", o)}
                                className="w-4 h-4 text-green-600"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === "READING_TRUE_FALSE" && (
                        <select 
                          value={String(q.correctAnswer)}
                          onChange={(e) => handleUpdatePreviewQuestion(qIdx, "correctAnswer", e.target.value)}
                          className="w-full border border-gray-300 rounded p-2 mb-3 text-sm"
                        >
                          <option value="True">{t("builder.true")}</option>
                          <option value="False">{t("builder.false")}</option>
                        </select>
                      )}

                      <textarea 
                        rows={2}
                        dir="rtl"
                        value={String(q.explanationArabic)}
                        onChange={(e) => handleUpdatePreviewQuestion(qIdx, "explanationArabic", e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm text-right mt-2"
                        placeholder={t("builder.explanationAr")}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Editor Area (Passage + Questions form) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Passage Editor */}
            <div className="bg-gray-100 rounded-xl border border-gray-400 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex justify-between items-center">
                {t("builder.readingPassage")}
                <button onClick={handleSavePassage} className="text-sm bg-primary text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-primary/90">
                  <Save className="w-4 h-4" /> {t("builder.savePassage")}
                </button>
              </h3>
              <textarea 
                rows={8}
                value={passage}
                onChange={(e) => setPassage(e.target.value)}
                placeholder={t("builder.passagePlaceholder")}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* 2. Questions Form */}
            <div className="bg-gray-100 rounded-xl border border-gray-400 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingId ? t("builder.editQuestion") : t("builder.addQuestion")}
              </h3>
              
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => { setQType("READING_MULTIPLE_CHOICE"); setCorrectAnswer(""); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${qType === "READING_MULTIPLE_CHOICE" ? "bg-primary/10 border-primary text-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {t("builder.mcqCount")}
                </button>
                <button 
                  onClick={() => { setQType("READING_TRUE_FALSE"); setCorrectAnswer(""); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${qType === "READING_TRUE_FALSE" ? "bg-primary/10 border-primary text-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
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
                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {qType === "READING_MULTIPLE_CHOICE" && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">{t("builder.optionsLabel")}</label>
                    {options.map((opt, idx) => (
                      <input 
                        key={idx}
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...options];
                          newOpts[idx] = e.target.value;
                          setOptions(newOpts);
                        }}
                        className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    ))}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">{t("builder.correctAnswer")}</label>
                      <select 
                        required
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="">{t("builder.selectCorrectOption")}</option>
                        {options.filter(o => o.trim() !== "").map((opt, idx) => (
                          <option key={idx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {qType === "READING_TRUE_FALSE" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("builder.correctAnswer")}</label>
                    <select 
                      required
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("builder.scoreLabel")}</label>
                  <input 
                    type="number"
                    min="1"
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
          </div>

          {/* Questions List */}
          <div className="lg:col-span-5 bg-gray-50 rounded-xl border border-gray-200 p-4 h-fit sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex justify-between items-center">
              {t("builder.readingQuestionsCount", { count: questions.length })}
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
