import { NextResponse } from "next/server";
import { generateContentWithFailover } from "@/lib/services/aiProviderService";

const deepgramKey = process.env.DEEPGRAM_API_KEY;

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!deepgramKey) {
    return NextResponse.json({ error: "Missing Deepgram key" }, { status: 500 });
  }

  try {
    const { history, studentText, context, isFirstTurn, isLastTurn } = await req.json();

    let difficultyRule = "";
    const difficulty = (context.difficulty || "Medium").toLowerCase();
    
    if (difficulty === "easy") {
      difficultyRule = `\nLANGUAGE LEVEL (EASY - A1/A2):
- Use very simple, common English words.
- Keep sentences short and direct.
- Ask ONLY ONE simple question at a time.
- Keep any corrections or explanations extremely brief.
- Strictly avoid idioms, slang, or advanced vocabulary.
- Example style: "That's good! What did you do next?" (Not: "That's an interesting experience. Could you elaborate?")`;
    } else if (difficulty === "hard") {
      difficultyRule = `\nLANGUAGE LEVEL (HARD - B2+):
- Use advanced vocabulary, natural idioms, and more complex sentence structures.
- Ask deeper follow-up questions that require elaboration and critical thinking.
- Provide more detailed, nuanced corrections.
- Maintain a sophisticated conversational flow suitable for an advanced learner.`;
    } else {
      difficultyRule = `\nLANGUAGE LEVEL (MEDIUM - B1):
- Use natural, intermediate-level English.
- Use moderate sentence length.
- Keep vocabulary conversational and practical.
- Provide clear, concise corrections.
- Keep the conversation flowing naturally.`;
    }

    let systemPrompt = `You are a helpful AI English teacher/partner for an ESL student.
Lesson Context (Target Grammar/Topic): ${context.lessonName || "General English"}
Allowed Topics: ${context.topics ? context.topics.join(", ") : "Any"}`;

    systemPrompt += difficultyRule;
    systemPrompt += `\nIMPORTANT: Always integrate the Target Grammar/Topic naturally into the conversation, regardless of the difficulty level.`;

    if (context.style === "Teacher") {
      systemPrompt += `\nAct as a teacher. Correct mistakes, explain briefly, and guide the student.`;
    } else if (context.style === "Natural Conversation") {
      systemPrompt += `\nAct naturally. Do not focus on correcting every mistake, just have a flowing conversation.`;
    } else {
      systemPrompt += `\nAct as a natural conversational partner, but if the student makes a clear grammar mistake related to the lesson, politely correct them and explain briefly.`;
    }

    systemPrompt += `\nRules:
1. Keep responses short and conversational (1-3 sentences maximum).
2. Do not output markdown, just plain spoken text. Do not verbalize formatting symbols. Do not say "quotation mark", "asterisk", "star", etc.
3. Do not over-focus on the student's speech disfluencies, filler words, or natural word repetitions (e.g., "I feel I feel..."). Only correct genuine grammar/vocabulary mistakes relevant to the lesson.
4. If it's the last turn, gracefully end the conversation, say goodbye, and do NOT ask any further questions.
`;

    if (isFirstTurn) {
      systemPrompt += `\nThis is the very first turn. Introduce the lesson topic briefly and ask the first question to start the conversation.`;
    }

    if (isLastTurn) {
      systemPrompt += `\nTHIS IS THE LAST TURN. FIRST respond naturally to the student's final answer, give brief positive feedback, and THEN gracefully say goodbye and end the conversation. DO NOT ASK ANY MORE QUESTIONS.`;
    }

    const normalizedHistory = history.map((h: any) => ({
      role: h.speaker === "AI" ? "model" : "user",
      text: h.text
    }));
    
    if (isFirstTurn) {
      normalizedHistory.push({ role: "user", text: "Start the conversation." });
    } else {
      normalizedHistory.push({ role: "user", text: studentText || "[No response]" });
    }

    const t0 = Date.now();
    let aiText = (await generateContentWithFailover(systemPrompt, normalizedHistory)).trim();
    
    if (isLastTurn) {
      let hasQuestion = aiText.includes("?");
      if (!hasQuestion) {
        const checkPrompt = `Does the following text contain an implicit question, a prompt for the user to reply, or leave the conversation open? Answer ONLY 'YES' or 'NO'.\n\nText: "${aiText}"`;
        const checkResult = (await generateContentWithFailover(checkPrompt, [])).trim().toUpperCase();
        if (checkResult.includes("YES")) hasQuestion = true;
      }
      
      if (hasQuestion) {
        const fixPrompt = `Rewrite the following text so that it definitely does NOT ask any questions, does NOT prompt the user to reply, gives brief positive feedback, and gracefully says goodbye to end the practice. Keep it short and natural.\n\nText to fix: "${aiText}"`;
        aiText = (await generateContentWithFailover(fixPrompt, [])).trim();
      }
    }

    const t1 = Date.now();

    const ttsRes = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
      method: "POST",
      headers: {
        "Authorization": `Token ${deepgramKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: aiText.replace(/\*/g, "").replace(/_/g, "").replace(/"/g, "").replace(/`/g, "").replace(/#/g, "") })
    });
    
    const t2 = Date.now();

    if (!ttsRes.ok) {
      return NextResponse.json({ text: aiText, audioBase64: null, timings: { gemini: t1 - t0, ttsFetch: t2 - t1 } });
    }

    const arrayBuffer = await ttsRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBase64 = `data:audio/mp3;base64,${buffer.toString('base64')}`;
    const t3 = Date.now();

    return NextResponse.json({ 
      text: aiText, 
      audioBase64,
      timings: {
        gemini: t1 - t0,
        ttsFetch: t2 - t1,
        ttsBufferAndEncode: t3 - t2,
        totalApi: t3 - t0
      }
    });
  } catch (error: any) {
    console.error("API Error:", error);
    if (error.message === "AI_SERVICE_UNAVAILABLE") {
      return NextResponse.json({ error: "AI service is temporarily unavailable. Please try again later." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
