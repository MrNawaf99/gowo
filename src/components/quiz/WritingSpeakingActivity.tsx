import { useTranslation } from "@/i18n/useTranslation";
import React, { useState, useEffect, useRef } from "react";
import { Mic, Square, Trash2, Loader2 } from "lucide-react";
import { TeacherQuestion } from "@/lib/schemas/question";
import { WritingSpeakingResult } from "@/lib/schemas/result";

interface WritingSpeakingActivityProps { 
  initialValue?: WritingSpeakingResult;
  question: TeacherQuestion;
  onChange: (data: WritingSpeakingResult) => void;
}

export default function WritingSpeakingActivity({ question, onChange, initialValue }: WritingSpeakingActivityProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialValue?.finalAnswerText || "");
  const [interimText, setInterimText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [usedMic, setUsedMic] = useState(initialValue?.mode === "SPEAK");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const deepgramClientRef = useRef<unknown>(null);
  const interimTranscriptRef = useRef<string>("");

  const reqChars = 'requiredCharacterCount' in question ? (question.requiredCharacterCount as number) : 0;
  const currentChars = text.length;

  const nativeSpeechRef = useRef<unknown>(null);
  const lastReportedState = useRef<string>("");

  const tokenCache = useRef<{ token: string, expiresAt: number } | null>(null);

  const getValidToken = async () => {
    if (tokenCache.current && Date.now() < tokenCache.current.expiresAt) {
      return tokenCache.current.token;
    }
    const res = await fetch("/api/ai/deepgram-token").then(r => r.json());
    if (res.error) throw new Error(res.error);
    tokenCache.current = { token: res.token, expiresAt: Date.now() + 8 * 60 * 1000 };
    return res.token;
  };

  useEffect(() => {
    getValidToken().catch(err => console.error("Failed to pre-fetch Deepgram token", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (onChange) {
      const newState = JSON.stringify({ text, usedMic, q: question.id });
      if (lastReportedState.current !== newState) {
        lastReportedState.current = newState;
        
        const baseResult: WritingSpeakingResult = {
          questionId: question.id!,
          mode: usedMic ? "SPEAK" : "WRITE",
          reviewState: "PENDING_REVIEW",
          teacherOverride: false
        };
        if (text) {
          baseResult.finalAnswerText = text;
        }
        onChange(baseResult);
      }
    }
  }, [text, usedMic, question.id, onChange]);

  const stopRecording = () => {
    if (nativeSpeechRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (nativeSpeechRef.current as any).stop();
      nativeSpeechRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (deepgramClientRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ws = deepgramClientRef.current as any;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "CloseStream" }));
        }
        ws.close();
      } catch (e) {
        console.error("Deepgram close error", e);
      }
      deepgramClientRef.current = null;
    }
    setIsRecording(false);
    setIsConnecting(false);

    if (interimTranscriptRef.current) {
      setText((prev) => {
        const newText = prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + interimTranscriptRef.current;
        return newText.trim();
      });
      interimTranscriptRef.current = "";
      setInterimText("");
    }
  };

  const startRecording = async () => {
    if (isRecording || isConnecting) return; // Prevent double-clicks
    
    setIsConnecting(true);
    setError(null);
    setUsedMic(true);

    const tStart = performance.now();
    console.log(`[LATENCY] Mic click`);

    let stream: MediaStream | null = null;

    try {
      const streamPromise = navigator.mediaDevices.getUserMedia({ audio: true });

      stream = await streamPromise;
      if (isDestroyedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      
      setIsConnecting(false);
      setIsRecording(true);

      console.log(`[LATENCY] getUserMedia ready at ${Math.round(performance.now() - tStart)}ms`);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];
      
      let firstChunkLogged = false;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          if (!firstChunkLogged) {
            firstChunkLogged = true;
            console.log(`[LATENCY] first audio chunk at ${Math.round(performance.now() - tStart)}ms`);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ws = deepgramClientRef.current as any;
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(e.data);
          } else {
            audioChunks.push(e.data);
          }
        }
      };

      mediaRecorder.start(100);
      console.log(`[LATENCY] MediaRecorder started at ${Math.round(performance.now() - tStart)}ms`);

      let token = "";
      try {
        token = await getValidToken();
        console.log(`[LATENCY] token ready at ${Math.round(performance.now() - tStart)}ms`);
      } catch (err) {
        console.error("Token fetch failed:", err);
      }

      if (!token || token.includes("MOCK")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          setError(t("quiz.errSttUnsupported"));
          stream.getTracks().forEach(t => t.stop());
          setIsConnecting(false);
          setIsRecording(false);
          mediaRecorder.stop();
          return;
        }

        const recognition = new SpeechRecognition();
        nativeSpeechRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let interimText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              setText((prev) => {
                const newText = prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + transcript;
                return newText.trim();
              });
              setInterimText("");
              interimTranscriptRef.current = "";
            } else {
              interimText += transcript;
            }
          }
          if (interimText) {
            interimTranscriptRef.current = interimText;
            setInterimText(interimText);
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          console.error("Native STT Error:", event.error);
        };
        recognition.start();

        mediaRecorder.onstop = () => {
          if (stream) stream.getTracks().forEach((track) => track.stop());
          interimTranscriptRef.current = "";
          setInterimText("");
        };

        return;
      }

      // REAL DEEPGRAM WS
      const url = "wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true";
      const ws = new WebSocket(url, ["bearer", token]);
      console.log(`[LATENCY] WebSocket created at ${Math.round(performance.now() - tStart)}ms`);

      deepgramClientRef.current = ws;

      mediaRecorder.onstop = () => {
        if (stream) stream.getTracks().forEach((track) => track.stop());
      };

      ws.onopen = () => {
        console.log(`[LATENCY] WebSocket open at ${Math.round(performance.now() - tStart)}ms`);
        
        while (audioChunks.length > 0) {
          ws.send(audioChunks.shift()!);
        }
      };

      let firstInterimLogged = false;
      let firstFinalLogged = false;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type !== "Results") return;
          const transcript = msg.channel?.alternatives?.[0]?.transcript;
          if (!transcript) return;

          if (msg.is_final) {
            if (!firstFinalLogged) {
               firstFinalLogged = true;
               console.log(`[LATENCY] first final transcript at ${Math.round(performance.now() - tStart)}ms`);
            }
            setText((prev) => {
              const newText = prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + transcript;
              return newText.trim();
            });
            interimTranscriptRef.current = "";
            setInterimText("");
          } else {
            if (!firstInterimLogged) {
               firstInterimLogged = true;
               console.log(`[LATENCY] first interim transcript at ${Math.round(performance.now() - tStart)}ms`);
            }
            interimTranscriptRef.current = transcript;
            setInterimText(transcript);
          }
        } catch (e) {
          console.error("Deepgram parse error", e);
        }
      };

      ws.onerror = (err) => {
        console.error("Deepgram Error:", err);
        setError("Microphone connection error. Please try again.");
        stopRecording();
      };
      
      ws.onclose = (event) => {
        console.log("Deepgram closed:", event.code, event.reason);
      };

    } catch (err: unknown) {
      console.error("Start recording error:", err);
      setError("Microphone error: " + (err instanceof Error ? err.message : "Unknown error"));
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      setIsConnecting(false);
      setIsRecording(false);
    }
  };

  const isDestroyedRef = useRef(false);

  useEffect(() => {
    isDestroyedRef.current = false;
    return () => {
      isDestroyedRef.current = true;
      stopRecording();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClear = () => {
    if (window.confirm(t("quiz.confirmClearText"))) {
      setText("");
      interimTranscriptRef.current = "";
      setInterimText("");
      setUsedMic(false);
    }
  };

  const displayText = text + (interimText ? (text ? " " : "") + interimText : "");

  return (
    <div className="w-full flex flex-col h-[500px] md:h-[600px]">
      <h3 className="text-lg font-medium text-gray-900 mb-4 shrink-0">{question.question}</h3>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 mb-4 shrink-0">
          {error}
        </div>
      )}

      <div className="relative flex-1 flex flex-col">
        <textarea 
          value={isRecording || isConnecting ? displayText : text}
          onChange={(e) => { if (!isRecording && !isConnecting) setText(e.target.value); }}
          readOnly={isRecording || isConnecting}
          placeholder={t("activity.typeAnswerPlaceholder")}
          className={`w-full flex-1 border rounded-xl p-4 pb-14 text-gray-900 leading-relaxed resize-none outline-none transition-all
            ${isRecording ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : 
              isConnecting ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/10' : 
              'border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-gray-100'}`}
        />
        
        {/* Toolbar inside the textarea at the bottom right */}
        <div className="absolute bottom-3 end-3 flex items-center gap-2">
          {text.length > 0 && !isRecording && !isConnecting && (
            <button 
              onClick={handleClear}
              className="p-2.5 rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors tooltip-trigger group relative"
            >
              <Trash2 className="w-5 h-5" />
              <span className="absolute bottom-full end-0 mb-2 w-max px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">{t("common.clear")}</span>
            </button>
          )}

          {isConnecting ? (
            <button 
              disabled
              className="px-4 py-2.5 rounded-full bg-orange-100 text-orange-600 flex items-center gap-2 cursor-wait"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-semibold">{t("state.connecting")}</span>
            </button>
          ) : isRecording ? (
            <button 
              onClick={stopRecording}
              className="px-4 py-2.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center gap-2 animate-pulse"
            >
              <Square className="w-5 h-5 fill-current" />
              <span className="text-sm font-semibold">{t("state.listening")}</span>
            </button>
          ) : (
            <button 
              onClick={startRecording}
              className="px-4 py-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2"
            >
              <Mic className="w-5 h-5" />
              {text.length > 0 && <span className="text-sm font-semibold">{t("common.continue")}</span>}
            </button>
          )}
        </div>

        {/* Character count at bottom left */}
        <div className="absolute bottom-4 start-4">
          <span className={`text-xs font-medium ${reqChars > 0 && currentChars < reqChars ? 'text-red-500' : 'text-gray-400'}`}>
            {currentChars} {reqChars > 0 && `/ ${reqChars}`}
          </span>
        </div>
      </div>
    </div>
  );
}
