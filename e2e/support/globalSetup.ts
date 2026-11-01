import { adminDb, E2E_ACTIVITY_ID, E2E_LESSON_ID, E2E_TEACHER_ID } from "./firestore";

export default async function globalSetup() {
  const db = adminDb();
  const now = Date.now();
  await db.collection("lessons").doc(E2E_LESSON_ID).set({
    title: "E2E Practice Lesson",
    level: "A1",
    grammarRule: "",
    orderIndex: 999,
    maxAttempts: 0,
    maxTimeMinutes: 0,
    showAnswersImmediately: false,
    showResultToStudent: true,
    isPublished: false,
    teacherId: E2E_TEACHER_ID,
    createdAt: now,
  });
  await db.collection("web_activities").doc(E2E_ACTIVITY_ID).set({
    lessonId: E2E_LESSON_ID,
    teacherId: E2E_TEACHER_ID,
    questionType: "AUDIO_MCQ",
    orderIndex: 1,
    maxScore: 1,
    question: "Listen and choose the correct answer",
    title: "Audio Practice",
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  });
}
