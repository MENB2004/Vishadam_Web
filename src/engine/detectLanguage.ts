// BURN — NLP Engine: Language Detection

/**
 * Detects the language of input text.
 * - Checks for Malayalam Unicode range (U+0D00–U+0D7F)
 * - Falls back to 'en' for Latin script
 * - Returns 'mixed' when both are present
 */
export type Language = 'en' | 'ml' | 'mixed';

const MALAYALAM_RANGE = /[\u0D00-\u0D7F]/;
const LATIN_RANGE = /[a-zA-Z]/;

export function detectLanguage(text: string): Language {
  const trimmed = text.trim();
  if (!trimmed) return 'en';

  const hasMalayalam = MALAYALAM_RANGE.test(trimmed);
  const hasLatin = LATIN_RANGE.test(trimmed);

  if (hasMalayalam && hasLatin) return 'mixed';
  if (hasMalayalam) return 'ml';
  return 'en';
}
