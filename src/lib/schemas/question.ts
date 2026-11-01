import { z } from "zod";

// Base schema for shared fields
const BaseQuestionSchema = z.object({
  id: z.string().optional(),
  lessonId: z.string(),
  question: z.string().min(1, "Question text is required"),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanationArabic: z.string().optional(),
  maxScore: z.number().default(1),
  isDeleted: z.boolean().default(false),
  audioUrl: z.string().optional(),
  orderIndex: z.number().default(0), // For Web Quiz Engine ordering
});

// MULTIPLE_CHOICE
export const MultipleChoiceSchema = BaseQuestionSchema.extend({
  questionType: z.literal("MULTIPLE_CHOICE"),
  optionsJson: z.string().refine((val) => {
    try {
      const arr = JSON.parse(val);
      return Array.isArray(arr) && arr.length >= 2;
    } catch {
      return false;
    }
  }, "Options must be a valid JSON array with at least 2 items"),
});

// TRUE_FALSE
export const TrueFalseSchema = BaseQuestionSchema.extend({
  questionType: z.literal("TRUE_FALSE"),
  optionsJson: z.string().default('["True", "False"]'),
});

// READING_MULTIPLE_CHOICE
export const ReadingMultipleChoiceSchema = MultipleChoiceSchema.extend({
  questionType: z.literal("READING_MULTIPLE_CHOICE"),
});

// READING_TRUE_FALSE
export const ReadingTrueFalseSchema = TrueFalseSchema.extend({
  questionType: z.literal("READING_TRUE_FALSE"),
});

// WRITING (Unified Writing / Speaking)
export const WritingSchema = BaseQuestionSchema.extend({
  questionType: z.literal("WRITING"),
  optionsJson: z.string().default('[]'),
  requiredCharacterCount: z.number().default(0),
  evaluationGuidance: z.string().optional(),
  requiredVocabulary: z.array(z.string()).optional(),
});

// General Question Type for TypeScript
export type TeacherQuestion = 
  | z.infer<typeof MultipleChoiceSchema>
  | z.infer<typeof TrueFalseSchema>
  | z.infer<typeof ReadingMultipleChoiceSchema>
  | z.infer<typeof ReadingTrueFalseSchema>
  | z.infer<typeof WritingSchema>
  | (z.infer<typeof BaseQuestionSchema> & { 
      questionType: "AUDIO_MCQ" | "AUDIO_TRUE_FALSE" | "SPEAKING_ACTIVITY" | "AI_CONVERSATION" | "AI_AUDIO", 
      optionsJson?: string,
      difficulty?: string,
      audioScript?: string,
      questions?: unknown[],
      evaluationGuidance?: string,
      requiredVocabulary?: string[],
      title?: string,
      instructions?: string,
    });
