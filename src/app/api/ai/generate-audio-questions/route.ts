import { NextResponse } from "next/server";
import { generateContentWithFailover } from "@/lib/services/aiProviderService";
import { adminStorage } from "@/lib/firebaseAdmin";
import { getDownloadURL } from "firebase-admin/storage";

const deepgramKey = process.env.DEEPGRAM_API_KEY;

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!deepgramKey) {
    return NextResponse.json({ error: "Missing DEEPGRAM_API_KEY in environment variables." }, { status: 500 });
  }

  try {
    const { pdfBase64, fileText, mcqCount, tfCount, difficulty, lessonId } = await req.json();

    if ((!pdfBase64 && !fileText) || (mcqCount === undefined && tfCount === undefined) || !lessonId) {
      return NextResponse.json({ error: "Missing required parameters, including lessonId." }, { status: 400 });
    }

    let inlineData: any = undefined;
    let textContent = fileText || "";
    
    if (pdfBase64 && pdfBase64.startsWith("data:")) {
      const match = pdfBase64.match(/^data:(.+?);base64,(.+)$/);
      if (match) {
        inlineData = {
          mimeType: match[1],
          data: match[2]
        };
      }
    } else if (fileText && fileText.startsWith("data:")) {
      const match = fileText.match(/^data:(.+?);base64,(.+)$/);
      if (match) {
        if (match[1] === "text/plain") {
          textContent = Buffer.from(match[2], "base64").toString("utf-8");
          inlineData = undefined;
        } else {
          inlineData = {
            mimeType: match[1],
            data: match[2]
          };
          textContent = "";
        }
      }
    }

    const mCount = parseInt(mcqCount) || 0;
    const tCount = parseInt(tfCount) || 0;

    const systemPrompt = `
You are an expert English teacher.
Based strictly on the provided source material, generate a listening comprehension activity.
Constraints:
- Difficulty: ${difficulty}
- Generate exactly ${mCount} Multiple Choice Questions (MCQ).
- Generate exactly ${tCount} True/False Questions (TF).
- Ensure the script covers all the answers to the generated questions.
- Do NOT hallucinate information outside the source material.
- The script should be conversational and natural, suitable for an audio narrator.
- Provide the explanation in Arabic (explanationArabic).
- Do NOT prefix options with letters (A, B, C, D) or numbers.
- The correctAnswer MUST be the exact text of the correct option from the options array, NOT a letter or index.

OUTPUT STRICT JSON ONLY IN THIS EXACT FORMAT:
{
  "script": "A continuous listening script (approx 100-200 words)...",
  "questions": [
      {
        "type": "MCQ",
        "question": "The question text?",
        "options": [
          "To talk about the past",
          "To talk about the future",
          "To describe a person",
          "To ask a question"
        ],
        "correctAnswer": "To talk about the past",
        "explanationArabic": "The Arabic explanation of the answer"
      },
      {
        "type": "TF",
        "question": "The statement?",
        "correctAnswer": "True",
        "explanationArabic": "The Arabic explanation of the answer"
      }
  ]
}
`;

    const contents = textContent ? `Source text:\n\n${textContent}` : "See the attached document for context.";

    const text = await generateContentWithFailover("You are an expert English teacher. Output ONLY JSON.", [{ role: "user", text: systemPrompt + "\n\n" + contents }], 0.7, 8192, inlineData);

        let result;
    try {
      let cleanText = text.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```/, "").replace(/```$/, "").trim();
      }
      const rawData = JSON.parse(cleanText);
      
      if (!rawData.script) throw new Error("Missing script in AI response");
      if (!Array.isArray(rawData.questions)) throw new Error("Missing questions array");
      
      const validatedQuestions = rawData.questions.map((q: any, i: number) => {
        if (!q.question) throw new Error(`Question ${i+1} missing text`);
        
        let mappedType = "";
        if (q.type === "MCQ" || q.type === "MULTIPLE_CHOICE" || q.type === "READING_MULTIPLE_CHOICE") {
          mappedType = "MCQ";
          if (!Array.isArray(q.options) || q.options.length < 2) throw new Error(`MCQ ${i+1} missing options`);
          if (!q.correctAnswer) throw new Error(`MCQ ${i+1} missing answer`);
        } else if (q.type === "TF" || q.type === "TRUE_FALSE" || q.type === "READING_TRUE_FALSE") {
          mappedType = "TF";
          const ans = String(q.correctAnswer).toLowerCase().trim();
          if (ans !== "true" && ans !== "false") throw new Error(`TF ${i+1} has invalid answer`);
          q.correctAnswer = ans === "true" ? "True" : "False";
        } else {
          throw new Error(`Invalid type ${q.type}`);
        }
        
        return {
          type: mappedType,
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanationArabic: q.explanationArabic || ""
        };
      });
      
      result = { script: rawData.script, questions: validatedQuestions };
    } catch (e: any) {
      console.error("Failed to parse AI Audio JSON:", e.message, "\nRaw text:", text);
      return NextResponse.json({ error: "AI generated an invalid response structure. Please try again." }, { status: 500 });
    }
    
    if (!result.script) {
      return NextResponse.json({ error: "Failed to generate script." }, { status: 500 });
    }

    const ttsRes = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
      method: "POST",
      headers: {
        "Authorization": "Token " + deepgramKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: result.script })
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
    const activityId = "aiaudio_" + Date.now();
    const filePath = "ai_audio/" + lessonId + "/" + activityId + ".mp3";
    const file = bucket.file(filePath);

    await file.save(Buffer.from(audioBuffer), {
      metadata: { contentType: "audio/mpeg" }
    });

    const audioUrl = await getDownloadURL(file);

    return NextResponse.json({
      transcript: result.script,
      audioUrl: audioUrl,
      questions: result.questions
    });
  } catch (error: any) {
    console.error("AI Gen Error:", error);
    if (error.message === "AI_SERVICE_UNAVAILABLE") {
      return NextResponse.json({ error: "AI service is temporarily unavailable. Please try again later." }, { status: 503 });
    }
    let msg = error.message || "Unknown error";
    if (error instanceof SyntaxError && msg.includes("JSON")) {
      msg = "AI generated an invalid response. Please try generating fewer questions or a shorter text.";
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
