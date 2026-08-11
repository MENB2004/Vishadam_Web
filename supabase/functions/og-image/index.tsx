// BURN — OG image generator
// Renders a BURN-style social card (1200x630 PNG) for sharing links.
//
// Usage: GET /functions/v1/og-image?text=...&lang=en&bucket=breakup
// (text is the roast line; lang is en|ml; bucket is optional)
//
// Uses @vercel/og (satori + resvg WASM), which runs on the Supabase Edge
// runtime. Fonts are fetched at runtime from Google Fonts (TTF via the
// "old UA" trick; Malayalam glyphs are requested subsetted to the roast
// text) and cached in-process.
//
// Deploy: supabase functions deploy og-image --no-verify-jwt

import { ImageResponse } from 'npm:@vercel/og@0';
import React from 'npm:react@19';
import { corsHeaders } from '../_shared/cors.ts';
import { BUCKET_LABELS, isBucket } from '../_shared/buckets.ts';

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_TEXT = 260;
const MALAYALAM_RANGE = /[\u0D00-\u0D7F]/;

interface FontSpec {
  name: string;
  weight: number;
  data: ArrayBuffer;
  style: 'normal';
}

const fontCache = new Map<string, ArrayBuffer>();

/** Fetches TTF data, cached by key. */
async function cachedFont(key: string, url: string): Promise<ArrayBuffer> {
  const hit = fontCache.get(key);
  if (hit) return hit;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed: ${key} (${res.status})`);
  const buf = await res.arrayBuffer();
  fontCache.set(key, buf);
  return buf;
}

/** Loads Inter weights (400/700/900) as TTF using the "old UA" trick. */
async function loadInter(): Promise<FontSpec[]> {
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap',
    { headers: { 'User-Agent': 'Mozilla/4.0' } },
  ).then((r) => r.text());

  const specs: FontSpec[] = [];
  const seen = new Set<number>();
  const faces = css.match(/@font-face\s*\{[^}]+\}/g) ?? [];
  for (const face of faces) {
    const weight = Number(face.match(/font-weight:\s*(\d+)/)?.[1]) || 400;
    const url = face.match(/url\(([^)]+)\)/)?.[1];
    if (!url || seen.has(weight)) continue;
    seen.add(weight);
    const data = await cachedFont(`Inter:${weight}`, url);
    specs.push({ name: 'Inter', weight, data, style: 'normal' });
  }
  return specs;
}

/** Loads Noto Sans Malayalam, subsetted to the unique glyphs actually used. */
async function loadMalayalam(text: string): Promise<FontSpec[]> {
  const uniqueChars = Array.from(
    new Set([...text].filter((c) => MALAYALAM_RANGE.test(c))),
  ).join('');
  if (!uniqueChars) return [];

  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;700&text=${encodeURIComponent(uniqueChars)}&display=swap`,
    { headers: { 'User-Agent': 'Mozilla/4.0' } },
  ).then((r) => r.text());

  const specs: FontSpec[] = [];
  const seen = new Set<number>();
  const faces = css.match(/@font-face\s*\{[^}]+\}/g) ?? [];
  for (const face of faces) {
    const weight = Number(face.match(/font-weight:\s*(\d+)/)?.[1]) || 400;
    const url = face.match(/url\(([^)]+)\)/)?.[1];
    if (!url || seen.has(weight)) continue;
    seen.add(weight);
    const key = `NotoMalayalam:${weight}:${uniqueChars.slice(0, 40)}`;
    const data = await cachedFont(key, url);
    specs.push({ name: 'Noto Sans Malayalam', weight, data, style: 'normal' });
  }
  return specs;
}

function renderCard(text: string, bucketLabel: string) {
  const fontSize = Math.max(30, 46 - Math.floor(text.length / 16));

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: 'linear-gradient(160deg, #16141f 0%, #0a0a0f 55%, #050507 100%)',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
          <span
            style={{
              fontFamily: 'Inter',
              fontWeight: 900,
              fontSize: '54px',
              letterSpacing: '2px',
              color: '#ff5148',
            }}
          >
            BURN
          </span>
          <span
            style={{
              fontFamily: 'Noto Sans Malayalam, Inter',
              fontWeight: 400,
              fontSize: '26px',
              color: '#8b8b96',
            }}
          >
            കത്തൽ
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 20px',
            borderRadius: '999px',
            border: '1px solid #3a2a3a',
            backgroundColor: 'rgba(255,81,72,0.08)',
          }}
        >
          <span style={{ fontSize: '22px' }}>💀</span>
          <span
            style={{
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: '20px',
              color: '#ffb4ae',
            }}
          >
            0% encouragement guaranteed
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            alignSelf: 'flex-start',
            padding: '10px 22px',
            borderRadius: '999px',
            backgroundColor: '#1c1a24',
            border: '1px solid #2b2836',
          }}
        >
          <span style={{ fontSize: '22px' }}>{bucketLabel.split(' ')[0]}</span>
          <span
            style={{
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: '22px',
              color: '#d8d6e0',
            }}
          >
            {bucketLabel.replace(/^[^\s]+\s/, '')}
          </span>
        </div>

        <span
          style={{
            fontFamily: 'Inter, Noto Sans Malayalam',
            fontSize: `${fontSize}px`,
            lineHeight: 1.4,
            fontWeight: 400,
            color: '#f2f1f6',
            letterSpacing: '0.2px',
            display: 'flex',
          }}
        >
          “{text}”
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          borderTop: '1px solid #23202c',
          paddingTop: '28px',
        }}
      >
        <span
          style={{
            fontFamily: 'Inter',
            fontWeight: 400,
            fontSize: '20px',
            color: '#6f6c7a',
          }}
        >
          Come in a mood, leave worse.
        </span>
        <span
          style={{
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '20px',
            color: '#ff5148',
            letterSpacing: '1px',
          }}
        >
          BURN&nbsp;·&nbsp;കത്തൽ
        </span>
      </div>
    </div>
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const text = (url.searchParams.get('text') ?? '').slice(0, MAX_TEXT);
  const lang = url.searchParams.get('lang') ?? 'en';
  const bucketParam = url.searchParams.get('bucket') ?? 'general';
  const bucket = isBucket(bucketParam) ? bucketParam : 'general';

  if (!text) {
    return new Response('Missing text', { status: 400, headers: corsHeaders });
  }

  const fonts: FontSpec[] = [];
  fonts.push(...await loadInter());
  if (lang === 'ml' || lang === 'mixed' || MALAYALAM_RANGE.test(text)) {
    fonts.push(...await loadMalayalam(text));
  }

  const card = renderCard(text, BUCKET_LABELS[bucket]);

  try {
    const image = await new ImageResponse(card, {
      width: WIDTH,
      height: HEIGHT,
      fonts: fonts.length > 0 ? fonts : undefined,
    });
    return new Response(image.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Content-Length': image.headers.get('content-length') ?? '0',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, no-transform',
      },
    });
  } catch {
    return new Response('Failed to render image', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
