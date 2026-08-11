// BURN — Cloud TTS proxy
// Streams the spoken roast. Two backends:
//
//   1. ElevenLabs (optional) — when TTS_ELEVENLABS_API_KEY + TTS_VOICE_ID are
//      set, a custom/cloned voice (e.g. a licensed clone of Wikky Thug) is
//      used. Voice settings are tuned for a dramatic, aggressive "thug"
//      delivery. Supports Malayalam via the multilingual model.
//   2. Google Translate TTS (fallback) — the same female Malayalam / English
//      voice used by Google Translate. No API key required.
//
// Env vars (set with `supabase secrets set`):
//   TTS_ELEVENLABS_API_KEY  — optional, ElevenLabs API key
//   TTS_VOICE_ID            — optional, ElevenLabs voice ID to use
//   TTS_ELEVENLABS_MODEL    — optional, default eleven_multilingual_v2
//
// Deploy: supabase functions deploy tts --no-verify-jwt

const GOOGLE_TTS = 'https://translate.google.com/translate_tts';
const ELEVENLABS_TTS = 'https://api.elevenlabs.io/v1/text-to-speech';
const MAX_TEXT = 200;
const UPSTREAM_TIMEOUT_MS = 30000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function elevenLabsConfigured(): boolean {
  return Boolean(
    Deno.env.get('TTS_ELEVENLABS_API_KEY') && Deno.env.get('TTS_VOICE_ID'),
  );
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fromElevenLabs(text: string): Promise<Response> {
  const apiKey = Deno.env.get('TTS_ELEVENLABS_API_KEY') ?? '';
  const voiceId = Deno.env.get('TTS_VOICE_ID') ?? '';
  const model = Deno.env.get('TTS_ELEVENLABS_MODEL') ?? 'eleven_multilingual_v2';

  // Low stability + a touch of style keeps the delivery expressive and punchy.
  const upstream = await fetchWithTimeout(`${ELEVENLABS_TTS}/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: {
        stability: 0.25,
        similarity_boost: 0.8,
        style: 0.35,
        use_speaker_boost: true,
      },
    }),
  });

  if (!upstream.ok) {
    return new Response(`ElevenLabs TTS failed: ${upstream.status}`, {
      status: 502,
      headers: corsHeaders,
    });
  }

  const audio = await upstream.arrayBuffer();
  return new Response(audio, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

async function fromGoogle(text: string, lang: string): Promise<Response> {
  const query = encodeURIComponent(text.trim().slice(0, MAX_TEXT));
  const url = `${GOOGLE_TTS}?ie=UTF-8&q=${query}&tl=${lang}&client=tw-ob`;

  const upstream = await fetchWithTimeout(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Referer': 'https://translate.google.com/',
    },
  });

  if (!upstream.ok) {
    return new Response(`Upstream TTS failed: ${upstream.status}`, {
      status: 502,
      headers: corsHeaders,
    });
  }

  const audio = await upstream.arrayBuffer();
  return new Response(audio, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { text, lang } = await req.json();

    if (typeof text !== 'string' || !text.trim()) {
      return new Response('Missing text', {
        status: 400,
        headers: corsHeaders,
      });
    }
    if (lang !== 'en' && lang !== 'ml') {
      return new Response('Unsupported lang', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const cleanText = text.trim().slice(0, MAX_TEXT);

    if (elevenLabsConfigured()) {
      return await fromElevenLabs(cleanText);
    }
    return await fromGoogle(cleanText, lang);
  } catch {
    return new Response('Bad request', { status: 400, headers: corsHeaders });
  }
});
