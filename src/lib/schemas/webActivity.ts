import { z } from "zod";

export const WebActivitySchema = z.object({
  id: z.string().optional(),
  lessonId: z.string(),
  teacherId: z.string(),
  questionType: z.enum(["AUDIO_MCQ", "AUDIO_TRUE_FALSE", "SPEAKING_ACTIVITY", "AI_CONVERSATION", "AI_AUDIO"]),
  orderIndex: z.number(),
  
  // Existing fields (kept for backward compatibility or simple activities)
  audioUrl: z.string().optional(),
  question: z.string().optional(),
  optionsJson: z.string().optional(),
  correctAnswer: z.string().optional(),
  explanationArabic: z.string().optional(),
  maxScore: z.number().default(1),
  
  // Specific to AI_AUDIO
  difficulty: z.string().optional(),
  audioScript: z.string().optional(),
  questions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["MCQ", "TF"]),
      question: z.string(),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string(),
      explanation: z.string().optional()
    })
  ).optional(),
  
  title: z.string().optional(),
  instructions: z.string().optional(),
  
  createdAt: z.number(),
  isDeleted: z.boolean().default(false),
});

export type WebActivity = z.infer<typeof WebActivitySchema>;
