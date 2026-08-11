// BURN — Dynamic roast client
// Tries the `roast` Supabase Edge Function (LLM-powered) and transparently
// falls back to the local canned-line engine when it's not configured,
// unreachable, or errors. The client-side safety filter ALWAYS runs first,
// so crisis input never reaches the network.

import { demotivate, type DemotivationResult } from '../engine';
import { checkSafety } from '../engine/safetyFilter';
import { detectLanguage } from '../engine/detectLanguage';
import { BUCKETS, type Bucket } from '../engine/keywords';

export type RoastSource = 'ai' | 'local' | 'safety';

export interface RoastOutcome {
  result: DemotivationResult;
  source: RoastSource;
}

const ROAST_ENDPOINT = (import.meta.env.VITE_ROAST_ENDPOINT as string | undefined) ?? '';
const REQUEST_TIMEOUT_MS = 12000;

interface RoastApiResponse {
  lang?: 'en' | 'ml' | 'mixed';
  bucket?: string;
  responseLine?: string;
  isCrisis?: boolean;
  moodMeter?: number;
  error?: string;
}

/** True when the dynamic roast endpoint has been configured. */
export function roastEndpointConfigured(): boolean {
  return Boolean(ROAST_ENDPOINT);
}

function isBucket(value: string | undefined): value is Bucket {
  return Boolean(value && (BUCKETS as readonly string[]).includes(value));
}

function clampMood(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return Math.max(2, Math.floor(Math.random() * 15));
  }
  return Math.min(15, Math.max(2, Math.round(value)));
}

/**
 * Generates a roast for the given input.
 * - Crisis input → local safety response (never sent to the LLM).
 * - Configured + healthy endpoint → AI roast.
 * - Otherwise → local canned-line roast.
 */
export async function generateRoast(inputText: string): Promise<RoastOutcome> {
  const text = inputText.trim();
  if (text.length < 3) {
    throw new Error('Input too short');
  }

  const lang = detectLanguage(text);

  // 1. Safety filter first.
  const safety = checkSafety(text, lang);
  if (safety.isCrisis) {
    return {
      result: {
        lang,
        keyword: null,
        bucket: 'general',
        responseLine: safety.fallbackMessage!,
        isCrisis: true,
        moodMeter: 0,
      },
      source: 'safety',
    };
  }

  // 2. No endpoint configured → canned lines.
  if (!ROAST_ENDPOINT) {
    return { result: demotivate(text), source: 'local' };
  }

  // 3. Try the LLM endpoint with a timeout.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(ROAST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`roast endpoint responded ${res.status}`);
    const data = (await res.json()) as RoastApiResponse;
    if (!data.responseLine || !data.responseLine.trim()) {
      throw new Error('roast endpoint returned an empty line');
    }

    if (data.isCrisis) {
      return {
        result: {
          lang: data.lang ?? lang,
          keyword: null,
          bucket: isBucket(data.bucket) ? data.bucket : 'general',
          responseLine: data.responseLine,
          isCrisis: true,
          moodMeter: 0,
        },
        source: 'safety',
      };
    }

    return {
      result: {
        lang: data.lang ?? lang,
        keyword: null,
        bucket: isBucket(data.bucket) ? data.bucket : 'general',
        responseLine: data.responseLine,
        isCrisis: false,
        moodMeter: clampMood(data.moodMeter),
      },
      source: 'ai',
    };
  } catch {
    return { result: demotivate(text), source: 'local' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Builds a shareable URL for a saved submission.
 * Points at the roast-page function (which renders OG metadata) when
 * Supabase is configured, otherwise at the SPA's /roast/:id route.
 */
export function roastShareUrl(id: string): string {
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/roast-page?id=${encodeURIComponent(id)}`;
  }

  const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined) ?? '';
  const base = siteUrl ? siteUrl.replace(/\/$/, '') : window.location.origin;
  return `${base}/roast/${encodeURIComponent(id)}`;
}
