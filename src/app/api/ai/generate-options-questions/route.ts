import { NextRequest, NextResponse } from "next/server";
import { generateContentWithFailover } from "@/lib/services/aiProviderService";

export async function POST(req: NextRequest) {
  try {
    const { fileText, mcqCount, tfCount, difficulty } = await req.json();

    if (!fileText || (mcqCount === 0 && tfCount === 0)) {
      return NextResponse.json({ error: "Missing file or counts" }, { status: 400 });
    }

    let inlineData: any = undefined;
    let textContent = "";
    
    if (fileText.startsWith("data:")) {
      const match = fileText.match(/^data:(.+?);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        inlineData = {
          data: base64Data,
          mimeType: mimeType
        };
      } else {
        textContent = fileText;
      }
    } else {
      textContent = fileText;
    }

    const prompt = `
You are an expert English teacher. Create questions based on the attached document.
Requirements:
1. Difficulty level: ${difficulty}.
2. Generate EXACTLY ${mcqCount} Multiple Choice Questions (if > 0).
3. Generate EXACTLY ${tfCount} True/False Questions (if > 0).
4. For MCQs, provide 4 options.
5. Provide a short explanation in Arabic for each correct answer.

Return ONLY a valid JSON array of objects with this exact structure:
[
  {
    "type": "MULTIPLE_CHOICE" or "TRUE_FALSE",
    "question": "The question text in English?",
    "options": ["Opt1", "Opt2", "Opt3", "Opt4"],
    "correctAnswer": "The exact string of the correct option for MCQ, or exactly 'True' or 'False' for TF",
    "explanationArabic": "الشرح الصحيح"
  }
]
No markdown wrapping, no extra text. Just the JSON array. ENSURE ALL QUOTES INSIDE STRINGS ARE PROPERLY ESCAPED.
`;

    const textPayload = textContent ? `\n\nDocument Text:\n${textContent}` : "";
    const resultText = await generateContentWithFailover("You are an expert English teacher. Output ONLY JSON.", [{ role: "user", text: prompt + textPayload }], 0.7, 8192, inlineData);

    let cleanedText = resultText || "[]";
    cleanedText = cleanedText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```/, "").replace(/```$/, "").trim();
    }
    const parsed = JSON.parse(cleanedText);
    const rawQuestions = Array.isArray(parsed) ? parsed : [];
    
    // Strict schema validation & mapping
    const validatedQuestions = rawQuestions.map((q: any, index: number) => {
      if (!q.question || typeof q.question !== "string") throw new Error(`Question ${index + 1} is missing text`);
      
      let mappedType = "";
      if (q.type === "MCQ" || q.type === "MULTIPLE_CHOICE") {
        mappedType = "MULTIPLE_CHOICE";
        if (!Array.isArray(q.options) || q.options.length < 2) {
          throw new Error(`MCQ Question ${index + 1} is missing options`);
        }
        if (!q.correctAnswer) {
          throw new Error(`MCQ Question ${index + 1} is missing correctAnswer`);
        }
      } else if (q.type === "TF" || q.type === "TRUE_FALSE") {
        mappedType = "TRUE_FALSE";
        const ans = String(q.correctAnswer).toLowerCase().trim();
        if (ans !== "true" && ans !== "false") {
          throw new Error(`T/F Question ${index + 1} has invalid correctAnswer: ${q.correctAnswer}`);
        }
        q.correctAnswer = ans === "true" ? "True" : "False";
      } else {
        throw new Error(`Invalid question type: ${q.type}`);
      }

      return {
        type: mappedType,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanationArabic: q.explanationArabic || ""
      };
    });

    return NextResponse.json({ questions: validatedQuestions });
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
