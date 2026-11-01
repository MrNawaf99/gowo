/* eslint-disable @typescript-eslint/no-require-imports */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { GoogleGenAI, Type } = require("@google/genai");

initializeApp();
const db = getFirestore();

let ai = null;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

exports.evaluateAttempt = onDocumentCreated({
    document: "web_results/{attemptId}",
    retry: true 
}, async (event) => {
    // Check idempotency (prevent double processing)
    const eventId = event.id;
    const idempotencyRef = db.collection("function_events").doc(eventId);
    
    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(idempotencyRef);
            if (doc.exists) {
                throw new Error("ALREADY_PROCESSED");
            }
            t.set(idempotencyRef, { processedAt: new Date().toISOString() });
        });
    } catch (e) {
        if (e.message === "ALREADY_PROCESSED") {
            console.log(`Event ${eventId} already processed. Skipping.`);
            return;
        }
        throw e;
    }

    if (!ai) {
        console.error("GEMINI_API_KEY is missing in Firebase environment!");
        return; // We don't throw to retry forever if key is missing
    }

    const snapshot = event.data;
    if (!snapshot) return;

    const attempt = snapshot.data();
    if (!attempt || !attempt.answers) return;

    let hasUpdates = false;
    const updatedAnswers = [...attempt.answers];

    // Fetch questions to get the prompts and maxScores
    const questionsSnapshot = await db.collection("questions")
        .where("lessonId", "==", attempt.lessonId)
        .get();
        
    const qMap = new Map();
    questionsSnapshot.forEach(doc => {
        qMap.set(doc.id, doc.data());
    });

    for (let i = 0; i < updatedAnswers.length; i++) {
        const ans = updatedAnswers[i];
        const q = qMap.get(ans.questionId);
        if (!q) continue;

        if (ans.questionType === "WRITING" && ans.writingSpeakingData && ans.writingSpeakingData.reviewState === "PENDING_REVIEW" && ans.writingSpeakingData.aiScore === undefined) {
            
            const textToEvaluate = ans.writingSpeakingData.finalAnswerText;

            if (textToEvaluate && textToEvaluate.trim().length > 0) {
                const max = q.maxScore || 10;
                const systemInstruction = `You are an expert English teacher evaluating a student's writing.
The teacher provided this prompt/question: "${q.question}"

The student wrote:
"${textToEvaluate}"

Evaluate the student's writing based on grammar, vocabulary, relevance to the prompt, and overall coherence.
Provide a score out of ${max} and brief, constructive feedback.`;

                const responseSchema = {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER, description: `The numeric score out of ${max}.` },
                        feedback: { type: Type.STRING, description: "Constructive feedback" },
                    },
                    required: ["score", "feedback"],
                };

                try {
                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: systemInstruction,
                        config: { responseMimeType: "application/json", responseSchema },
                    });
                    const text = response.text;
                    if (text) {
                        const aiData = JSON.parse(text);
                        ans.writingSpeakingData.aiScore = aiData.score;
                        ans.writingSpeakingData.aiFeedback = aiData.feedback;
                        hasUpdates = true;
                    }
                } catch (e) {
                    console.error("Gemini eval failed for question", q.id, e);
                    throw e; // Throw to trigger Firebase retry!
                }
            } else {
                // Empty answer
                ans.writingSpeakingData.aiScore = 0;
                ans.writingSpeakingData.aiFeedback = "No answer provided.";
                hasUpdates = true;
            }
        }
    }

    if (hasUpdates) {
        await snapshot.ref.update({ answers: updatedAnswers });
        console.log(`Updated attempt ${event.params.attemptId} with AI evaluation.`);
    }
});

