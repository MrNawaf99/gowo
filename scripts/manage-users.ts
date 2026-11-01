/**
 * GoWord Academy - Administrative User Provisioning Tool
 * 
 * Used exclusively by academy administration to invite, provision, list,
 * and manage teacher and student accounts (No public registration).
 *
 * Usage Examples:
 *   node --env-file=.env.local -e "require('./scripts/manage-users.ts').listAllUsers()"
 *   node --env-file=.env.local -e "require('./scripts/manage-users.ts').createTeacher({ username: 'fatima', name: 'فاطمة', pin: '5566' })"
 *   node --env-file=.env.local -e "require('./scripts/manage-users.ts').createStudent({ studentId: 'STD-005', username: 'student5', name: 'Khalid', password: 'password123' })"
 *   node --env-file=.env.local -e "require('./scripts/manage-users.ts').deleteTeacher('fatima')"
 *   node --env-file=.env.local -e "require('./scripts/manage-users.ts').deleteStudent('student5')"
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) privateKey = privateKey.replace(/\\n/g, "\n");

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const db = getFirestore();

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return { hash, salt };
}

export async function createStudent(data: {
  studentId: string;
  username: string;
  name: string;
  password: string;
}) {
  const cleanUsername = data.username.trim().toLowerCase();
  const cleanStudentId = data.studentId.trim();

  const existing = await db
    .collection("students")
    .where("username", "==", cleanUsername)
    .limit(1)
    .get();

  if (!existing.empty) {
    console.log(`Student with username ${cleanUsername} already exists.`);
    return existing.docs[0].id;
  }

  const { hash, salt } = hashPassword(data.password);
  const docRef = db.collection("students").doc(`student_${cleanUsername}`);

  const studentData = {
    id: docRef.id,
    studentId: cleanStudentId,
    username: cleanUsername,
    name: data.name.trim(),
    passwordHash: hash,
    salt,
    isActive: true,
    createdAt: Date.now(),
  };

  await docRef.set(studentData);
  console.log(`✓ Created student: ${data.name} (username: ${cleanUsername} | ID: ${cleanStudentId})`);
  return docRef.id;
}

export async function createTeacher(data: {
  username: string;
  name: string;
  pin: string;
}) {
  const cleanUsername = data.username.trim().toLowerCase();
  const cleanPin = data.pin.trim();
  const cleanName = data.name.trim();

  const existing = await db
    .collection("teachers")
    .where("username", "==", cleanUsername)
    .limit(1)
    .get();

  if (!existing.empty) {
    const docId = existing.docs[0].id;
    await db.collection("teachers").doc(docId).update({
      pin: cleanPin,
      name: cleanName,
      isDeleted: false,
      isVisible: true,
      updatedAt: Date.now(),
    });
    console.log(`✓ Updated existing teacher: ${cleanName} (username: ${cleanUsername} | PIN: ${cleanPin})`);
    return docId;
  }

  const docRef = db.collection("teachers").doc(`teacher_${cleanUsername}`);
  await docRef.set({
    username: cleanUsername,
    name: cleanName,
    pin: cleanPin,
    isVisible: true,
    isDeleted: false,
    updatedAt: Date.now(),
  });

  console.log(`✓ Created teacher: ${cleanName} (username: ${cleanUsername} | PIN: ${cleanPin})`);
  return docRef.id;
}

export async function deleteTeacher(usernameOrId: string) {
  const clean = usernameOrId.trim().toLowerCase();
  const docDirect = await db.collection("teachers").doc(clean).get();
  if (docDirect.exists) {
    await docDirect.ref.update({ isDeleted: true, isVisible: false, updatedAt: Date.now() });
    console.log(`✓ Deactivated teacher doc: ${clean}`);
    return;
  }

  const snap = await db.collection("teachers").where("username", "==", clean).get();
  if (snap.empty) {
    console.log(`No teacher found with username: ${clean}`);
    return;
  }

  for (const doc of snap.docs) {
    await doc.ref.update({ isDeleted: true, isVisible: false, updatedAt: Date.now() });
    console.log(`✓ Deactivated teacher: ${doc.data().name} (${clean})`);
  }
}

export async function deleteStudent(usernameOrId: string) {
  const clean = usernameOrId.trim().toLowerCase();
  const docDirect = await db.collection("students").doc(clean).get();
  if (docDirect.exists) {
    await docDirect.ref.update({ isActive: false, updatedAt: Date.now() });
    console.log(`✓ Deactivated student doc: ${clean}`);
    return;
  }

  const byUser = await db.collection("students").where("username", "==", clean).get();
  const byId = await db.collection("students").where("studentId", "==", usernameOrId.trim()).get();

  const all = [...byUser.docs, ...byId.docs];
  if (all.length === 0) {
    console.log(`No student found with identifier: ${usernameOrId}`);
    return;
  }

  for (const doc of all) {
    await doc.ref.update({ isActive: false, updatedAt: Date.now() });
    console.log(`✓ Deactivated student: ${doc.data().name} (${doc.data().username})`);
  }
}

export async function seedInitialStudents() {
  console.log("Seeding initial invited student accounts...");
  const initialStudents = [
    {
      studentId: "STD-001",
      username: "student1",
      name: "Sarah Al-Harbi",
      password: "student123",
    },
    {
      studentId: "STD-002",
      username: "student2",
      name: "Ahmed Al-Otaibi",
      password: "student123",
    },
    {
      studentId: "STD-003",
      username: "nawaf_student",
      name: "Nawaf Al-Majeed",
      password: "student123",
    },
    {
      studentId: "STD-QA-01",
      username: "qastudent",
      name: "QA Audit Student",
      password: "qa-student-2026",
    },
  ];

  for (const s of initialStudents) {
    await createStudent(s);
  }
  console.log("Seeding completed successfully.");
}

export async function listAllUsers() {
  console.log("\n=================== TEACHERS IN DATABASE ===================");
  const teachersSnap = await db.collection("teachers").get();
  teachersSnap.forEach((doc) => {
    const data = doc.data();
    console.log(`• Username: "${data.username}" | PIN: "${data.pin}" | Name: ${data.name} | Active: ${!data.isDeleted}`);
  });

  console.log("\n=================== STUDENTS IN DATABASE ===================");
  const studentsSnap = await db.collection("students").get();
  studentsSnap.forEach((doc) => {
    const data = doc.data();
    console.log(`• Username: "${data.username}" | ID: "${data.studentId}" | Name: ${data.name} | Active: ${data.isActive}`);
  });
  console.log("============================================================\n");
}
