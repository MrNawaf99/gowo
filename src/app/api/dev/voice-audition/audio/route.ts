import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { searchParams } = new URL(request.url);
  const voice = searchParams.get("voice");

  if (!voice || !/^[a-zA-Z0-9_\-\/]+$/.test(voice)) {
    return NextResponse.json({ error: "Invalid voice parameter" }, { status: 400 });
  }

  // Prevent directory traversal
  const normalized = path.normalize(voice);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return NextResponse.json({ error: "Path traversal detected" }, { status: 403 });
  }

  const audioPath = path.join(
    process.cwd(),
    "docs",
    "pronunciation",
    "voice-audition",
    normalized,
    "audition.mp3"
  );

  if (!fs.existsSync(audioPath)) {
    return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
  }

  const audioBuffer = fs.readFileSync(audioPath);

  return new Response(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length.toString(),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
