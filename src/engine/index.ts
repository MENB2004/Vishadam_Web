// VISHADAM — NLP Engine: Main Orchestrator

import { detectLanguage, type Language } from './detectLanguage';
import { checkSafety } from './safetyFilter';
import { extractKeywords, mapToBucket, type Bucket } from './keywords';
import { selectLine } from './lineSelector';

export interface DemotivationResult {
  lang: Language;
  keyword: string | null;
  bucket: Bucket;
  responseLine: string;
  isCrisis: boolean;
  moodMeter: number;
}

/**
 * Main entry point: takes user input text, runs the full pipeline,
 * and returns a personalized demotivation response.
 */
export function demotivate(inputText: string): DemotivationResult {
  // 1. Detect language
  const lang = detectLanguage(inputText);

  // 2. Safety check — never mock crisis content
  const safety = checkSafety(inputText, lang);
  if (safety.isCrisis) {
    return {
      lang,
      keyword: null,
      bucket: 'general',
      responseLine: safety.fallbackMessage!,
      isCrisis: true,
      moodMeter: 0,
    };
  }

  // 3. Extract keywords
  const keywords = extractKeywords(inputText, lang);

  // 4. Map to bucket
  const { bucket, keyword } = mapToBucket(keywords, lang);

  // 5. Select a demotivation line
  const responseLine = selectLine(bucket, lang, keyword);

  // 6. Calculate mood meter (satirical — always low)
  const moodMeter = Math.max(2, Math.floor(Math.random() * 15));

  return {
    lang,
    keyword,
    bucket,
    responseLine,
    isCrisis: false,
    moodMeter,
  };
}

// Re-export types
export type { Language, Bucket };
