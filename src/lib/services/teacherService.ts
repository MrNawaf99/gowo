import { collection, query, where, getDocs, doc, getDoc, getCountFromServer, limit } from "firebase/firestore";
import { db } from "../firebase";

export interface TeacherProfile {
  id: string;
  name: string;
  username: string;
  isVisible: boolean;
  pin?: string;
}

export async function getVisibleTeachers(): Promise<TeacherProfile[]> {
  const teachersRef = collection(db, "teachers");
  const q = query(teachersRef, where("isVisible", "==", true));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TeacherProfile[];
}

export async function getTeacherByUsername(username: string): Promise<TeacherProfile | null> {
  const teachersRef = collection(db, "teachers");
  const q = query(teachersRef, where("username", "==", username.trim().toLowerCase()), limit(1));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as TeacherProfile;
  }
  return null;
}

export async function getTeacherLessonCount(teacherId: string): Promise<number> {
  const lessonsRef = collection(db, "lessons");
  const q = query(
    lessonsRef, 
    where("teacherId", "==", teacherId),
    where("isPublished", "==", true)
  );
  
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

export async function getTeacherProfile(teacherId: string): Promise<TeacherProfile | null> {
  const docRef = doc(db, "teachers", teacherId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as TeacherProfile;
  }
  return null;
}
