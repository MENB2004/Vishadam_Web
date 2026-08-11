// BURN — Home Page

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectLanguage, type Language } from '../engine/detectLanguage';
import { demotivate } from '../engine';
import {
  STT_SUPPORTED,
  createRecognizer,
  type SpeechLang,
  type SpeechRecognizer,
} from '../lib/speech';

const LANG_LABELS: Record<Language, string> = {
  en: 'English',
  ml: 'മലയാളം',
  mixed: 'Mixed',
};

const PLACEHOLDERS = {
  en: 'Tell us what went wrong today...\n\nType in English or Malayalam — we\'ll detect it.',
  ml: 'ഇന്ന് എന്താ പറ്റിയത്...\n\nEnglish ൽ അല്ലെങ്കിൽ മലയാളത്തിൽ ടൈപ്പ് ചെയ്യൂ.',
};

const QUICK_TRIES = [
  { label: '📝 Failed an exam', text: 'I failed my chemistry exam again.' },
  { label: '💔 Heartbreak', text: 'She left me for someone better.' },
  { label: '💼 Work stress', text: 'My boss gave me another impossible deadline.' },
  { label: '💸 Money trouble', text: 'I am completely broke this month.' },
];

const MAX_CHARS = 5000;

function moodEmoji(level: number): string {
  if (level >= 80) return '😀';
  if (level >= 60) return '🙂';
  if (level >= 40) return '😐';
  if (level >= 20) return '😟';
  return '💀';
}

