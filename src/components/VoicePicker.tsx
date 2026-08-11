// BURN — Voice Picker (text-to-speech voice selection)
// Lists every voice the browser exposes, so the user can verify a Malayalam
// voice exists and force-select one (e.g. "Microsoft Haritha").

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  TTS_SUPPORTED,
  getAvailableVoices,
  getStoredVoiceURI,
  setStoredVoiceURI,
  isFemaleVoice,
} from '../lib/speech';

const AUTO = 'auto';

function rankLang(lang: string): number {
  const l = lang.toLowerCase();
  if (l.startsWith('ml')) return 0;
  if (l.startsWith('en')) return 1;
  return 2;
}

export default function VoicePicker() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selected, setSelected] = useState<string>(AUTO);

  useEffect(() => {
    if (!TTS_SUPPORTED) return;

    const refresh = () => {
      setVoices(getAvailableVoices());
      setSelected(getStoredVoiceURI() ?? AUTO);
    };

    refresh();
    window.speechSynthesis.addEventListener('voiceschanged', refresh);
    const t1 = window.setTimeout(refresh, 250);
    const t2 = window.setTimeout(refresh, 1200);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', refresh);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const sortedVoices = useMemo(
    () =>
      [...voices].sort(
        (a, b) =>
          rankLang(a.lang) - rankLang(b.lang) ||
          a.name.localeCompare(b.name),
      ),
    [voices],
  );

  const mlCount = useMemo(
    () => voices.filter(v => v.lang.toLowerCase().startsWith('ml')).length,
    [voices],
  );

  if (!TTS_SUPPORTED) return null;

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelected(value);
    setStoredVoiceURI(value === AUTO ? null : value);
  };

  return (
    <div className="voice-picker">
      <label className="voice-picker-label" htmlFor="voice-select">
        Voice
      </label>
      <select
        id="voice-select"
        className="voice-picker-select"
        value={selected}
        onChange={handleChange}
        aria-label="Text-to-speech voice"
      >
        <option value={AUTO}>Auto (prefer female)</option>
        {sortedVoices.map(v => (
          <option key={v.voiceURI} value={v.voiceURI}>
            {v.name} · {v.lang}
            {isFemaleVoice(v) ? ' ♀' : ''}
          </option>
        ))}
      </select>
      {mlCount === 0 && (
        <p className="voice-picker-hint" role="status">
          No local Malayalam voice installed — the app will automatically use
          Google&apos;s cloud Malayalam voice (female) when you press Listen.
        </p>
      )}
    </div>
  );
}
