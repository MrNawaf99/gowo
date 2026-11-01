import { z } from "zod";

export const AiAnalysisSchema = z.object({
  grammar: z.enum(["Excellent", "Good", "Medium", "Weak", "N/A"]),
  vocabulary: z.enum(["Excellent", "Good", "Medium", "Weak", "N/A"]),
  sentenceStrength: z.enum(["Excellent", "Good", "Medium", "Weak", "N/A"]),
  topicRelevance: z.enum(["Excellent", "Good", "Medium", "Weak", "N/A"]),
  targetGrammar: z.enum(["Complete", "Partial", "None", "N/A"]).optional(),
  requiredVocabulary: z.object({
    required: z.array(z.string()),
    used: z.array(z.string()),
    missed: z.array(z.string())
  }).optional(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string())
});

export type AiAnalysis = z.infer<typeof AiAnalysisSchema>;

export const WritingSpeakingResultSchema = z.object({
  questionId: z.string(),
  mode: z.enum(["WRITE", "SPEAK"]).optional(),
  finalAnswerText: z.string().optional(),
  aiScore: z.number().optional(),
  aiFeedback: z.string().optional(),
  aiAnalysis: AiAnalysisSchema.optional(),
  reviewState: z.enum(["PENDING_REVIEW", "GRADED"]).default("PENDING_REVIEW"),
  finalScore: z.number().optional(),
  teacherOverride: z.boolean().default(false),
  teacherComment: z.string().optional(),
});

export type WritingSpeakingResult = z.infer<typeof WritingSpeakingResultSchema>;

export const ConversationTurnSchema = z.object({
  speaker: z.enum(["AI", "STUDENT"]),
  text: z.string(),
  timestamp: z.number(),
});

export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;

export const ConversationResultSchema = z.object({
  turns: z.array(ConversationTurnSchema),
  reviewState: z.enum(["PENDING_REVIEW", "GRADED", "ERROR"]).default("PENDING_REVIEW"),
  aiScore: z.number().optional(),
  aiFeedback: z.string().optional(),
  aiAnalysis: AiAnalysisSchema.optional(),
  finalScore: z.number().optional(),
  teacherComment: z.string().optional(),
});

export type ConversationResult = z.infer<typeof ConversationResultSchema>;

export const AnswerDataSchema = z.object({
  questionId: z.string(),
  questionType: z.string(),
  
  selectedOption: z.string().optional(),
  isCorrect: z.boolean().optional(),
  score: z.number().default(0),
  
  writingSpeakingData: WritingSpeakingResultSchema.optional(),
  conversationData: ConversationResultSchema.optional(),
});

export type AnswerData = z.infer<typeof AnswerDataSchema>;

export const AttemptSchema = z.object({
  id: z.string().optional(),
  studentId: z.string(),
  lessonId: z.string(),
  teacherId: z.string(),
  
  attemptNumber: z.number(),
  timestamp: z.number(),
  
  currentScore: z.number().default(0),
  maxScore: z.number().default(0),
  
  hasPendingReview: z.boolean().default(false),
  status: z.enum(["COMPLETED"]).default("COMPLETED"), 
  
  answers: z.array(AnswerDataSchema),
});

export type StudentAttempt = z.infer<typeof AttemptSchema>;
