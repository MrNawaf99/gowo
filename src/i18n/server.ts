import { cookies } from "next/headers";
import en from "./en.json";
import ar from "./ar.json";
import { translate, type Dict } from "./translate";

const dictionaries: Record<string, Dict> = { en, ar };

export async function getTranslator() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "ar";

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = dictionaries[locale] || dictionaries["en"];
    const value = translate(dict, locale, key, params);
    if (value !== undefined) return value;

    if (process.env.NODE_ENV !== "production") {
      console.warn(`Translation key missing: "${key}" for locale "${locale}"`);
    }
    return key;
  };

  return { t, locale };
}
