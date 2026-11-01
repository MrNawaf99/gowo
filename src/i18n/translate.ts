/**
 * Shared lookup used by both the client hook and the server translator so the
 * two can never drift apart.
 *
 * Arabic has six plural categories, so "{{count}} دروس" is only correct for
 * 3-10; it reads wrong for 1 ("1 دروس") and for 11+ ("20 درجات"). When a call
 * passes a numeric `count`, we therefore prefer a category-suffixed variant of
 * the key (e.g. `lessonsCount_one`, `lessonsCount_few`) and fall back to the
 * plain key when no variant is defined.
 */
export type Dict = Record<string, any>;

function lookup(dict: Dict, key: string): unknown {
  let value: unknown = dict;
  for (const part of key.split(".")) {
    if (value && typeof value === "object" && part in (value as Dict)) {
      value = (value as Dict)[part];
    } else {
      return undefined;
    }
  }
  return value;
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  let out = text;
  for (const [name, value] of Object.entries(params)) {
    out = out.replace(new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, "g"), String(value));
  }
  return out;
}

export function translate(
  dict: Dict,
  locale: string,
  key: string,
  params?: Record<string, string | number>
): string | undefined {
  let value: unknown;

  const count = params?.count;
  if (typeof count === "number" && Number.isFinite(count)) {
    let category: string;
    try {
      category = new Intl.PluralRules(locale).select(count);
    } catch {
      category = count === 1 ? "one" : "other";
    }
    // An explicit zero form reads better than "0 <plural>" in both languages.
    const candidates = count === 0 ? ["zero", category] : [category];
    for (const c of candidates) {
      const variant = lookup(dict, `${key}_${c}`);
      if (typeof variant === "string") {
        value = variant;
        break;
      }
    }
  }

  if (value === undefined) value = lookup(dict, key);
  if (typeof value !== "string") return undefined;
  return interpolate(value, params);
}
