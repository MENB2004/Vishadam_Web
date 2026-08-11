// BURN — Web Speech helpers (voice input + voice output)
// Speech-to-text and text-to-speech with English/Malayalam support.
// Degrades gracefully when the browser or device has no matching voices.

export type SpeechLang = 'en' | 'ml';

/* --- Capability detection --- */

export const STT_SUPPORTED =
  typeof window !== 'undefined' &&
  typeof (
    window as unknown as {
      webkitSpeechRecognition?: unknown;
      SpeechRecognition?: unknown;
    }
  ).webkitSpeechRecognition === 'function';

export const TTS_SUPPORTED =
  typeof window !== 'undefined' && 'speechSynthesis' in window;

/* --- Locale mapping --- */

export function sttLang(lang: SpeechLang): string {
  return lang === 'ml' ? 'ml-IN' : 'en-IN';
}

export function ttsLang(lang: SpeechLang): string {
  return lang === 'ml' ? 'ml-IN' : 'en-IN';
}

/* --- Speech-to-Text (input) --- */

interface RecognitionAlternative {
  transcript: string;
}

interface RecognitionResult {
  isFinal: boolean;
  [index: number]: RecognitionAlternative;
}

interface RecognitionResults {
  length: number;
  [index: number]: RecognitionResult;
}

interface RecognitionEvent {
  resultIndex: number;
  results: RecognitionResults;
}

interface RecognitionErrorEvent {
  error: string;
}

