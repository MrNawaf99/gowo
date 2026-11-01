import { getGrammarLessons } from "@/lib/grammar";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getTranslator } from "@/i18n/server";

export default async function Home() {
  const lessons = await getGrammarLessons();
  const { t, locale } = await getTranslator();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white py-6 px-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <BookOpen className="w-8 h-8" />
          <h1 className="text-2xl font-bold">{t("home.appTitle")}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t("nav.grammar")}</h2>
          <p className="text-gray-500 text-sm">{t("grammar.chooseLesson")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map((lesson) => {
            // Grammar lessons are static content authored in both languages;
            // show the reader's language first and the other as a subtitle.
            const primary = locale === "ar" ? lesson.titleAr : lesson.title;
            const secondary = locale === "ar" ? lesson.title : lesson.titleAr;
            return (
              <Link
                key={lesson.lessonId}
                href={`/quiz/${lesson.lessonId}`}
                className="bg-gray-100 rounded-2xl p-6 shadow-sm border border-gray-400 hover:border-primary hover:shadow-md transition-all flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                    {primary}
                  </h3>
                  <p className="text-sm text-gray-500 truncate" dir={locale === "ar" ? "ltr" : "rtl"}>
                    {secondary}
                  </p>
                </div>
                <div className="w-10 h-10 shrink-0 bg-primary-container rounded-full flex items-center justify-center">
                  <span className="text-on-primary-container font-bold text-xl">
                    {lesson.title.charAt(0)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
