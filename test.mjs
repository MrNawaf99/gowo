import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
const projectId = env.match(/NEXT_PUBLIC_FIREBASE_PROJECT_ID=([^\s]+)/)[1];
const apiKey = env.match(/NEXT_PUBLIC_FIREBASE_API_KEY=([^\s]+)/)[1];
const app = initializeApp({ projectId, apiKey });
const db = getFirestore(app);
getDoc(doc(db, "lessons", "s6dWSHLRkT6tM3gpJt9h")).then(snap => {
  console.log(snap.data());
  process.exit(0);
});