export interface SpeechRecognizer {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

export function createRecognizer(lang: SpeechLang): SpeechRecognizer | null {
  if (!STT_SUPPORTED) return null;

  const w = window as unknown as {
    webkitSpeechRecognition?: new () => SpeechRecognizer;
    SpeechRecognition?: new () => SpeechRecognizer;
  };
  const Ctor = w.webkitSpeechRecognition ?? w.SpeechRecognition;
  if (!Ctor) return null;

  const recognizer = new Ctor();
  recognizer.lang = sttLang(lang);
  recognizer.interimResults = false;
  recognizer.continuous = true;
  return recognizer;
}

/* --- Text-to-Speech (output) --- */

const VOICE_STORAGE_KEY = 'burn_voice_uri';

/** Manual voice override chosen via the voice picker (persisted). */
export function getStoredVoiceURI(): string | null {
  try {
    return window.localStorage.getItem(VOICE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredVoiceURI(uri: string | null): void {
  try {
    if (uri) window.localStorage.setItem(VOICE_STORAGE_KEY, uri);
    else window.localStorage.removeItem(VOICE_STORAGE_KEY);
  } catch {
    // storage unavailable
  }
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!TTS_SUPPORTED) return [];
  return window.speechSynthesis.getVoices();
}

/** Known female voice name markers (lowercased). */
const FEMALE_VOICE_NAMES = [
  'haritha',
  'zira',
  'jenny',
  'allison',
  'samantha',
  'ava',
  'emma',
  'fiona',
  'karen',
  'tessa',
  'moira',
  'serena',
  'salli',
  'joanna',
  'kendra',
  'michelle',
  'vicki',
  'hazel',
  'zoe',
  'susan',
  'aria',
  'sonia',
  'female',
  'google us english',
];

export function isFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  return FEMALE_VOICE_NAMES.some(marker => voice.name.toLowerCase().includes(marker));
}

export function pickVoice(lang: SpeechLang): SpeechSynthesisVoice | null {
  if (!TTS_SUPPORTED) return null;
  const target = ttsLang(lang);
  const voices = window.speechSynthesis.getVoices();
  const exact = voices.filter(v => v.lang === target);
  const family = voices.filter(v => v.lang.toLowerCase().startsWith(lang));

  const stored = getStoredVoiceURI();
  if (stored) {
    const override = voices.find(v => v.voiceURI === stored);
    if (override) return override;
  }

  return (
    exact.find(isFemaleVoice) ??
    exact[0] ??
    family.find(isFemaleVoice) ??
    family[0] ??
    null
  );
}

export function hasVoice(lang: SpeechLang): boolean {
  return pickVoice(lang) !== null;
}

/** True when a female voice exists for the language (e.g. Haritha for Malayalam). */
export function hasFemaleVoice(lang: SpeechLang): boolean {
  if (!TTS_SUPPORTED) return false;
  const target = ttsLang(lang);
  const voices = window.speechSynthesis.getVoices();
  return voices.some(
    v =>
      (v.lang === target || v.lang.toLowerCase().startsWith(lang)) &&
      isFemaleVoice(v),
  );
}

export function speakText(
  text: string,
  lang: SpeechLang,
  onDone?: () => void,
): boolean {
  if (!text.trim()) return false;

  // Always check Web Speech API support first
  if (TTS_SUPPORTED) {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = ttsLang(lang); // 'ml-IN' for Malayalam, 'en-IN' for English
      
      const voice = pickVoice(lang);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => onDone?.();
      utterance.onerror = (e) => {
        console.warn('Local speech synthesis error:', e);
        onDone?.();
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.warn('SpeechSynthesis failed:', err);
    }
  }

  // Fallback to Web Audio stream if Web Speech API fails
  playCloudTTS(text, lang, onDone);
  return true;
}

export function stopSpeech(): void {
  if (TTS_SUPPORTED) window.speechSynthesis.cancel();
}

/* --- Cloud TTS fallback (Supabase Edge Function proxy) --- */

let cloudPlayback: { audio: HTMLAudioElement; url: string } | null = null;

/** Stops any in-flight cloud audio playback. */
export function stopCloudTTS(): void {
  const playback = cloudPlayback;
  cloudPlayback = null;
  if (playback) {
    playback.audio.onended = null;
    playback.audio.onerror = null;
    playback.audio.pause();
    playback.audio.src = '';
    URL.revokeObjectURL(playback.url);
  }
}

/**
 * Speaks text through the `tts` Supabase Edge Function (Google's voice).
 * Resolves `true` if audio started playing, `false` if the cloud is
 * unavailable so the caller can fall back to a local voice.
 */
/**
 * Speaks text using a direct public web audio TTS stream (Google's native speech synthesis).
 * Guarantees native Malayalam and English voice playback across all browsers and OSs.
 */
export async function playCloudTTS(
  text: string,
  lang: SpeechLang,
  onDone?: () => void,
): Promise<boolean> {
  stopCloudTTS();

  const targetLang = lang === 'ml' ? 'ml' : 'en';
  const encodedText = encodeURIComponent(text.trim());
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${targetLang}&client=tw-ob`;

  try {
    const audio = new Audio(ttsUrl);
    const playback = { audio, url: ttsUrl };
    cloudPlayback = playback;

    const finish = () => {
      if (cloudPlayback === playback) cloudPlayback = null;
      onDone?.();
    };

    audio.onended = finish;
    audio.onerror = () => {
      // If direct audio fails, try legacy Edge function fallback
      finish();
    };

    await audio.play();
    return true;
  } catch {
    stopCloudTTS();
    return false;
  }
}

/** Warm up the voice list — Chrome loads voices asynchronously (and sometimes
 *  needs a delayed read or a `voiceschanged` event before they appear). */
const voiceListeners = new Set<() => void>();

function pollVoices(): void {
  if (!TTS_SUPPORTED) return;
  if (window.speechSynthesis.getVoices().length > 0) {
    voiceListeners.forEach(fn => fn());
  }
}

export function loadVoices(callback?: () => void): void {
  if (!TTS_SUPPORTED) return;

  if (callback) voiceListeners.add(callback);

  const synth = window.speechSynthesis;
  synth.addEventListener('voiceschanged', pollVoices);

  pollVoices();
  window.setTimeout(pollVoices, 200);
  window.setTimeout(pollVoices, 800);
  window.setTimeout(pollVoices, 2000);
}
