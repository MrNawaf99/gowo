import { adminDb } from "../firebaseAdmin";

export interface TeacherAccount {
  id: string;
  name: string;
  username: string;
  isVisible: boolean;
}

export interface TeacherAuthResult {
  success: boolean;
  teacher?: {
    id: string;
    username: string;
    name: string;
  };
  error?: string;
}

export async function authenticateTeacher(username: string, pinOrPass: string): Promise<TeacherAuthResult> {
  if (!adminDb) {
    return { success: false, error: "Database configuration unavailable." };
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanPin = pinOrPass.trim();

  try {
    const snap = await adminDb
      .collection("teachers")
      .where("username", "==", cleanUsername)
      .limit(1)
      .get();

    if (snap.empty) {
      return { success: false, error: "Invalid teacher credentials." };
    }

    const doc = snap.docs[0];
    const data = doc.data();

    if (data.isDeleted === true) {
      return { success: false, error: "Teacher account has been deactivated." };
    }

    // Check PIN or password
    const validPin = (data.pin || "").toString().trim();
    if (cleanPin !== validPin) {
      return { success: false, error: "Invalid teacher credentials." };
    }

    return {
      success: true,
      teacher: {
        id: doc.id,
        username: data.username,
        name: data.name || "Teacher",
      },
    };
  } catch (err) {
    console.error("Teacher authentication error:", err);
    return { success: false, error: "Authentication service error." };
  }
}
