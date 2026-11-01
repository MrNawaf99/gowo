import { getGrammarLesson, getGrammarLessons } from "@/lib/grammar";
import { notFound } from "next/navigation";
import QuizClient from "./QuizClient";

export async function generateStaticParams() {
  const lessons = await getGrammarLessons();
  return lessons.map((lesson) => ({
    lessonId: lesson.lessonId,
  }));
}

export default async function QuizPage({ params }: { params: Promise<{ lessonId: string }> }) {
  // Await the params object in Next.js 15
  const resolvedParams = await params;
  const lesson = await getGrammarLesson(resolvedParams.lessonId);

  if (!lesson) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <QuizClient lesson={lesson} />
    </div>
  );
}
