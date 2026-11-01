import { NextResponse } from "next/server";
import { generateContentWithFailover } from "@/lib/services/aiProviderService";
import { adminDb } from "@/lib/firebaseAdmin";

export const maxDuration = 60;

function extractJsonFromText(text: string): string {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  return match ? match[0] : text;
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

function checkVocabulary(text: string, requiredVocab: string[] = []): { required: string[], used: string[], missed: string[] } {
  if (!requiredVocab || requiredVocab.length === 0) return { required: [], used: [], missed: [] };
  
  const used: string[] = [];
  const missed: string[] = [];
  
  for (const word of requiredVocab) {
    const normalizedWord = word.trim();
    const escapedWord = normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
    
    if (regex.test(text)) {
      used.push(word);
    } else {
      missed.push(word);
    }
  }
  return { required: requiredVocab, used, missed };
}

export async function POST(req: Request) {
  try {
    const { attemptId } = await req.json();
    if (!attemptId) return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });

    if (!adminDb) return NextResponse.json({ error: "DB not init" }, { status: 500 });
    const attemptDoc = await adminDb.collection("web_results").doc(attemptId).get();
    if (!attemptDoc.exists) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    const attempt = attemptDoc.data()!;

    let hasUpdates = false;
    let questionsLoaded = false;
    const questionsMap: Record<string, any> = {};
    const activitiesMap: Record<string, any> = {};

    const loadContextData = async () => {
      if (questionsLoaded) return;
      const [qSnap, aSnap] = await Promise.all([
        adminDb!.collection("questions").where("lessonId", "==", attempt.lessonId).get(),
        adminDb!.collection("web_activities").where("lessonId", "==", attempt.lessonId).get()
      ]);
      qSnap.forEach(doc => { questionsMap[doc.id] = doc.data(); });
      aSnap.forEach(doc => { activitiesMap[doc.id] = doc.data(); });
      questionsLoaded = true;
    };

    for (let i = 0; i < attempt.answers.length; i++) {
      const ans = attempt.answers[i];
      
      // AI CONVERSATION
      if (ans.conversationData && ans.conversationData.reviewState === "PENDING_REVIEW" && ans.conversationData.aiScore === undefined) {
        await loadContextData();
        const activityData = activitiesMap[ans.questionId];
        
        const transcript = ans.conversationData.turns.map((t: any) => `${t.speaker}: ${t.text}`).join("\n");
        const studentTurns = ans.conversationData.turns.filter((t: any) => t.speaker === "STUDENT").map((t: any) => t.text).join(" ");
        
        const vocabCheck = checkVocabulary(studentTurns, activityData?.requiredVocabulary);

        const prompt = `
You are an expert English teacher evaluating a student's conversation with an AI.
${activityData?.question ? `Topic / Goal: "${activityData.question}"` : ""}
${activityData?.evaluationGuidance ? `TEACHER'S EVALUATION GUIDANCE: "${activityData.evaluationGuidance}"\n(Additional evaluation guidance from the teacher)` : ""}

Here is the full transcript:
${transcript}

SYSTEM VOCABULARY CHECK (Student's usage only):
${vocabCheck.required.length > 0 ? `Required Words: ${vocabCheck.required.join(", ")}\nUsed Words: ${vocabCheck.used.join(", ")}\nMissed Words: ${vocabCheck.missed.join(", ")}\n(Take this into account for your vocabulary and feedback evaluation)` : "None required."}

Evaluate the STUDENT's performance on grammar, vocabulary, and communication.
Give a score from 0 to 10 (integer).
Provide brief, constructive feedback IN ARABIC ONLY.

RETURN STRICT JSON ONLY IN THIS EXACT FORMAT:
{
  "score": 8,
  "feedback": "...",
  "aiAnalysis": {
    "grammar": "Excellent" | "Good" | "Medium" | "Weak" | "N/A",
    "vocabulary": "Excellent" | "Good" | "Medium" | "Weak" | "N/A",
    "sentenceStrength": "Excellent" | "Good" | "Medium" | "Weak" | "N/A",
    "topicRelevance": "Excellent" | "Good" | "Medium" | "Weak" | "N/A",
    "targetGrammar": "Complete" | "Partial" | "None" | "N/A",
    "strengths": ["...", "..."],
    "improvements": ["...", "..."]
  }
}
`;
        try {
          const text = await generateContentWithFailover("You are an expert evaluator. Output ONLY JSON.", [{ role: "user", text: prompt }]);
          const parsed = JSON.parse(extractJsonFromText(text));
          ans.conversationData.aiScore = parsed.score;
          ans.conversationData.aiFeedback = parsed.feedback;
          ans.conversationData.aiAnalysis = {
            ...parsed.aiAnalysis,
            // Only attach the check when one was configured: Firestore rejects
            // an update containing `undefined` anywhere in the document.
            ...(vocabCheck.required.length > 0 ? { requiredVocabulary: vocabCheck } : {})
          };
          hasUpdates = true;
        } catch (e: any) {
          console.error("Evaluation error", e);
          if (e.message === "AI_SERVICE_UNAVAILABLE") throw e;
        }
      }

      // WRITING / SPEAKING
      if (ans.writingSpeakingData && ans.writingSpeakingData.reviewState === "PENDING_REVIEW" && ans.writingSpeakingData.aiScore === undefined) {
        await loadContextData();
        const q = questionsMap[ans.questionId];
        
        const studentText = ans.writingSpeakingData.finalAnswerText || "";
        const qText = q ? q.question : "Answer the question.";
        const maxScore = q ? (q.maxScore || 10) : 10;
        
        const vocabCheck = checkVocabulary(studentText, q?.requiredVocabulary);

        const prompt = `
You are an expert English teacher evaluating a student's writing.
The teacher provided this prompt/question: "${qText}"
${q?.evaluationGuidance ? `TEACHER'S EVALUATION GUIDANCE: "${q.evaluationGuidance}"\n(Additional evaluation guidance from the teacher)` : ""}

The student wrote:
"${studentText}"

SYSTEM VOCABULARY CHECK:
${vocabCheck.required.length > 0 ? `Required Words: ${vocabCheck.required.join(", ")}\nUsed Words: ${vocabCheck.used.join(", ")}\nMissed Words: ${vocabCheck.missed.join(", ")}\n(Take this into account for your vocabulary and feedback evaluation)` : "None required."}

Evaluate the student's writing based on grammar, vocabulary, relevance to the prompt, and overall coherence.
Provide a score out of ${maxScore} (integer).
Provide brief, constructive feedback IN ARABIC ONLY.

RETURN STRICT JSON ONLY IN THIS EXACT FORMAT:
{
  "score": 8,
  "feedback": "...",
  "aiAnalysis": {
    "grammar": "Excellent" | "Good" | "Medium" | "Weak" | "N/A",
    "vocabulary": "Excellent" | "Good" | "Medium" | "Weak" | "N/A",
    "sentenceStrength": "Excellent" | "Good" | "Medium" | "Weak" | "N/A",
    "topicRelevance": "Excellent" | "Good" | "Medium" | "Weak" | "N/A",
    "targetGrammar": "Complete" | "Partial" | "None" | "N/A",
    "strengths": ["...", "..."],
    "improvements": ["...", "..."]
  }
}
`;
        try {
          const text = await generateContentWithFailover("You are an expert English teacher. Output ONLY JSON.", [{ role: "user", text: prompt }]);
          const parsed = JSON.parse(extractJsonFromText(text));
          ans.writingSpeakingData.aiScore = parsed.score;
          ans.writingSpeakingData.aiFeedback = parsed.feedback;
          ans.writingSpeakingData.aiAnalysis = {
            ...parsed.aiAnalysis,
            ...(vocabCheck.required.length > 0 ? { requiredVocabulary: vocabCheck } : {})
          };
          hasUpdates = true;
        } catch (e: any) {
          console.error("Writing evaluation error", e);
          if (e.message === "AI_SERVICE_UNAVAILABLE") throw e;
        }
      }
    }

    if (hasUpdates) {
      const newScore = attempt.answers.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0);
      const stillPending = attempt.answers.some((a: any) => 
        (a.conversationData?.reviewState === "PENDING_REVIEW") || 
        (a.writingSpeakingData?.reviewState === "PENDING_REVIEW")
      );
      
      // The model can also omit optional fields; one `undefined` anywhere in the
      // payload makes Firestore reject the whole update and lose the evaluation.
      await adminDb.collection("web_results").doc(attemptId).update({
        answers: stripUndefined(attempt.answers),
        currentScore: newScore,
        hasPendingReview: stillPending
      });
    }

    return NextResponse.json({ success: true });
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
