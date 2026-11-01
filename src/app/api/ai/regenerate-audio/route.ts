import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebaseAdmin";
import { getDownloadURL } from "firebase-admin/storage";

const deepgramKey = process.env.DEEPGRAM_API_KEY;

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!deepgramKey) {
    return NextResponse.json({ error: "Missing DEEPGRAM_API_KEY in environment variables." }, { status: 500 });
  }

  try {
    const { script, lessonId } = await req.json();

    if (!script || !lessonId) {
      return NextResponse.json({ error: "Missing script or lessonId parameter." }, { status: 400 });
    }

    const ttsRes = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
      method: "POST",
      headers: {
        "Authorization": `Token ${deepgramKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: script })
    });

    if (!ttsRes.ok) {
      const errTxt = await ttsRes.text();
      console.error("Deepgram Error:", errTxt);
      return NextResponse.json({ error: "TTS Generation failed" }, { status: 500 });
    }

    const audioBuffer = await ttsRes.arrayBuffer();

    if (!adminStorage) {
      return NextResponse.json({ error: "Firebase Admin Storage not initialized." }, { status: 500 });
    }

    const bucket = adminStorage.bucket();
    const activityId = `aiaudio_regen_${Date.now()}`;
    const filePath = `ai_audio/${lessonId}/${activityId}.mp3`;
    const file = bucket.file(filePath);

    await file.save(Buffer.from(audioBuffer), {
      metadata: { contentType: "audio/mpeg" }
    });

    const audioUrl = await getDownloadURL(file);

    return NextResponse.json({
      audioUrl: audioUrl
    });
  } catch (error: unknown) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : "Error") || "Internal server error" }, { status: 500 });
  }
}
