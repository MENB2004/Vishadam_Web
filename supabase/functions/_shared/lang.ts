// BURN — Shared language detection (server-side)
// Mirror of src/engine/detectLanguage.ts

export type ServerLang = 'en' | 'ml' | 'mixed';

const MALAYALAM_RANGE = /[\u0D00-\u0D7F]/;
const LATIN_RANGE = /[a-zA-Z]/;

export function detectLang(text: string): ServerLang {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return 'en';

  const hasMalayalam = MALAYALAM_RANGE.test(trimmed);
  const hasLatin = LATIN_RANGE.test(trimmed);

  if (hasMalayalam && hasLatin) return 'mixed';
  if (hasMalayalam) return 'ml';
  return 'en';
}

/** Simplifies a lang to the two options the roast engine supports. */
export function simplifyLang(lang: ServerLang): 'en' | 'ml' {
  return lang === 'ml' || lang === 'mixed' ? 'ml' : 'en';
}
