import crypto from "crypto";
import { adminDb } from "../firebaseAdmin.ts";

export interface StudentAccount {
  id: string; // Document ID
  studentId: string; // Academy student identifier, e.g. "STD-001"
  username: string; // Unique username (lowercase)
  name: string; // Full name
  passwordHash: string; // PBKDF2 hash
  salt: string; // Random salt
  isActive: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface StudentSession {
  id: string;
  studentId: string;
  username: string;
  name: string;
}

/**
 * Hash a password using PBKDF2 with SHA-512 and a cryptographically secure random salt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return { hash, salt };
}

/**
 * Verify a candidate password against stored hash and salt using timing-safe comparison.
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  if (!password || !storedHash || !salt) return false;
  try {
    const hashBuffer = Buffer.from(storedHash, "hex");
    const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512");
    if (hashBuffer.length !== testHash.length) {
      return false;
    }
    return crypto.timingSafeEqual(hashBuffer, testHash);
  } catch (err) {
    console.error("Error verifying password:", err);
    return false;
  }
}

/**
 * Look up a student by username (case-insensitive) or academy studentId.
 */
export async function getStudentByIdentifier(identifier: string): Promise<StudentAccount | null> {
  if (!adminDb) {
    throw new Error("Firebase Admin DB is not initialized.");
  }

  const cleanIdentifier = identifier.trim();
  const lowerIdentifier = cleanIdentifier.toLowerCase();

  // 1. Try matching by username
  const usernameQuery = await adminDb
    .collection("students")
    .where("username", "==", lowerIdentifier)
    .limit(1)
    .get();

  if (!usernameQuery.empty) {
    const doc = usernameQuery.docs[0];
    return { id: doc.id, ...doc.data() } as StudentAccount;
  }

  // 2. Try matching by studentId (exact code)
  const idQuery = await adminDb
    .collection("students")
    .where("studentId", "==", cleanIdentifier)
    .limit(1)
    .get();

  if (!idQuery.empty) {
    const doc = idQuery.docs[0];
    return { id: doc.id, ...doc.data() } as StudentAccount;
  }

  return null;
}

/**
 * Server-side authentication for students.
 */
export async function authenticateStudent(
  identifier: string,
  password: string
): Promise<{ success: boolean; student?: StudentSession; error?: string }> {
  if (!identifier.trim() || !password.trim()) {
    return { success: false, error: "Identifier and password are required." };
  }

  try {
    const student = await getStudentByIdentifier(identifier);

    if (!student) {
      return { success: false, error: "Invalid student credentials." };
    }

    if (student.isActive === false) {
      return { success: false, error: "This account has been deactivated. Please contact the academy administration." };
    }

    let isValid = false;

    // Check PBKDF2 hash if present
    if (student.passwordHash && student.salt) {
      isValid = verifyPassword(password, student.passwordHash, student.salt);
    } else if ((student as unknown as { pin?: string }).pin) {
      // Fallback for initial provisioned pin/plain password
      isValid = (student as unknown as { pin: string }).pin === password;
      // Upgrade to secure hash on next update
      if (isValid && adminDb) {
        const { hash, salt } = hashPassword(password);
        adminDb.collection("students").doc(student.id).update({
          passwordHash: hash,
          salt,
          updatedAt: Date.now(),
        }).catch(e => console.error("Auto-migrating password hash failed", e));
      }
    }

    if (!isValid) {
      return { success: false, error: "Invalid student credentials." };
    }

    return {
      success: true,
      student: {
        id: student.id,
        studentId: student.studentId || student.id,
        username: student.username,
        name: student.name,
      },
    };
  } catch (err) {
    console.error("Student authentication error:", err);
    return { success: false, error: "Authentication service unavailable. Please try again later." };
  }
}

/**
 * Provision / create a student account (Admin function only).
 */
export async function createStudentAccount(data: {
  studentId: string;
  username: string;
  name: string;
  password: string;
}): Promise<StudentAccount> {
  if (!adminDb) {
    throw new Error("Firebase Admin DB is not initialized.");
  }

  const cleanUsername = data.username.trim().toLowerCase();
  const cleanId = data.studentId.trim();

  // Check uniqueness
  const existing = await getStudentByIdentifier(cleanUsername);
  if (existing) {
    throw new Error(`Student with username "${cleanUsername}" or ID "${cleanId}" already exists.`);
  }

  const { hash, salt } = hashPassword(data.password);
  const docRef = adminDb.collection("students").doc();

  const newStudent: StudentAccount = {
    id: docRef.id,
    studentId: cleanId,
    username: cleanUsername,
    name: data.name.trim(),
    passwordHash: hash,
    salt,
    isActive: true,
    createdAt: Date.now(),
  };

  await docRef.set(newStudent);
  return newStudent;
}
