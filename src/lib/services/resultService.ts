import { db } from "../firebase";
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore";
import { StudentAttempt } from "../schemas/result";

const COLLECTION_NAME = "web_results";

export async function saveAttempt(attempt: StudentAttempt): Promise<string> {
  const docRef = attempt.id ? doc(db, COLLECTION_NAME, attempt.id) : doc(collection(db, COLLECTION_NAME));
  const dataToSave: Record<string, unknown> = {
    ...attempt,
    id: docRef.id,
  };
  if(db.app.options.projectId === "dummy") { console.warn("Dummy write skipped"); return "mock_id" as never; } await setDoc(docRef, dataToSave);
  return docRef.id;
}

export async function getStudentAttempts(lessonId: string, studentId: string): Promise<StudentAttempt[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("lessonId", "==", lessonId),
    where("studentId", "==", studentId)
  );
  
  const snapshot = await getDocs(q);
  const attempts: StudentAttempt[] = [];
  snapshot.forEach((docSnap) => {
    attempts.push({ id: docSnap.id, ...docSnap.data() } as StudentAttempt);
  });
  
  return attempts.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
}

export async function getAttempt(attemptId: string): Promise<StudentAttempt | null> {
  // To avoid needing another index or direct get, usually we can just query by id if it's stored, or use doc.
  // Wait, if we use doc we can just use getDoc.
  const { getDoc } = await import("firebase/firestore");
  const docRef = doc(db, COLLECTION_NAME, attemptId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as StudentAttempt;
}

export async function getLessonAttemptsForTeacher(lessonId: string): Promise<StudentAttempt[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("lessonId", "==", lessonId)
  );
  
  const snapshot = await getDocs(q);
  const attempts: StudentAttempt[] = [];
  snapshot.forEach((docSnap) => {
    attempts.push({ id: docSnap.id, ...docSnap.data() } as StudentAttempt);
  });
  
  return attempts;
}

export async function updateAttempt(attemptId: string, data: Partial<StudentAttempt>): Promise<void> {
  const { updateDoc } = await import("firebase/firestore");
  const docRef = doc(db, COLLECTION_NAME, attemptId);
  if(db.app.options.projectId === "dummy") { console.warn("Dummy write skipped"); return "mock_id" as never; } await updateDoc(docRef, data);
}
