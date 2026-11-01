import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import VoiceAuditionClient, { TTSCandidate } from "./VoiceAuditionClient";

const EDGE_TTS_VOICES = [
  "en-US-JennyNeural",
  "en-US-GuyNeural",
  "en-US-AriaNeural",
  "en-US-ChristopherNeural",
  "en-US-EricNeural",
  "en-US-MichelleNeural",
];

export default function VoiceAuditionPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const baseDir = path.join(process.cwd(), "docs", "pronunciation", "voice-audition");

  const candidates: TTSCandidate[] = EDGE_TTS_VOICES.map((voiceName) => {
    const audioPath = path.join(baseDir, `edge-tts-${voiceName}`, "audition.mp3");
    const hasAudio = fs.existsSync(audioPath);
    return {
      voiceName,
      voiceId: voiceName,
      language: "English",
      locale: "en-US",
      accent: "American",
      type: "Microsoft Edge TTS",
      description: "Free Microsoft Edge Neural TTS Voice",
      status: "USABLE_FREE",
      script: "pen. think. red. bird.",
      hasAudio,
      audioUrl: hasAudio ? `/api/dev/voice-audition/audio?voice=edge-tts-${encodeURIComponent(voiceName)}` : undefined,
    };
  });

  return <VoiceAuditionClient candidates={candidates} />;
}
