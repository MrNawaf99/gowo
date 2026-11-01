import { GoogleGenAI } from "@google/genai";
import { GEMINI_KEYS, OPENROUTER_KEYS } from "@/lib/config/aiKeys";

export type AIProvider = "GEMINI" | "OPENROUTER";

interface KeyStatus {
  key: string;
  provider: AIProvider;
  status: "available" | "rate_limited" | "invalid";
  cooldownUntil?: number;
}

const keyStore: KeyStatus[] = [
  ...GEMINI_KEYS.map(key => ({ key, provider: "GEMINI" as AIProvider, status: "available" as const })),
  ...OPENROUTER_KEYS.map(key => ({ key, provider: "OPENROUTER" as AIProvider, status: "available" as const }))
];

export async function generateContentWithFailover(
  systemPrompt: string, 
  history: { role: string, text: string }[],
  temperature = 0.7,
  maxOutputTokens = 2048,
  inlineData?: { data: string, mimeType: string }
): Promise<string> {
  const now = Date.now();
  
  keyStore.forEach(k => {
    if (k.status === "rate_limited" && k.cooldownUntil && now > k.cooldownUntil) {
      k.status = "available";
      k.cooldownUntil = undefined;
    }
  });

  const availableKeys = keyStore.filter(k => k.status === "available");
  
  if (availableKeys.length === 0) {
    console.error("All AI keys are exhausted or invalid.");
    throw new Error("AI_SERVICE_UNAVAILABLE");
  }

  for (const credential of availableKeys) {
    try {
      if (credential.provider === "GEMINI") {
        const ai = new GoogleGenAI({ apiKey: credential.key });
        const contents: any[] = history.map(h => ({
          role: h.role, // 'user' or 'model'
          parts: [{ text: h.text }]
        }));
        
        if (inlineData && contents.length > 0) {
          contents[0].parts.push({ inlineData });
        }
        
        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction: systemPrompt,
            maxOutputTokens,
            temperature,
          }
        });
        
        if (!result.text) throw new Error("Empty response");
        return result.text;
      } else if (credential.provider === "OPENROUTER") {
        const messages: any[] = [
          { role: "system", content: systemPrompt }
        ];
        
        for (let i = 0; i < history.length; i++) {
          const h = history[i];
          if (i === 0 && inlineData) {
            messages.push({
              role: h.role === "model" ? "assistant" : "user",
              content: [
                { type: "text", text: h.text },
                { type: "image_url", image_url: { url: `data:${inlineData.mimeType};base64,${inlineData.data}` } }
              ]
            });
          } else {
            messages.push({
              role: h.role === "model" ? "assistant" : "user",
              content: h.text
            });
          }
        }

        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + credential.key,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages,
            temperature,
            max_tokens: maxOutputTokens
          })
        });

        const data = await res.json();
        
        if (!res.ok) {
          const errorMsg = data.error?.message || res.statusText;
          const status = res.status;
          throw { status, message: errorMsg, provider: "OPENROUTER" };
        }
        
        if (!data.choices?.[0]?.message?.content) throw new Error("Empty response");
        return data.choices[0].message.content;
      }
    } catch (error: any) {
      console.error("AI Provider error for " + credential.provider + ":", error?.status || error?.message || error);
      
      const isRateLimit = error?.status === 429 || (error?.message && (error.message.includes("429") || error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED")));
      const isAuthError = error?.status === 401 || error?.status === 403 || (error?.message && (error.message.includes("API key") || error.message.includes("unauthorized")));
      
      if (isAuthError) {
        credential.status = "invalid";
      } else if (isRateLimit) {
        credential.status = "rate_limited";
        credential.cooldownUntil = Date.now() + 60 * 1000;
      } else {
        credential.status = "rate_limited";
        credential.cooldownUntil = Date.now() + 10 * 1000; 
      }
    }
  }

  throw new Error("AI_SERVICE_UNAVAILABLE");
}
