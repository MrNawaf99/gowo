import { storage } from "../firebase";
import { ref, uploadString, getDownloadURL, uploadBytes } from "firebase/storage";

export async function uploadAudioBase64(base64Data: string, filename: string): Promise<string> {
  // If it's the mock string, return a dummy url for testing
  if (base64Data === "MOCK_AUDIO_BASE64") {
    return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
  }

  const storageRef = ref(storage, `audio_questions/${filename}`);
  const isDataUrl = base64Data.startsWith("data:");
  
  await uploadString(storageRef, base64Data, isDataUrl ? "data_url" : "base64", {
    contentType: "audio/mpeg"
  });

  return await getDownloadURL(storageRef);
}

export async function uploadAIAudioBase64(base64Data: string, lessonId: string, activityId: string): Promise<string> {
  const storageRef = ref(storage, `ai_audio/${lessonId}/${activityId}.mp3`);
  const isDataUrl = base64Data.startsWith("data:");
  
  await uploadString(storageRef, base64Data, isDataUrl ? "data_url" : "base64", {
    contentType: "audio/mpeg"
  });

  return await getDownloadURL(storageRef);
}

export async function uploadAudioBlob(blob: Blob, filename: string): Promise<string> {
  const storageRef = ref(storage, `audio_answers/${filename}`);
  await uploadBytes(storageRef, blob, {
    contentType: blob.type
  });
  return await getDownloadURL(storageRef);
}

export async function uploadAIAudioBlob(blob: Blob, lessonId: string, activityId: string): Promise<string> {
  const storageRef = ref(storage, `ai_audio/${lessonId}/${activityId}.mp3`);
  await uploadBytes(storageRef, blob, {
    contentType: blob.type
  });
  return await getDownloadURL(storageRef);
}
