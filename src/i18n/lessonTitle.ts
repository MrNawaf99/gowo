/**
 * Lesson titles are teacher-authored content, not UI copy, so they are never
 * machine-translated. A teacher may however supply the same lesson title in
 * both English and Arabic; this picks the one matching the reader's locale.
 *
 * Legacy lessons only carry the combined `title` field ("English - عربي"),
 * so it is used as the last resort before the caller's fallback label.
 */
export interface LessonTitleFields {
  title?: string;
  titleEn?: string;
  titleAr?: string;
}

export function getLessonTitle(
  lesson: LessonTitleFields | null | undefined,
  locale: string,
  fallback = ""
): string {
  if (!lesson) return fallback;
  const preferred = locale === "ar" ? lesson.titleAr : lesson.titleEn;
  const other = locale === "ar" ? lesson.titleEn : lesson.titleAr;
  return (
    preferred?.trim() ||
    other?.trim() ||
    lesson.title?.trim() ||
    fallback
  );
}
