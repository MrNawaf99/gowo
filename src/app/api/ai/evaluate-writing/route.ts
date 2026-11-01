import { NextResponse } from "next/server";
import { generateContentWithFailover } from "@/lib/services/aiProviderService";

export async function POST(req: Request) {
  try {
    const { prompt, studentText, maxScore } = await req.json();

    if (!prompt || !studentText) {
      return NextResponse.json({ error: "Missing prompt or studentText" }, { status: 400 });
    }

    const max = maxScore || 10;

    const systemInstruction = `You are an expert English teacher evaluating a student's writing.
The teacher provided this prompt/question: "${prompt}"

The student wrote:
"${studentText}"

  Evaluate the student's writing based on grammar, vocabulary, relevance to the prompt, and overall coherence.
  Provide a score out of ${max} and brief, constructive feedback IN ARABIC ONLY.
  
  RETURN STRICT JSON ONLY IN THIS EXACT FORMAT:
  { "score": 8, "feedback": "مجهود جيد، لكن..." }
`;

    const text = await generateContentWithFailover("You are an expert English teacher. Output ONLY JSON.", [{ role: "user", text: systemInstruction }]);
    
    if (!text) throw new Error("No response from AI");
    
    const result = JSON.parse(text);

    return NextResponse.json(result);
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
