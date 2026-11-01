import { useTranslation } from "@/i18n/useTranslation";
import React, { useState, useEffect, useRef } from "react";
import { Mic, Square, Send, RotateCcw, Play, Loader2, CheckCircle } from "lucide-react";
import { useLiveSTT } from "@/hooks/useLiveSTT";
import { TeacherQuestion } from "@/lib/schemas/question";
import { ConversationTurn, ConversationResult } from "@/lib/schemas/result";

interface Props {
  activity: TeacherQuestion;
  initialValue?: ConversationResult;
  onChange: (result: ConversationResult) => void;
}

export default function AiConversationActivity({ activity, initialValue, onChange }: Props) {
  const { t } = useTranslation();
  const [revealedAiText, setRevealedAiText] = useState("");
  const [turns, setTurns] = useState<ConversationTurn[]>(initialValue?.turns || []);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [aiIsThinking, setAiIsThinking] = useState(false);
  const [error, setError] = useState("");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  const { isRecording, isConnecting, text, startRecording, stopRecording, clearText, setDirectText, getCurrentText, error: sttError } = useLiveSTT();

  const maxTurns = (activity as any).aiReplies || 11;
  const aiTurnsCount = turns.filter(t => t.speaker === "AI").length;
  const isConversationFinished = aiTurnsCount >= maxTurns;

  useEffect(() => {
    if (sttError) setError(sttError);
  }, [sttError]);

  // Robust auto-scroll without layout thrashing
  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;

    const resizeObserver = new ResizeObserver(() => {
      scrollEl.scrollTo({
        top: scrollEl.scrollHeight,
        behavior: 'smooth'
      });
    });

    resizeObserver.observe(contentEl);
    return () => resizeObserver.disconnect();
  }, []);

  // Initial trigger for AI Welcome if empty
  useEffect(() => {
    if (turns.length === 0 && !hasStartedRef.current) {
      hasStartedRef.current = true;
      handleTurn(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync to parent
  useEffect(() => {
    if (turns.length > 0) {
      onChange({ turns, reviewState: "PENDING_REVIEW" });
    }
  }, [turns]);

  const playAudio = (base64Url: string, fullText: string, tStart: number) => {
    setRevealedAiText("");
    if (audioRef.current) {
      const audioEl = audioRef.current;
      audioEl.src = base64Url;
      
      const handleTimeUpdate = () => {
        if (!audioEl) return;
        const currentTime = audioEl.currentTime;
        const duration = audioEl.duration || 1;
        const progress = currentTime / duration;
        const charsToShow = Math.floor(progress * fullText.length);
        setRevealedAiText(fullText.slice(0, charsToShow + 3));
      };

      const cleanup = () => {
        audioEl.removeEventListener("timeupdate", handleTimeUpdate);
      };

      audioEl.addEventListener("timeupdate", handleTimeUpdate);

      audioEl.play().then(() => {
        console.log(`[AI LATENCY] Audio playback actually started at ${Math.round(performance.now() - tStart)}ms`);
        audioEl.onpause = () => {};
        audioEl.onended = () => {
          setIsPlayingAudio(false);
          setRevealedAiText(fullText);
          cleanup();
        };
      }).catch(e => {
        console.error("Audio play error", e);
        cleanup();
        setRevealedAiText(fullText); // Fallback if audio fails
      });
      setIsPlayingAudio(true);
    }
  };

  const handleTurn = async (isFirstTurn = false, textParam?: string) => {
    setAiIsThinking(true);
    setError("");
    const tStart = performance.now();
    console.log(`[AI LATENCY] Student Send clicked at 0ms`);
    
    try {
      // Use textParam if provided (fresh from STT), otherwise fallback to state
      const studentText = (textParam !== undefined ? textParam : text).trim();
      if (!isFirstTurn) {
        const textToSave = studentText || "[No response]";
        setTurns(prev => [...prev, { speaker: "STUDENT", text: textToSave, timestamp: Date.now() }]);
      }
      clearText();

      const isLastTurn = aiTurnsCount + 1 >= maxTurns;

      const res = await fetch("/api/ai/conversation-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: turns,
          studentText,
          isFirstTurn,
          isLastTurn,
          context: {
            lessonName: (activity as any).audioScript,
            topics: (activity as any).selectedTopics,
            style: (activity as any).style,
            difficulty: (activity as any).difficulty
          }
        })
      });

      const data = await res.json();
      console.log(`[AI LATENCY] API response received at ${Math.round(performance.now() - tStart)}ms. API Internal Timings:`, data.timings);
      
      if (data.error) throw new Error(data.error);

      setTurns(prev => [...prev, { speaker: "AI", text: data.text, timestamp: Date.now() }]);
      if (data.audioBase64) {
        playAudio(data.audioBase64, data.text, tStart);
      }
    } catch (err: any) {
      setError(err.message || t("quiz.errAiFailed"));
    } finally {
      setAiIsThinking(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSend = () => {
    // Capture the exact transcript at the moment of sending
    const currentText = isRecording ? getCurrentText() : text;
    if (isRecording) stopRecording();
    handleTurn(false, currentText);
  };

  return (
    <div className="flex flex-col h-[500px] md:h-[600px] border border-gray-200 rounded-2xl bg-gray-100 shadow-sm overflow-hidden">
      <audio ref={audioRef} className="hidden" />

      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-bold text-gray-900">{t("quiz.aiConversation")}</h3>
          <p className="text-sm text-gray-500">{t("quiz.aiReplies", { current: aiTurnsCount, max: maxTurns })}</p>
        </div>
        {isConversationFinished && (
          <div className="flex items-center gap-2 text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            {t("state.completed")}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
        <div ref={contentRef} className="flex flex-col space-y-4">
          {turns.map((turn, idx) => (
            <div key={idx} className={`flex ${turn.speaker === "STUDENT" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl ${
                turn.speaker === "STUDENT" 
                  ? "bg-primary text-white rounded-br-none" 
                  : "bg-gray-100 border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
              }`}>
                {turn.speaker === "AI" && <span className="block text-xs font-bold text-gray-400 mb-1">{t("quiz.aiTeacher")}</span>}
                <p className="text-sm md:text-base leading-relaxed">{turn.speaker === "AI" && idx === turns.length - 1 && isPlayingAudio ? revealedAiText : turn.text}</p>
              </div>
            </div>
          ))}

          {text && !aiIsThinking && (
            <div className="flex justify-end">
              <div className="max-w-[85%] p-4 rounded-2xl bg-primary/80 text-white rounded-br-none animate-pulse">
                <p className="text-sm md:text-base leading-relaxed">{text}</p>
              </div>
            </div>
          )}

          {aiIsThinking && (
            <div className="flex justify-start">
              <div className="max-w-[85%] p-4 rounded-2xl bg-gray-100 border border-gray-200 text-gray-800 rounded-bl-none shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-gray-500">{t("state.aiThinking")}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Bar */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 text-center border-t border-red-100 font-medium shrink-0">
          {error}
        </div>
      )}

      {/* Fixed Height Footer Area */}
      <div className="bg-gray-100 border-t border-gray-200 shrink-0 h-[104px] flex flex-col justify-center px-4">
        {isConversationFinished && !isPlayingAudio ? (
          <div className="flex items-center justify-center text-green-700 font-bold gap-2 bg-green-50/50 py-3 rounded-2xl w-full max-w-sm mx-auto">
            <CheckCircle className="w-5 h-5" /> {t("quiz.conversationCompleted")}
          </div>
        ) : turns.length === 0 ? (
          <div className="flex items-center justify-center gap-2 text-gray-500 font-medium">
            <Loader2 className="w-5 h-5 animate-spin" /> {t("quiz.preparingAi")}
          </div>
        ) : isPlayingAudio ? (
          <div className="flex items-center justify-center gap-2 text-primary font-medium">
            <Play className="w-5 h-5 animate-pulse" /> {t("state.aiSpeaking")}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full">
            {isConnecting ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" /> {t("quiz.connectingMic")}
              </div>
            ) : (
              <>
                {!isRecording && text.length > 0 ? (
                  <div className="flex gap-2 w-full max-w-sm">
                    <button onClick={clearText} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                      <RotateCcw className="w-4 h-4" /> {t("common.clear")}
                    </button>
                    <button onClick={startRecording} className="flex-1 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                      <Mic className="w-4 h-4" /> {t("quiz.continueRecording")}
                    </button>
                    <button onClick={handleSend} disabled={aiIsThinking} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                      <Send className="w-4 h-4" /> {t("common.send")}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleMicClick}
                    disabled={aiIsThinking}
                    className={`w-full max-w-xs py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
                      isRecording 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 ring-2 ring-red-500/20' 
                        : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                    } disabled:opacity-50`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-5 h-5 fill-current" />
                        {t("quiz.stopRecording")}
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        {t("quiz.tapToSpeak")}
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
