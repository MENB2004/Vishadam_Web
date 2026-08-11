// BURN — Cloud TTS proxy (Google only, no API key)
// Streams Google's native Malayalam / English voice (the same one used by
// Google Translate) so the app can speak without an OS voice pack. Proxying
// with a proper User-Agent/Referer avoids the consent-redirect/403 responses
// that block the direct browser stream.
//
// Deploy: supabase functions deploy tts --no-verify-jwt

const GOOGLE_TTS = 'https://translate.google.com/translate_tts';
const MAX_TEXT = 200;
const UPSTREAM_TIMEOUT_MS = 20000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

    const query = encodeURIComponent(text.trim().slice(0, MAX_TEXT));
    const url = `${GOOGLE_TTS}?ie=UTF-8&q=${query}&tl=${lang}&client=tw-ob`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let upstream: Response;
    try {
      upstream = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          'Referer': 'https://translate.google.com/',
        },
      });
    } finally {
      clearTimeout(timer);
    }

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
  } catch {
    return new Response('Bad request', { status: 400, headers: corsHeaders });
  }
});
