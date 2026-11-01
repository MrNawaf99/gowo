/**
 * When a quiz is submitted, an AI_AUDIO activity is flattened into one answer
 * per sub-question, keyed `${activityId}_${subQuestionId}`. Review screens look
 * questions up by answer id, so without expanding those sub-questions here the
 * audio answers are silently dropped from the review list and from the score
 * shown to the reader, even though they were graded and stored.
 */
export function buildAttemptQuestionMap(
  questions: unknown[],
  webActivities: unknown[]
): Record<string, any> {
  const map: Record<string, any> = {};

  const add = (item: any) => {
    if (!item?.id) return;
    map[item.id] = item;

    if (item.questionType === "AI_AUDIO" && Array.isArray(item.questions)) {
      for (const sub of item.questions) {
        if (!sub?.id) continue;
        map[`${item.id}_${sub.id}`] = {
          ...item,
          id: `${item.id}_${sub.id}`,
          questionType: sub.type === "MCQ" ? "AUDIO_MCQ" : "AUDIO_TRUE_FALSE",
          question: sub.question,
          correctAnswer: sub.correctAnswer,
          explanationArabic: sub.explanation,
          optionsJson: JSON.stringify(sub.options || ["True", "False"]),
          maxScore: 1,
          questions: undefined,
        };
      }
    }
  };

  questions.forEach(add);
  webActivities.forEach(add);
  return map;
}
