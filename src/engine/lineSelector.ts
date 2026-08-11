// BURN — NLP Engine: Line Selector
// Picks the best demotivation line for a given bucket, language, and keyword

import type { Language } from './detectLanguage';
import type { Bucket } from './keywords';
import linesData from './lines.json';

interface LineTemplate {
  template: string;
  uses_keyword: boolean;
}

type LinesDB = Record<string, Record<string, LineTemplate[]>>;

const lines = linesData as LinesDB;

// Track recently shown lines per session to avoid immediate repeats
const recentlyShown = new Set<string>();
const MAX_RECENT = 10;

function addToRecent(line: string) {
  recentlyShown.add(line);
  if (recentlyShown.size > MAX_RECENT) {
    const first = recentlyShown.values().next().value;
    if (first) recentlyShown.delete(first);
  }
}

/**
 * Selects a demotivation line for the given bucket, language, and keyword.
 * Prefers keyword-interpolated lines when a keyword is available.
 * Avoids repeating recently shown lines.
 */
export function selectLine(bucket: Bucket, lang: Language, keyword: string | null): string {
  const effectiveLang = lang === 'mixed' ? 'ml' : lang;
  const bucketLines = lines[bucket]?.[effectiveLang];

  if (!bucketLines || bucketLines.length === 0) {
    // Fallback to general bucket
    const fallback = lines['general']?.[effectiveLang];
    if (!fallback || fallback.length === 0) {
      return effectiveLang === 'ml'
        ? 'നിങ്ങൾ ഇവിടെ വന്ന fact തന്നെ ധാരാളം.'
        : 'The fact that you came here says it all.';
    }
    return pickAndInterpolate(fallback, keyword);
  }

  return pickAndInterpolate(bucketLines, keyword);
}

function pickAndInterpolate(candidates: LineTemplate[], keyword: string | null): string {
  // Separate into keyword-using and generic lines
  const keywordLines = candidates.filter(l => l.uses_keyword && keyword);
  const genericLines = candidates.filter(l => !l.uses_keyword);

  // Prefer keyword lines 70% of the time if available
  let pool: LineTemplate[];
  if (keywordLines.length > 0 && keyword && Math.random() < 0.7) {
    pool = keywordLines;
  } else if (genericLines.length > 0) {
    pool = genericLines;
  } else {
    pool = candidates;
  }

  // Filter out recently shown lines
  let available = pool.filter(l => !recentlyShown.has(l.template));
  if (available.length === 0) {
    available = pool; // Reset if all have been shown
  }

  // Random pick
  const pick = available[Math.floor(Math.random() * available.length)];
  addToRecent(pick.template);

  // Interpolate keyword
  let result = pick.template;
  if (keyword && pick.uses_keyword) {
    result = result.replace(/\{keyword\}/g, keyword);
  } else {
    // Remove any un-interpolated {keyword} placeholders
    result = result.replace(/\{keyword\}/g, '');
  }

  return result.trim();
}
