import { db } from "../firebase";
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore";
import { WebActivity } from "../schemas/webActivity";

const COLLECTION_NAME = "web_activities";

export async function saveWebActivity(activity: WebActivity): Promise<string> {
  const docRef = activity.id ? doc(db, COLLECTION_NAME, activity.id) : doc(collection(db, COLLECTION_NAME));
  const data = { ...activity, id: docRef.id };
  if(db.app.options.projectId === "dummy") { console.warn("Dummy write skipped"); return "mock_id" as never; } await setDoc(docRef, data);
  return docRef.id;
}

export async function getLessonWebActivities(lessonId: string): Promise<WebActivity[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("lessonId", "==", lessonId),
    where("isDeleted", "==", false)
  );
  
  const snapshot = await getDocs(q);
  const activities: WebActivity[] = [];
  snapshot.forEach((docSnap) => {
    activities.push({ id: docSnap.id, ...docSnap.data() } as WebActivity);
  });
  
  return activities.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
}

export async function deleteWebActivity(activityId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, activityId);
  if(db.app.options.projectId === "dummy") { console.warn("Dummy delete skipped"); return; } 
  await setDoc(docRef, { isDeleted: true }, { merge: true });
}
