"use client";
import { useTranslation } from "@/i18n/useTranslation";

import { useState, useEffect, use} from "react";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Settings2, Sparkles, PenLine } from "lucide-react";
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
import WritingSpeakingActivity from "@/components/quiz/WritingSpeakingActivity";

function SortableQuestionItem({ question, onEdit, onDelete, onPreview }: { question: TeacherQuestion, onEdit: () => void, onDelete: () => void, onPreview: () => void }) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id! });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-100 border border-gray-400 rounded-lg p-4 flex items-start gap-4 group hover:border-primary/50 transition-colors">
      <div {...attributes} {...listeners} className="mt-1 cursor-grab text-gray-400 hover:text-gray-600">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1">
            <PenLine className="w-3 h-3" /> {t("builder.writingActivity")}
          </span>
          <span className="text-xs text-gray-500">{t("builder.minChars", { count: 'requiredCharacterCount' in question ? (question.requiredCharacterCount ?? 0) : 0 })}</span>
        </div>
        <p className="text-gray-900 font-medium mb-2 line-clamp-2">{question.question}</p>
      </div>
      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onPreview} className="text-gray-500 hover:text-green-600" title={t("builder.previewStudentView")}>
          <Sparkles className="w-4 h-4" />
        </button>
        <button onClick={onEdit} className="text-gray-500 hover:text-primary" title={t("common.edit")}>
          <Settings2 className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="text-gray-500 hover:text-red-500" title={t("common.delete")}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function WritingBuilderPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const resolvedParams = use(params);
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<TeacherQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [charCount, setCharCount] = useState(0);

  // Preview State
  const [previewQuestion, setPreviewQuestion] = useState<TeacherQuestion | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.lessonId]);

  const loadQuestions = async () => {
    setLoading(true);
    const qs = await getLessonQuestions(resolvedParams.lessonId);
    setQuestions(qs.filter(q => q.questionType === "WRITING"));
    setLoading(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over?.id);
      const newOrder = arrayMove(questions, oldIndex, newIndex);
      setQuestions(newOrder);
      await reorderQuestions(newOrder);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setQuestionText("");
    setCharCount(0);
  };

  const handleEdit = (q: TeacherQuestion) => {
    setEditingId(q.id!);
    setQuestionText(q.question);
    setCharCount('requiredCharacterCount' in q ? q.requiredCharacterCount as number : 0);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      await deleteQuestion(id);
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText) return;

    const newQ: TeacherQuestion = {
      id: editingId || undefined,
      lessonId: resolvedParams.lessonId,
      questionType: "WRITING",
      question: questionText,
      optionsJson: '[]',
      correctAnswer: "",
      explanationArabic: "",
      maxScore: 10,
      isDeleted: false,
      requiredCharacterCount: charCount,
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
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href={`/teacher/lessons/${resolvedParams.lessonId}/builder`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 rtl:rotate-180" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t("builder.writingActivity")}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Editor Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-100 rounded-xl border border-gray-400 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editingId ? t("builder.editActivity") : t("builder.addActivity")}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("builder.questionPrompt")}</label>
                <textarea 
                  required 
                  rows={4} 
                  value={questionText} 
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={t("builder.writingPromptPlaceholder")}
                  className="w-full border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("builder.requiredCharCount")}</label>
                <input 
                  type="number"
                  min="0"
                  value={charCount}
                  onChange={(e) => setCharCount(parseInt(e.target.value) || 0)}
                  placeholder={t("builder.charCountPlaceholder")}
                  className="w-full border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">{t("builder.charCountHint")}</p>
              </div>

              <div className="flex gap-2 pt-4">
                {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">{t("common.cancel")}</button>}
                <button type="submit" className="flex-1 bg-primary text-white py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium">
                  {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? t("builder.updateActivity") : t("builder.addActivity")}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 min-h-[400px]">
            <h3 className="font-semibold text-gray-900 mb-4">{t("builder.activitiesCount", { count: questions.length })}</h3>
            
            {loading ? <div className="text-center py-12 text-gray-500">{t("state.loading")}</div> : questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">{t("builder.noActivitiesYet")}</div>
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
                        onPreview={() => setPreviewQuestion(q)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
          
          {/* Preview Section */}
          {previewQuestion && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> {t("builder.studentViewPreview")}
                </h3>
                <button onClick={() => setPreviewQuestion(null)} className="text-sm font-medium text-gray-500 hover:text-gray-900">
                  {t("builder.closePreview")}
                </button>
              </div>
              <WritingSpeakingActivity 
                question={previewQuestion} 
                onChange={(res) => console.log("Preview Change:", res)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