export default function Home() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [lang, setLang] = useState<Language>('en');
  const [moodLevel, setMoodLevel] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<SpeechLang>('en');
  const spotRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);

  // Auto-detect language as user types
  useEffect(() => {
    if (text.trim()) {
      setLang(detectLanguage(text));
    }
  }, [text]);

  // Subtle mood decrease as user types more
  useEffect(() => {
    const decrease = Math.max(20, 100 - text.length * 0.5);
    setMoodLevel(decrease);
  }, [text]);

  // Voice toggle follows the detected language while idle
  useEffect(() => {
    if (!isListening && (lang === 'en' || lang === 'ml')) {
      setVoiceLang(lang);
    }
  }, [lang, isListening]);

  // Stop listening if the app starts processing or the page unmounts
  useEffect(() => {
    if (isProcessing) {
      recognizerRef.current?.abort();
      setIsListening(false);
    }
  }, [isProcessing]);

  useEffect(
    () => () => {
      recognizerRef.current?.abort();
    },
    [],
  );

  // Voice input (speech-to-text)
  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      recognizerRef.current?.stop();
      return;
    }

    const recognizer = createRecognizer(voiceLang);
    if (!recognizer) return;
    recognizerRef.current = recognizer;

    recognizer.onresult = event => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      const piece = transcript.trim();
      if (piece) {
        setText(prev => {
          const base = prev.trim();
          const next = base ? `${base} ${piece}` : piece;
          return next.slice(0, MAX_CHARS);
        });
      }
    };

    recognizer.onerror = event => {
      if (event.error === 'aborted') return;
      recognizerRef.current?.abort();
      setIsListening(false);
    };

    recognizer.onend = () => setIsListening(false);

    try {
      recognizer.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [isListening, voiceLang]);

  // Cursor spotlight follows the pointer without re-rendering
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (spotRef.current) {
      spotRef.current.style.setProperty('--spot-x', `${e.clientX}px`);
      spotRef.current.style.setProperty('--spot-y', `${e.clientY}px`);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 3 || isProcessing) return;

    setIsProcessing(true);

    // Small delay for dramatic effect
    setTimeout(() => {
      const result = demotivate(trimmed);
      navigate('/result', { state: { result, input: trimmed } });
    }, 800);
  }, [text, navigate, isProcessing]);

  const handleQuickTry = useCallback((sample: string) => {
    setText(sample);
    setIsProcessing(true);
    setTimeout(() => {
      const result = demotivate(sample);
      navigate('/result', { state: { result, input: sample } });
    }, 800);
  }, [navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const canSubmit = text.trim().length >= 3 && !isProcessing;

  return (
    <div className="home" onMouseMove={handleMouseMove}>
      <div className="home-bg" aria-hidden="true">
        <span className="home-bg-emoji">💀</span>
        <span className="home-bg-emoji">🥀</span>
        <span className="home-bg-emoji">💀</span>
        <span className="home-bg-emoji">🌧️</span>
        <span className="home-bg-emoji">💀</span>
      </div>

      <div className="home-orbs" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <div className="home-spotlight" ref={spotRef} aria-hidden="true" />

      <div className="home-hero">
        <div className="home-badge">
          <span className="home-badge-skull" aria-hidden="true">☠️</span>
          <span>0% encouragement guaranteed</span>
        </div>
        <h1 className="home-title">
          <span className="text-gradient glitch-text" data-text="BURN">BURN</span>
        </h1>
        <p className="home-subtitle">"Come in a mood, leave worse."</p>
      </div>

      <div className="input-section">
        <div className="input-wrapper">
          <textarea
            id="mood-input"
            className={`text-input ${lang === 'ml' ? 'ml-input' : ''}`}
            placeholder={lang === 'ml' ? PLACEHOLDERS.ml : PLACEHOLDERS.en}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_CHARS}
            disabled={isProcessing}
            autoFocus
            aria-describedby="char-count"
          />
          <span id="char-count" className="char-count" aria-live="polite">
            {text.length}/{MAX_CHARS}
          </span>

          {STT_SUPPORTED && (
            <div className="voice-controls" aria-label="Voice input">
              <div
                className="voice-lang-toggle"
                role="group"
                aria-label="Voice input language"
              >
                <button
                  type="button"
                  className={voiceLang === 'en' ? 'active' : ''}
                  onClick={() => setVoiceLang('en')}
                  disabled={isListening || isProcessing}
                  aria-pressed={voiceLang === 'en'}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={voiceLang === 'ml' ? 'active' : ''}
                  onClick={() => setVoiceLang('ml')}
                  disabled={isListening || isProcessing}
                  aria-pressed={voiceLang === 'ml'}
                >
                  ML
                </button>
              </div>

              <button
                id="mic-btn"
                type="button"
                className={`mic-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleVoiceInput}
                disabled={isProcessing}
                aria-pressed={isListening}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              >
                <span aria-hidden="true">{isListening ? '🔴' : '🎤'}</span>
                <span>{isListening ? 'Listening…' : 'Speak'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="quick-tries" aria-label="Quick try examples">
          <span className="quick-tries-label">Don&apos;t know what to say?</span>
          <div className="quick-tries-list">
            {QUICK_TRIES.map(q => (
              <button
                key={q.label}
                type="button"
                className="quick-try-chip"
                onClick={() => handleQuickTry(q.text)}
                disabled={isProcessing}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div className="input-footer">
          <div className="input-footer-left">
            <div className={`lang-chip ${lang}`}>
              <span className="lang-dot" />
              <span>{LANG_LABELS[lang]}</span>
            </div>
            <span className="kbd-hint">
              <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to submit
            </span>
          </div>

          <button
            id="demotivate-btn"
            className="demotivate-btn"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isProcessing ? (
              <>
                <span className="spinner" />
                Processing...
              </>
            ) : (
              <>💀 Demotivate Me</>
            )}
          </button>
        </div>
      </div>

      <div className="mood-meter">
        <div className="mood-meter-label">
          <span>
            <span className="mood-meter-emoji" aria-hidden="true">{moodEmoji(moodLevel)}</span>
            Mood Level
          </span>
          <span>{Math.round(moodLevel)}%</span>
        </div>
        <div className="mood-meter-track">
          <div
            className="mood-meter-fill"
            style={{ width: `${moodLevel}%` }}
          />
        </div>
      </div>

      {isProcessing && (
        <div className="processing-overlay" role="status" aria-live="polite">
          <div className="processing-skull" aria-hidden="true">💀</div>
          <p>Summoning your personal misery...</p>
        </div>
      )}
    </div>
  );
}
