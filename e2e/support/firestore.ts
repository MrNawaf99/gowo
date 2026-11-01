import fs from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/** Test data lives under these fixed ids and is removed by globalTeardown. */
export const E2E_LESSON_ID = "qa_e2e_pron_lesson";
export const E2E_ACTIVITY_ID = "qa_e2e_pron_activity";
export const E2E_TEACHER_ID = "qa_audit_teacher";

export function adminDb() {
  if (!getApps().length) {
    const env: Record<string, string> = {};
    for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z_0-9]+)\s*=\s*(.*)$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

export async function sessionsFor(studentId: string) {
  const snap = await adminDb().collection("study_sessions").where("studentId", "==", studentId).get();
  return snap.docs.map((d) => d.data()).sort((a, b) => a.sessionNumber - b.sessionNumber);
}
