import { NextResponse } from "next/server";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function GET() {
  try {
    const buffer = new Uint8Array([1, 2, 3]).buffer;
    const storageRef = ref(storage, `test_server_upload_${Date.now()}.txt`);
    await uploadBytes(storageRef, buffer, { contentType: "text/plain" });
    const url = await getDownloadURL(storageRef);
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
