import { adminDb, E2E_ACTIVITY_ID, E2E_LESSON_ID } from "./firestore";

/** Removes every document the E2E run created. */
export default async function globalTeardown() {
  const db = adminDb();
  const batch = db.batch();
  for (const collection of ["study_sessions", "study_session_heads"]) {
    const snap = await db.collection(collection).where("activityId", "==", E2E_ACTIVITY_ID).get();
    snap.docs.forEach((d) => batch.delete(d.ref));
  }
  const results = await db.collection("web_results").where("lessonId", "==", E2E_LESSON_ID).get();
  results.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(db.collection("web_activities").doc(E2E_ACTIVITY_ID));
  batch.delete(db.collection("lessons").doc(E2E_LESSON_ID));
  await batch.commit();
}
