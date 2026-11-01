"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Settings2, Sparkles } from "lucide-react";
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
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-4 group hover:border-primary/50 transition-colors">
      <div {...attributes} {...listeners} className="mt-1 cursor-grab text-gray-400 hover:text-gray-600">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {isTF ? "True/False" : "Multiple Choice"}
          </span>
          <span className="text-xs text-gray-500">Score: {question.maxScore}</span>
        </div>
        <p className="text-gray-900 font-medium mb-2">{question.question}</p>
        <div className="text-sm text-gray-600 mb-2">
          Correct: <span className="font-semibold text-green-600">{question.correctAnswer}</span>
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
export default function OptionsBuilderPage({ params }: { params: { lessonId: string } }) {
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

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.lessonId]);

  const loadQuestions = async () => {
    setLoading(true);
    const qs = await getLessonQuestions(params.lessonId);
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
      alert("Please enter the question text.");
      return;
    }
    if (!correctAnswer.trim()) {
      alert("Please provide the correct answer.");
      return;
    }

    let optionsJson = '["True", "False"]';
    if (qType === "MULTIPLE_CHOICE") {
      const validOptions = options.filter(o => o.trim() !== "");
      if (validOptions.length < 2) {
        alert("Please provide at least 2 options.");
        return;
      }
      if (!validOptions.includes(correctAnswer)) {
        alert("Correct answer must be exactly one of the options.");
        return;
      }
      optionsJson = JSON.stringify(validOptions);
    }

    const newQ: TeacherQuestion = {
      id: editingId || undefined,
      lessonId: params.lessonId,
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
        <Link href={`/teacher/lessons/${params.lessonId}/builder`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Options / True-False</h1>
      </div>

      {/* Mode Switcher */}
      <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex">
        <button 
          onClick={() => setMode("Manual")}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${mode === "Manual" ? "bg-primary text-white shadow" : "text-gray-600 hover:text-gray-900"}`}
        >
          Manual
        </button>
        <button 
          onClick={() => setMode("AI")}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${mode === "AI" ? "bg-primary text-white shadow" : "text-gray-600 hover:text-gray-900"}`}
        >
          <Sparkles className="w-4 h-4" /> AI
        </button>
      </div>

      {mode === "AI" ? (
        <div className="bg-white rounded-xl border border-dashed border-primary p-12 text-center">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">AI Generation</h2>
          <p className="text-gray-500 max-w-md mx-auto">This feature is scheduled for Phase 4. You will be able to upload a file and instantly generate MCQs and True/False questions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Question Editor */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => { setQType("MULTIPLE_CHOICE"); setCorrectAnswer(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${qType === "MULTIPLE_CHOICE" ? "bg-primary/10 border-primary text-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                Options (MCQ)
              </button>
              <button 
                onClick={() => { setQType("TRUE_FALSE"); setCorrectAnswer(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${qType === "TRUE_FALSE" ? "bg-primary/10 border-primary text-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                True / False
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
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
                  <label className="block text-sm font-medium text-gray-700">Options</label>
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
                      className="w-full border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  ))}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">Correct Answer</label>
                    <select 
                      required
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="w-full border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Select correct option...</option>
                      {options.filter(o => o.trim() !== "").map((opt, idx) => (
                        <option key={idx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {qType === "TRUE_FALSE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                  <select 
                    required
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Select...</option>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (Arabic)</label>
                <textarea 
                  rows={2}
                  dir="rtl"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
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
                    Cancel
                  </button>
                )}
                <button type="submit" className="flex-1 bg-primary text-white py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium">
                  {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? "Update Question" : "Add Question"}
                </button>
              </div>
            </form>
          </div>

          {/* Questions List */}
          <div className="lg:col-span-5 bg-gray-50 rounded-xl border border-gray-200 p-4 min-h-[400px]">
            <h3 className="font-semibold text-gray-900 mb-4 flex justify-between items-center">
              Questions ({questions.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                No questions added yet.
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
