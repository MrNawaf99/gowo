import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  try {
    const { voiceId, voiceName } = await request.json();

    if (!voiceId || typeof voiceId !== "string") {
      return NextResponse.json({ error: "Missing voiceId" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });
    }

    const text = "pen. think. red. bird.";

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_flash_v2_5",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errJson;
      try {
        errJson = JSON.parse(errText);
      } catch {
        errJson = { message: errText };
      }
      return NextResponse.json({
        success: false,
        status: res.status,
        error: errJson.detail?.message || errJson.message || "Generation failed",
        code: errJson.detail?.code || "unknown_error",
      }, { status: 200 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const outDir = path.join(process.cwd(), "docs", "pronunciation", "voice-audition", "elevenlabs-free", voiceName || voiceId);
    fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(path.join(outDir, "audition.mp3"), buffer);
    fs.writeFileSync(
      path.join(outDir, "metadata.json"),
      JSON.stringify({
        provider: "ElevenLabs",
        voiceName: voiceName || voiceId,
        voiceId,
        model: "eleven_flash_v2_5",
        script: text,
        generatedAt: new Date().toISOString(),
        file: {
          path: path.join(outDir, "audition.mp3"),
          sizeBytes: buffer.length,
          format: "audio/mpeg",
        },
      }, null, 2)
    );

    return NextResponse.json({
      success: true,
      audioUrl: `/api/dev/voice-audition/audio?voice=elevenlabs-free/${encodeURIComponent(voiceName || voiceId)}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
