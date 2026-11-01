export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'READING_MULTIPLE_CHOICE'
  | 'READING_TRUE_FALSE'
  | 'WRITING';

export interface GrammarQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  explanationAr: string;
}

export interface GrammarLesson {
  lessonId: string;
  title: string;
  titleAr: string;
  questions: GrammarQuestion[];
}
