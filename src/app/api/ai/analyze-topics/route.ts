import { NextResponse } from "next/server";
import { generateContentWithFailover } from "@/lib/services/aiProviderService";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { pdfBase64, fileText } = await req.json();

    if (!pdfBase64 && !fileText) {
      return NextResponse.json({ error: "Missing file content" }, { status: 400 });
    }

    const promptText = `
You are an expert English teacher. 
Analyze the provided document and extract 5 to 7 specific conversation topics that would be highly relevant for an ESL student to practice speaking about.

# CRITICAL — CONVERSATION TOPIC GENERATION

When analyzing the lesson file, do NOT generate generic conversation topics just because they appear somewhere in the document.

The conversation topics must be:
1. Directly supported by the lesson content.
2. Strongly connected to the lesson's Target Grammar / Language Objective.
3. Suitable for speaking practice.
4. Able to naturally make the student USE the target grammar while speaking.
5. Appropriate for the selected lesson level.

## TARGET GRAMMAR HAS PRIORITY

First identify:
- Lesson Name
- Main Language Objective
- Target Grammar
- Main grammar patterns
- Important examples
- Important vocabulary/concepts directly related to the lesson

Then generate Conversation Topics based on those elements.
The Target Grammar is the main constraint.
Do NOT generate a topic merely because the subject appears somewhere in the source.

---

# EXAMPLE

If the lesson is:
Simple Past Tense

Then valid conversation topics can include:
- Talking about what you did yesterday
- Talking about your last weekend
- Recounting a memorable past experience
- Talking about a past trip or visit
- Talking about past habits
- Describing a series of things you did
- Talking about something that happened at school
- Talking about a past event with friends
- Practicing negative sentences about past events
- Practicing questions about past events
- Talking about regular and irregular past actions
- Talking about past states or situations

These topics are valid because they naturally encourage the student to use Simple Past.

---

# INVALID TOPIC GENERATION

Do NOT generate topics such as:
- Making plans for the upcoming weekend
- Personal goals for the future
- Current daily routine
- Current hobbies
- Future plans
- General preferences

when the lesson's target grammar is Simple Past.
These topics may be valid English conversation topics in general, but they are NOT valid primary topics for a Simple Past practice activity unless the lesson itself explicitly teaches them as part of the target objective.

---

# IMPORTANT DISTINCTION

The system must distinguish between:
### Subject/topic mentioned in the lesson
and
### Conversation topic suitable for practicing the lesson objective

Only generate the second one.

For example:
If the lesson contains examples involving: football, school, family, travel, food, etc.
Do NOT automatically create:
"Talking about football"
"Talking about your family"
"Talking about food"
unless the topic is framed so that the student naturally practices the target grammar.

Instead create something like:
"Talking about what you did at school yesterday."
This keeps the subject while preserving the grammar objective.

---

# TOPIC QUALITY TEST

Before showing a generated topic to the teacher, internally ask:
"If a student talks about this topic for 2–3 turns, will they naturally use the lesson's Target Grammar?"
If the answer is NO: do not show the topic.
If the answer is YES: the topic can be shown.

---

# TOPIC COUNT

Generate a reasonable list of high-quality topics.
Quality is more important than quantity.
Do NOT generate 10–20 weak generic topics just to make the list longer.
Prefer approximately 5–8 strong conversation topics.

---

# TOPIC WORDING

Topics should be written as clear speaking activities, not grammar labels.
Good: "Talking about what you did last weekend"
Bad: "Simple Past"
Good: "Recounting a memorable event"
Bad: "Past tense practice"

Output ONLY a valid JSON array of strings, nothing else. Example:
["Talking about yesterday", "Weekend activities", "Past experiences", "Asking questions in the past"]
`;

    let inlineData: any = undefined;
    let contents = "";
    
    if (pdfBase64) {
      // Assuming pdfBase64 is passed from the client, sometimes it has data URI prefix
      const b64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
      inlineData = {
        data: b64,
        mimeType: "application/pdf"
      };
    } else if (fileText) {
      contents = `\n\n--- Document Text ---\n${fileText}`;
    }

    let text = (await generateContentWithFailover("You are an expert English teacher. Return ONLY JSON array of strings.", [{ role: "user", text: promptText + contents }], 0.7, 8192, inlineData)).trim();

    // Extract JSON array if surrounded by markdown or preamble
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      text = match[0];
    }

    let topics: string[] = [];
    try {
      topics = JSON.parse(text);
      if (!Array.isArray(topics)) topics = [];
    } catch (e) {
      console.error("Failed to parse topics JSON, trying fallback extraction. Text:", text);
      const stringMatches = text.match(/"([^"]+)"/g);
      if (stringMatches) {
        topics = stringMatches.map(m => m.replace(/"/g, '')).filter(t => t.length > 5);
      }
    }

    return NextResponse.json({ topics });
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
