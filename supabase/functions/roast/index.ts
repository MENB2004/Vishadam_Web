// BURN — Dynamic roast generator
// Generates a personalized, darkly-funny demotivation line via an
// OpenAI-compatible chat-completions LLM. The server-side safety filter
// ALWAYS runs first — crisis input never reaches the model and instead
// returns a support message with helplines.
//
// Env vars (set with `supabase secrets set`):
//   ROAST_LLM_API_KEY   — required, e.g. an OpenAI key
//   ROAST_LLM_BASE_URL  — optional, default https://api.openai.com/v1
//   ROAST_LLM_MODEL     — optional, default gpt-4o-mini
//
// Deploy: supabase functions deploy roast --no-verify-jwt

import { corsHeaders } from '../_shared/cors.ts';
import { checkSafety, crisisFallbackFor } from '../_shared/safety.ts';
import { detectLang, type ServerLang } from '../_shared/lang.ts';
import { BUCKETS } from '../_shared/buckets.ts';

const MODEL = Deno.env.get('ROAST_LLM_MODEL') ?? 'gpt-4o-mini';
const BASE_URL = Deno.env.get('ROAST_LLM_BASE_URL') ?? 'https://api.openai.com/v1';
const UPSTREAM_TIMEOUT_MS = 15000;
const MAX_WORDS = 40;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildSystemPrompt(): string {
  return `You are BURN (കത്തൽ), a bilingual English–Malayalam satirical demotivation engine voiced like Wikky Thug — the savage Malayalam YouTube roaster.

A user shared a personal problem. Roast them the way Wikky Thug would: over-the-top, theatrical and brutally funny, with street-thug swagger. Use raw Kerala colloquial slang (mone, machane, da/eda energy), dramatic escalation, and a mic-drop punchline that makes them cringe first and laugh second. Mix Malayalam and English internet slang freely.

Rules:
- NEVER mock self-harm, suicide, abuse, or any crisis topic. If the input touches those, reply only with {"crisis":true}.
- One line, at most ${MAX_WORDS} words.
- Match the user's language: Malayalam/mixed input -> reply in Malayalam thug slang; English input -> keep the same thug energy in English with a sprinkle of Malayalam slang.
- Roast the situation and the choices, never genuine trauma, appearance, or identity.
- Be specific, clever, absurdly mean. Avoid generic insults and clichés.
- Output STRICT JSON only (no markdown, no explanation):
{"response_line":"...","bucket":"one of: ${BUCKETS.join('|')}"}`;
}

function parseModelOutput(raw: string): { responseLine: string; bucket: string; crisis: boolean } {
  let cleaned = (raw ?? '').trim();
  // Strip markdown code fences if the model wrapped the JSON.
  cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to salvage a bare quoted string.
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      return { responseLine: JSON.parse(cleaned), bucket: 'general', crisis: false };
    }
    throw new Error('Model returned non-JSON output');
  }

  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (obj.crisis === true) return { responseLine: '', bucket: 'general', crisis: true };

    const line = typeof obj.response_line === 'string' ? obj.response_line : '';
    let bucket = typeof obj.bucket === 'string' ? obj.bucket : 'general';
    if (!BUCKETS.includes(bucket as never)) bucket = 'general';

    return { responseLine: line.trim(), bucket, crisis: false };
  }

  throw new Error('Model returned unexpected output');
}

async function callLLM(text: string, lang: ServerLang): Promise<{ responseLine: string; bucket: string; crisis: boolean }> {
  const apiKey = Deno.env.get('ROAST_LLM_API_KEY');
  if (!apiKey) {
    throw new Error('not_configured');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${BASE_URL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.9,
        max_tokens: 120,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: `Input: ${text}\nLanguage: ${lang}` },
        ],
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      throw new Error(`LLM upstream ${upstream.status}`);
    }

    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('LLM returned empty content');
    }

    return parseModelOutput(content);
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  let body: { text?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text || text.length < 3) {
    return json({ error: 'text_required' }, 400);
  }

  // 1. Safety filter FIRST — never roast crisis content.
  const safety = checkSafety(text);
  if (safety.isCrisis) {
    return json({
      lang: detectLang(text),
      bucket: 'general',
      keyword: null,
      responseLine: safety.fallbackMessage,
      isCrisis: true,
      moodMeter: 0,
      source: 'safety',
    });
  }

  const lang = detectLang(text);

  // 2. Try the LLM, fall back to canned lines if unavailable.
  try {
    const { responseLine, bucket, crisis } = await callLLM(text, lang);
    if (crisis) {
      return json({
        lang,
        bucket: 'general',
        keyword: null,
        responseLine: crisisFallbackFor(text),
        isCrisis: true,
        moodMeter: 0,
        source: 'safety',
      });
    }
    if (!responseLine) throw new Error('empty line');

    return json({
      lang,
      bucket,
      keyword: null,
      responseLine: responseLine.slice(0, 400),
      isCrisis: false,
      moodMeter: Math.max(2, Math.floor(Math.random() * 15)),
      source: 'ai',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    if (message === 'not_configured') {
      return json({ error: 'not_configured', message: 'Roast LLM is not configured on the server.' }, 503);
    }
    // Transient failure — the client falls back to the canned engine.
    return json({ error: 'upstream_failed', message }, 502);
  }
});
