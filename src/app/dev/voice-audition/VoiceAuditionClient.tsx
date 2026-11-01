"use client";

import React, { useRef, useState } from "react";
import { Play, Pause, Volume2, AlertTriangle, RefreshCw, XCircle, CheckCircle2 } from "lucide-react";

export interface TTSCandidate {
  voiceName: string;
  voiceId: string;
  language: string;
  locale: string;
  accent: string;
  type: string;
  description: string;
  status: "USABLE_FREE" | "UNAVAILABLE_ON_CURRENT_PLAN";
  errorReason?: string;
  script: string;
  hasAudio: boolean;
  audioUrl?: string;
}

interface Props {
  candidates: TTSCandidate[];
}

export default function VoiceAuditionClient({ candidates: initialCandidates }: Props) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [generatingVoice, setGeneratingVoice] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const handleTogglePlay = (voiceName: string) => {
    const audio = audioRefs.current[voiceName];
    if (!audio) return;

    if (playingVoice === voiceName) {
      audio.pause();
      setPlayingVoice(null);
    } else {
      if (playingVoice && audioRefs.current[playingVoice]) {
        audioRefs.current[playingVoice]?.pause();
      }
      audio.currentTime = 0;
      audio.play().then(() => {
        setPlayingVoice(voiceName);
      }).catch((err) => {
        console.error("Playback error:", err);
      });
    }
  };

  const handleGenerate = async (candidate: TTSCandidate) => {
    setGeneratingVoice(candidate.voiceName);
    setActionMessage(null);

    try {
      const res = await fetch("/api/dev/voice-audition/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: candidate.voiceId,
          voiceName: candidate.voiceName,
        }),
      });

      const data = await res.json();
      if (data.success && data.audioUrl) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.voiceName === candidate.voiceName
              ? { ...c, status: "USABLE_FREE", hasAudio: true, audioUrl: data.audioUrl, errorReason: undefined }
              : c
          )
        );
        setActionMessage({
          type: "success",
          text: `Successfully generated audition sample for ${candidate.voiceName}!`,
        });
      } else {
        setActionMessage({
          type: "error",
          text: `Generation blocked: ${data.error || "Quota or permission error"}`,
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: `Request failed: ${err.message}`,
      });
    } finally {
      setGeneratingVoice(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <Volume2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edge TTS Voice Audition Studio</h1>
              <p className="text-sm text-gray-500">
                Evaluating genuinely usable English (en-US / American) voices available via Microsoft Edge Neural TTS.
              </p>
            </div>
          </div>
        </div>

        {/* Account Audit Banner */}
        <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-900">
              <h3 className="font-bold text-base text-blue-950">Microsoft Edge TTS Diagnostic</h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-blue-900">
                <li>
                  <strong>Provider:</strong> Microsoft Azure Neural TTS (via Edge).
                </li>
                <li>
                  <strong>Access:</strong> Free and unlimited usage via the Edge TTS API.
                </li>
                <li>
                  <strong>Status:</strong> Ready for audition.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {actionMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-2 text-sm ${
              actionMessage.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0 text-red-600" />
            )}
            {actionMessage.text}
          </div>
        )}

        {/* Candidate List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Edge TTS Candidates ({candidates.length})</h2>
            <span className="text-xs text-gray-500 font-mono">Standard Script: &quot;pen. think. red. bird.&quot;</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidates.map((c) => {
              const isPlaying = playingVoice === c.voiceName;
              const isGenerating = generatingVoice === c.voiceName;

              return (
                <div
                  key={c.voiceName}
                  className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                        {c.type}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          c.hasAudio
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {c.hasAudio ? "USABLE_FREE" : "UNAVAILABLE_ON_CURRENT_PLAN"}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{c.voiceName}</h3>
                      <p className="text-xs font-mono text-gray-500">{c.voiceId}</p>
                    </div>

                    <div className="text-xs space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-100 text-gray-600">
                      <div><span className="font-semibold text-gray-700">Locale / Accent:</span> {c.locale} — {c.accent}</div>
                      <div><span className="font-semibold text-gray-700">Type:</span> {c.type}</div>
                      <div><span className="font-semibold text-gray-700">Script:</span> <span className="font-mono text-gray-900 italic">&quot;{c.script}&quot;</span></div>
                      {c.errorReason && (
                        <div className="text-red-700 pt-1 border-t border-gray-200/60 font-mono text-[11px]">
                          <strong>Blocked:</strong> {c.errorReason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                    {c.hasAudio && c.audioUrl ? (
                      <>
                        <audio
                          ref={(el) => {
                            audioRefs.current[c.voiceName] = el;
                          }}
                          src={c.audioUrl}
                          onEnded={() => setPlayingVoice(null)}
                          preload="none"
                        />
                        <button
                          type="button"
                          onClick={() => handleTogglePlay(c.voiceName)}
                          className={`w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                            isPlaying
                              ? "bg-amber-600 text-white hover:bg-amber-700"
                              : "bg-primary text-white hover:bg-primary/90"
                          }`}
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-4 h-4" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 fill-current" /> Play Audition
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGenerate(c)}
                        disabled={isGenerating}
                        className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                        {isGenerating ? "Probing API..." : "Test Generation (TTS)"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Safety Notice */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700">Production Safety Notice:</p>
          <p>
            No candidate is auto-selected or ranked. Production assets in <code className="bg-gray-100 px-1 py-0.5 rounded">public/assets/sounds/</code> remain completely untouched.
            All 24 production audio slots remain strictly <code className="bg-gray-100 px-1 py-0.5 rounded">MISSING</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
