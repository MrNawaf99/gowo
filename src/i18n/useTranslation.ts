"use client";

import { useLanguage } from "@/components/layout/LanguageProvider";
import en from "./en.json";
import ar from "./ar.json";
import { translate, type Dict } from "./translate";

const dictionaries: Record<string, Dict> = { en, ar };

export function useTranslation() {
  const { locale } = useLanguage();

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = dictionaries[locale] || dictionaries["en"];
    const value = translate(dict, locale, key, params);
    if (value !== undefined) return value;

    if (process.env.NODE_ENV !== "production") {
      console.warn(`Translation key missing: "${key}" for locale "${locale}"`);
    }
    return key; // Fallback to key itself
  };

  return { t, locale };
}
