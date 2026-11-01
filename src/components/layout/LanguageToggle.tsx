"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

/**
 * The header toggle only exists inside AppLayout, so the landing and login
 * pages had no way to change language - a first-time visitor who wants English
 * was stuck in the default Arabic until after signing in.
 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "ar" : "en")}
      className={
        "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold " +
        "text-gray-600 hover:text-primary hover:bg-gray-200 transition-colors " +
        className
      }
    >
      <Globe className="w-4 h-4" />
      {locale === "en" ? "العربية" : "English"}
    </button>
  );
}
