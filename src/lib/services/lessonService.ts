import { db } from "../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

const COLLECTION_NAME = "lessons";

export async function getLessonPassage(lessonId: string): Promise<string> {
  try {
    const docRef = doc(db, COLLECTION_NAME, lessonId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().readingPassage || "";
    }
  } catch (error) {
    console.error("Failed to get lesson passage:", error);
  }
  return "";
}

export async function updateLessonPassage(lessonId: string, passage: string): Promise<void> {
  try {
    if (db.app.options.projectId === "dummy") {
      console.warn("Dummy Firebase - skipping updateLessonPassage");
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, lessonId);
    await updateDoc(docRef, {
      readingPassage: passage,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Failed to update lesson passage:", error);
  }
}

export interface TeacherLesson {
  id: string;
  teacherId: string;
  title: string;
  titleAr?: string;
  titleEn?: string;
  level: string;
  grammarRule: string;
  orderIndex: number;
  maxAttempts: number;
  maxTimeMinutes: number;
  showAnswersImmediately: boolean;
  showResultToStudent: boolean;
  isPublished: boolean;
  readingPassage?: string;
}

export async function getLesson(lessonId: string): Promise<TeacherLesson | null> {
  const docRef = doc(db, COLLECTION_NAME, lessonId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as TeacherLesson;
  }
  return null;
}

export async function getPublishedLessons(teacherId: string): Promise<TeacherLesson[]> {
  const { collection, query, where, getDocs } = await import("firebase/firestore");
  const q = query(
    collection(db, COLLECTION_NAME),
    where("teacherId", "==", teacherId),
    where("isPublished", "==", true)
  );
  const snapshot = await getDocs(q);
  const lessons: TeacherLesson[] = [];
  snapshot.forEach((d) => {
    lessons.push({ id: d.id, ...d.data() } as TeacherLesson);
  });
  return lessons.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
}

export async function getAllLessonsForTeacher(
  teacherId: string
): Promise<TeacherLesson[]> {
  if (db.app.options.projectId === "dummy") {
    throw new Error(
      "Firebase is not configured. Please set NEXT_PUBLIC_FIREBASE_* environment variables."
    );
  }

  if (!teacherId.trim()) {
    throw new Error("Teacher ID is missing.");
  }

  try {
    const {
      collection,
      query,
      where,
      getDocs,
    } = await import("firebase/firestore");

    const q = query(
      collection(db, COLLECTION_NAME),
      where("teacherId", "==", teacherId)
    );

    const snapshot = await getDocs(q);

    const lessons: TeacherLesson[] = [];

    snapshot.forEach((d) => {
      lessons.push({
        id: d.id,
        ...d.data(),
      } as TeacherLesson);
    });

    return lessons.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  } catch (error) {
    console.error(
      `Failed to load lessons for teacher "${teacherId}":`,
      error
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to load lessons from Firebase."
    );
  }
}

export async function createLesson(data: Omit<TeacherLesson, "id">): Promise<string> {
  // If we are running with dummy credentials, don't hang indefinitely on addDoc
  if (db.app.options.projectId === "dummy") {
    console.warn("Using dummy Firebase credentials. Returning mock lesson ID.");
    return "mock_lesson_" + Date.now();
  }
  
  const { collection, addDoc } = await import("firebase/firestore");
  const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
  return docRef.id;
}


export async function updateLessonPublishStatus(lessonId: string, isPublished: boolean): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, lessonId);
  await updateDoc(docRef, { isPublished });
}


export async function deleteLesson(lessonId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, lessonId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Failed to delete lesson:", error);
    throw error;
  }
}

export async function updateLessonConfig(lessonId: string, updates: Partial<TeacherLesson>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, lessonId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Failed to update lesson config:", error);
    throw error;
  }
}
