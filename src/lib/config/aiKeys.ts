/**
 * AI Provider API Keys configuration.
 *
 * Keys are loaded from environment variables to prevent hardcoding
 * sensitive credentials in source code.
 */

export const GEMINI_KEYS: string[] = (
  process.env.GEMINI_API_KEYS
    ? process.env.GEMINI_API_KEYS.split(",").map((k) => k.trim()).filter(Boolean)
    : process.env.GEMINI_API_KEY
    ? [process.env.GEMINI_API_KEY.trim()]
    : []
);

export const OPENROUTER_KEYS: string[] = (
  process.env.OPENROUTER_API_KEYS
    ? process.env.OPENROUTER_API_KEYS.split(",").map((k) => k.trim()).filter(Boolean)
    : process.env.OPENROUTER_API_KEY
    ? [process.env.OPENROUTER_API_KEY.trim()]
    : []
);
