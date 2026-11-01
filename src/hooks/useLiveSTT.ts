import { useState, useRef, useCallback, useEffect } from 'react';

export function useLiveSTT() {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const deepgramClientRef = useRef<WebSocket | null>(null);
  
  const finalTextRef = useRef<string>("");
  const interimTextRef = useRef<string>("");
  
  const tokenCache = useRef<{ token: string, expiresAt: number } | null>(null);

  const getValidToken = async () => {
    if (tokenCache.current && Date.now() < tokenCache.current.expiresAt) {
      return tokenCache.current.token;
    }
    const res = await fetch("/api/ai/deepgram-token").then(r => r.json());
    if (res.error) throw new Error(res.error);
    // Token is valid for 10m (600s), cache it for 8m to be safe
    tokenCache.current = { token: res.token, expiresAt: Date.now() + 8 * 60 * 1000 };
    return res.token;
  };

  useEffect(() => {
    // Pre-fetch token on component mount to save ~1.5s during mic click
    getValidToken().catch(err => console.error("Failed to pre-fetch Deepgram token", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentText = useCallback(() => {
    const final = finalTextRef.current.trim();
    const interim = interimTextRef.current.trim();
    if (final && interim) return final + " " + interim;
    if (final) return final;
    return interim;
  }, []);

  const updateText = () => {
    const final = finalTextRef.current.trim();
    const interim = interimTextRef.current.trim();
    if (final && interim) {
      setText(final + " " + interim);
    } else if (final) {
      setText(final);
    } else {
      setText(interim);
    }
  };

  const startRecording = async () => {
    setError(null);
    setIsConnecting(true);
    let stream: MediaStream | null = null;
    
    finalTextRef.current = text;
    interimTextRef.current = "";
    
    const tStart = performance.now();
    console.log("[LATENCY] Mic click");

    try {
      const streamPromise = navigator.mediaDevices.getUserMedia({ audio: true });

      stream = await streamPromise;
      if (isDestroyedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      console.log(`[LATENCY] getUserMedia ready at ${Math.round(performance.now() - tStart)}ms`);
      setIsConnecting(false);
      setIsRecording(true);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      let firstChunkLogged = false;
      mediaRecorder.addEventListener("dataavailable", async (event) => {
        if (event.data.size > 0) {
          if (!firstChunkLogged) {
             firstChunkLogged = true;
             console.log(`[LATENCY] first audio chunk at ${Math.round(performance.now() - tStart)}ms`);
          }
          const ws = deepgramClientRef.current;
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          } else {
            audioChunks.push(event.data);
          }
        }
      });

      mediaRecorder.start(100);
      console.log(`[LATENCY] MediaRecorder started at ${Math.round(performance.now() - tStart)}ms`);

      const token = await getValidToken();
      console.log(`[LATENCY] token ready at ${Math.round(performance.now() - tStart)}ms`);
      
      const url = "wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true";
      const ws = new WebSocket(url, ["bearer", token]);
      console.log(`[LATENCY] WebSocket created at ${Math.round(performance.now() - tStart)}ms`);
      deepgramClientRef.current = ws;

      ws.onopen = () => {
        console.log(`[LATENCY] WebSocket open at ${Math.round(performance.now() - tStart)}ms`);
        while (audioChunks.length > 0) {
          ws.send(audioChunks.shift()!);
        }
      };

      let firstInterimLogged = false;
      let firstFinalLogged = false;

      ws.onmessage = (message) => {
        try {
          const received = JSON.parse(message.data);
          if (received.type !== "Results") return;
          const transcript = received.channel?.alternatives?.[0]?.transcript;
          if (transcript && received.is_final) {
            if (!firstFinalLogged) {
               firstFinalLogged = true;
               console.log(`[LATENCY] first final transcript at ${Math.round(performance.now() - tStart)}ms`);
            }
            finalTextRef.current = (finalTextRef.current + " " + transcript).trim();
            interimTextRef.current = "";
            updateText();
          } else if (transcript) {
            if (!firstInterimLogged) {
               firstInterimLogged = true;
               console.log(`[LATENCY] first interim transcript at ${Math.round(performance.now() - tStart)}ms`);
            }
            interimTextRef.current = transcript;
            updateText();
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
      
      ws.onclose = () => {};

    } catch (err: any) {
      console.error(err);
      setError("Microphone access denied or connection failed.");
      setIsConnecting(false);
      if (stream) stream.getTracks().forEach(track => track.stop());
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (deepgramClientRef.current) {
      try {
        const ws = deepgramClientRef.current;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "CloseStream" }));
        }
        ws.close();
      } catch (e) {}
      deepgramClientRef.current = null;
    }
    setIsRecording(false);
    setIsConnecting(false);
    
    if (interimTextRef.current) {
      finalTextRef.current = (finalTextRef.current + " " + interimTextRef.current).trim();
      interimTextRef.current = "";
      updateText();
    }
  }, []);

  const clearText = () => {
    finalTextRef.current = "";
    interimTextRef.current = "";
    setText("");
  };
  
  const setDirectText = (t: string) => {
    finalTextRef.current = t;
    interimTextRef.current = "";
    setText(t);
  };

  const isDestroyedRef = useRef(false);

  useEffect(() => {
    isDestroyedRef.current = false;
    return () => {
      isDestroyedRef.current = true;
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    isConnecting,
    text,
    error,
    startRecording,
    stopRecording,
    clearText,
    setDirectText,
    getCurrentText
  };
}
