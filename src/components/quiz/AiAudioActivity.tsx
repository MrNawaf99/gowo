import { useTranslation } from "@/i18n/useTranslation";
import { Play } from "lucide-react";
import { TeacherQuestion } from "@/lib/schemas/question";
import { AnswerData } from "@/lib/schemas/result";

interface AiAudioActivityProps {
  activity: TeacherQuestion;
  answers: Record<string, AnswerData>;
  onChange: (subId: string, option: string) => void;
}

export default function AiAudioActivity({ activity, answers, onChange }: AiAudioActivityProps) {
  const { t } = useTranslation();
  // Use unknown to bypass type checker temporarily for nested questions array since TeacherQuestion definition isn't fully nested
  const questions = (activity as unknown as { questions: { id: string, type: string, question: string, options?: string[], correctAnswer: string }[] }).questions || [];

  return (
    <div className="space-y-8 animate-in fade-in">
      {activity.audioUrl && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 md:p-5 sticky top-0 z-10 shadow-sm backdrop-blur-md">
          <p className="text-sm font-semibold text-blue-500 mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 fill-current" /> {t("quiz.listenCarefully")}
          </p>
          <audio controls src={activity.audioUrl} className="w-full h-11" />
        </div>
      )}

      <div className="space-y-8">
        {questions.map((q, i) => {
          const subId = `${activity.id}_${q.id}`;
          const selected = answers[subId]?.selectedOption;

          return (
            <div key={q.id} className="bg-gray-100 border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-lg font-bold text-gray-900">
                <span className="text-primary me-2">{i + 1}.</span> {q.question}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.type === "TF" ? (
                  ["True", "False"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => onChange(subId, opt)}
                      className={`text-start px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm md:text-base ${
                        selected === opt 
                        ? "border-primary bg-primary/5 font-bold text-primary shadow-sm" 
                        : "border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {opt}
                    </button>
                  ))
                ) : (
                  q.options?.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => onChange(subId, opt)}
                      className={`text-start px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm md:text-base ${
                        selected === opt 
                        ? "border-primary bg-primary/5 font-bold text-primary shadow-sm" 
                        : "border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {opt}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
