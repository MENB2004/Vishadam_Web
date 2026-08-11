// BURN — Cloud TTS proxy
// Streams Google's female Malayalam / English voice (the same one used by
// Google Translate) so the app can speak Malayalam without an OS-installed
// voice pack. No API key required on the server side.

const GOOGLE_TTS = 'https://translate.google.com/translate_tts';
const MAX_TEXT = 200;

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

    const upstream = await fetch(url, {
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
  } catch {
    return new Response('Bad request', { status: 400, headers: corsHeaders });
  }
});
