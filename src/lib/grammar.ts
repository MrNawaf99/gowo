import fs from 'fs';
import path from 'path';
import { GrammarLesson } from '@/types/grammar';

export async function getGrammarLessons(): Promise<Omit<GrammarLesson, 'questions'>[]> {
  const grammarDir = path.join(process.cwd(), 'public/data/grammar');
  
  if (!fs.existsSync(grammarDir)) {
    return [];
  }

  const files = fs.readdirSync(grammarDir).filter(f => f.endsWith('.json'));
  
  const lessons = files.map(file => {
    const content = fs.readFileSync(path.join(grammarDir, file), 'utf-8');
    const data = JSON.parse(content) as GrammarLesson;
    return {
      lessonId: data.lessonId,
      title: data.title,
      titleAr: data.titleAr,
    };
  });

  return lessons;
}

export async function getGrammarLesson(lessonId: string): Promise<GrammarLesson | null> {
  const filePath = path.join(process.cwd(), 'public/data/grammar', `${lessonId}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as GrammarLesson;
}
