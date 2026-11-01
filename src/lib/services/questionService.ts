import { db } from "../firebase";
import { collection, doc, setDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { TeacherQuestion } from "../schemas/question";

const COLLECTION_NAME = "questions";

function isDummy() {
  return db.app.options.projectId === "dummy";
}

function getLocalQuestions(): Record<string, TeacherQuestion> {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem("dummy_questions");
  return data ? JSON.parse(data) : {};
}

function saveLocalQuestions(data: Record<string, TeacherQuestion>) {
  if (typeof window !== "undefined") {
    localStorage.setItem("dummy_questions", JSON.stringify(data));
  }
}

export async function getLessonQuestions(lessonId: string): Promise<TeacherQuestion[]> {
  if (isDummy()) {
    const local = getLocalQuestions();
    const arr = Object.values(local).filter(q => q.lessonId === lessonId && !q.isDeleted);
    return arr.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("lessonId", "==", lessonId),
      where("isDeleted", "==", false)
    );
    
    const snapshot = await getDocs(q);
    const questions: TeacherQuestion[] = [];
    snapshot.forEach((docSnap) => {
      questions.push({ id: docSnap.id, ...docSnap.data() } as TeacherQuestion);
    });

    const webQ = query(collection(db, "web_activities"), where("lessonId", "==", lessonId), where("isDeleted", "==", false));
    const webSnapshot = await getDocs(webQ);
    webSnapshot.forEach((docSnap) => {
      questions.push({ id: docSnap.id, ...docSnap.data() } as TeacherQuestion);
    });

    return questions.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  } catch (error) {
    console.warn("Failed to fetch from Firestore, returning empty array.", error);
    return [];
  }
}

export async function saveQuestion(question: TeacherQuestion): Promise<string> {
  if (isDummy()) {
    const local = getLocalQuestions();
    const id = question.id || "mock_" + Date.now();
    const dataToSave: Record<string, unknown> = { ...question, id, updatedAt: Date.now() };
    if (!question.id) dataToSave.createdAt = Date.now();
    local[id] = dataToSave as TeacherQuestion;
    saveLocalQuestions(local);
    return id;
  }

  try {
    const docRef = question.id ? doc(db, COLLECTION_NAME, question.id) : doc(collection(db, COLLECTION_NAME));
    const dataToSave: Record<string, unknown> = { ...question, id: docRef.id, updatedAt: Date.now() };
    if (!question.id) dataToSave.createdAt = Date.now();
    await setDoc(docRef, dataToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error saving question:", error);
    return "dev_dummy_" + Date.now();
  }
}

function getCollectionForType(type: string) {
  return ["AUDIO_MCQ", "AUDIO_TRUE_FALSE", "SPEAKING_ACTIVITY", "AI_CONVERSATION"].includes(type)
    ? "web_activities"
    : COLLECTION_NAME;
}

export async function deleteQuestion(questionId: string, type: string = "MULTIPLE_CHOICE"): Promise<void> {
  if (isDummy()) {
    const local = getLocalQuestions();
    if (local[questionId]) {
      local[questionId].isDeleted = true;
      saveLocalQuestions(local);
    }
    return;
  }

  try {
    const colName = getCollectionForType(type);
    await updateDoc(doc(db, colName, questionId), { isDeleted: true, updatedAt: Date.now() });
  } catch (error) {
    console.error("Error deleting question:", error);
  }
}

export async function reorderQuestions(questions: TeacherQuestion[]): Promise<void> {
  if (isDummy()) {
    const local = getLocalQuestions();
    questions.forEach((q, index) => {
      if (local[q.id!]) {
        local[q.id!].orderIndex = index;
      }
    });
    saveLocalQuestions(local);
    return;
  }

  try {
    const updates = questions.map((q, index) => {
      const colName = getCollectionForType(q.questionType);
      return updateDoc(doc(db, colName, q.id!), { orderIndex: index });
    });
    await Promise.all(updates);
  } catch (error) {
    console.error("Error reordering:", error);
  }
}
