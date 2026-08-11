// BURN — Result Page

import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { DemotivationResult } from '../engine';
import { supabase } from '../lib/supabaseClient';
import { roastShareUrl, type RoastSource } from '../lib/roastClient';
import RoastCard from '../components/RoastCard';
import {
  TTS_SUPPORTED,
  speakText,
  stopSpeech,
  stopCloudTTS,
  playCloudTTS,
  hasVoice,
  hasFemaleVoice,
  pickVoice,
  loadVoices,
  type SpeechLang,
} from '../lib/speech';
import VoicePicker from '../components/VoicePicker';

const BUCKET_LABELS: Record<string, string> = {
  'failed-exam': '📝 Failed Exam',
  'breakup': '💔 Breakup',
  'job-hunt': '🔍 Job Hunt',
  'work-stress': '💼 Work Stress',
  'nothing-works': '🌀 Nothing Works',
  'loneliness': '🫥 Loneliness',
  'family-pressure': '👨‍👩‍👧 Family Pressure',
  'health-fitness': '💪 Health & Fitness',
  'money': '💸 Money',
  'social-media': '📱 Social Media',
  'general': '☠️ General',
};

const HELPLINES = [
  {
    name: 'iCall',
    number: '+91 91529 87821',
    tel: 'tel:+919152987821',
    note: 'Mon–Sat, 10am–8pm',
  },
  {
    name: 'Vandrevala Foundation',
    number: '1860-2662-345',
    tel: 'tel:18602662345',
    note: '24/7 helpline',
  },
  {
    name: 'KIRAN (Govt. of India)',
    number: '1800-599-0019',
    tel: 'tel:18005990019',
    note: 'Toll-free · 24/7',
  },
];

interface ResultState {
  result: DemotivationResult;
  input?: string;
  source?: RoastSource;
}

const VOTE_FEEDBACK: Record<'up' | 'down', string> = {
  up: 'Our work here is done. 💀',
  down: 'We\'ll try harder next time. 😐',
};

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState | null;
  const result = state?.result ?? null;
  const input = state?.input ?? '';
  const source = state?.source ?? null;
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCloudSpeaking, setIsCloudSpeaking] = useState(false);
  const toastMessage = useRef('✅ Copied to clipboard!');
  const hasSaved = useRef(false);
  const isSpeakingRef = useRef(false);

  // Warm up the voice list (Chrome loads voices asynchronously)
  useEffect(() => {
    if (TTS_SUPPORTED) loadVoices(() => {});
  }, []);

  // Cancel any speech when leaving the page
  useEffect(
    () => () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setIsCloudSpeaking(false);
      stopSpeech();
      stopCloudTTS();
    },
    [],
  );

  // Text-to-speech for the response line
  const speakLang: SpeechLang =
    result && !result.isCrisis && (result.lang === 'ml' || result.lang === 'mixed')
      ? 'ml'
      : 'en';

  const speakingVoiceName = isSpeaking
    ? isCloudSpeaking
      ? 'Google Malayalam (cloud)'
      : (pickVoice(speakLang)?.name ?? 'system default')
    : null;

  const endSpeaking = useCallback(() => {
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    setIsCloudSpeaking(false);
  }, []);

  const handleSpeak = useCallback(async () => {
    if (!result || !TTS_SUPPORTED) return;

    if (isSpeakingRef.current) {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setIsCloudSpeaking(false);
      stopSpeech();
      stopCloudTTS();
      return;
    }

    const text = result.responseLine;

    // Malayalam: prefer the female voice. If it's missing locally (e.g. no
    // installed voice pack), fall back to the cloud proxy (Google's female
    // Malayalam voice).
    const useLocal =
      speakLang === 'ml'
        ? hasFemaleVoice('ml')
        : hasVoice('en');

    if (useLocal) {
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      speakText(text, speakLang, endSpeaking);
      return;
    }

    // Cloud path (also used when no local voice exists at all)
    isSpeakingRef.current = true;
    setIsSpeaking(true);
    setIsCloudSpeaking(true);
    const cloudOk = await playCloudTTS(text, speakLang, endSpeaking);
    if (!cloudOk) {
      // Cloud unavailable → try whatever local voice exists
      const localOk = speakText(text, speakLang, endSpeaking);
      if (!localOk) {
        endSpeaking();
        toastMessage.current = '🔇 Voice unavailable right now.';
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
      }
    }
  }, [result, speakLang, endSpeaking]);

  // Save submission when component mounts
  useEffect(() => {
    async function saveSubmission() {
      if (!result || result.isCrisis || hasSaved.current) return;
      hasSaved.current = true;

      try {
        const { data, error } = await supabase
          .from('submissions')
          .insert({
            input_text: input || 'User input text',
            lang: result.lang,
            keyword: result.keyword,
            bucket: result.bucket,
            response_line: result.responseLine,
          })
          .select('id')
          .single();

        if (error) throw error;
        if (data) setSubmissionId(data.id);
      } catch (err) {
        console.error('Failed to save submission to Supabase:', err);
      }
    }

    saveSubmission();
  }, [result, input]);

  if (!result) {
    return (
      <div className="result">
        <div className="result-card">
          <p className="result-line" style={{ opacity: 1 }}>
            You need to tell us what went wrong first.
          </p>
          <div className="result-actions" style={{ opacity: 1 }}>
            <Link to="/" className="action-btn primary">
              🏠 Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    const shareUrl = submissionId ? roastShareUrl(submissionId) : null;
    const shareText = `${result.responseLine}\n\n— BURN (കത്തൽ) | "Come in a mood, leave worse."`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BURN',
          text: shareText,
          url: shareUrl ?? undefined,
        });
      } catch {
        // User cancelled share
      }
      return;
    }

    const copyText = shareUrl ? `${shareText}\n\n${shareUrl}` : shareText;
    try {
      await navigator.clipboard.writeText(copyText);
      toastMessage.current = '✅ Copied to clipboard!';
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleVote = async (vote: 'up' | 'down') => {
    if (voted !== null || !submissionId) return;
    setVoted(vote);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          submission_id: submissionId,
          vote: vote === 'up',
        });

      if (error) throw error;
      toastMessage.current = vote === 'up' ? '💀 Pain recorded.' : '😐 Unmoved.';
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error('Failed to record feedback:', err);
    }
  };

  const lineClass = [
    'result-line',
    result.lang === 'ml' || result.lang === 'mixed' ? 'ml' : '',
    result.isCrisis ? 'crisis' : '',
    isSpeaking ? 'speaking' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="result">
      <div className="result-card">
        {!result.isCrisis && (
          <>
            <div className="result-bucket">
              {BUCKET_LABELS[result.bucket] || result.bucket}
            </div>

            {source && source !== 'safety' && (
              <span className={`result-source ${source}`}>
                {source === 'ai' ? '⚡ AI-roasted' : '📜 From the vault'}
              </span>
            )}

            {input && (
              <blockquote className="result-echo" aria-label="Your original words">
                <span className="result-echo-label">You said</span>
                <p>“{input}”</p>
              </blockquote>
            )}

            <div className={lineClass}>
              {result.responseLine}
            </div>

            {isSpeaking && (
              <>
                <div className="speaking-bars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <p className="speaking-voice">
                  Voice: {speakingVoiceName ?? 'system default'}
                </p>
              </>
            )}

            <div className="result-mood">
              <div>
                <div className="result-mood-value">{result.moodMeter}%</div>
                <div className="result-mood-label">Mood Remaining</div>
              </div>
              <div className="result-mood-bar" aria-hidden="true">
                <div
                  className="result-mood-bar-fill"
                  style={{ width: `${result.moodMeter}%` }}
                />
              </div>
            </div>

            <section className="roast-card-section" aria-label="Shareable roast card">
              <h2 className="roast-card-title">Your victim card</h2>
              <RoastCard
                text={result.responseLine}
                bucketLabel={BUCKET_LABELS[result.bucket] || result.bucket}
                lang={result.lang}
                moodMeter={result.moodMeter}
              />
            </section>

            <VoicePicker />

            <div className="result-actions">
              <button
                id="try-again-btn"
                className="action-btn primary"
                onClick={() => navigate('/')}
              >
                🔄 Try Again
              </button>

              {TTS_SUPPORTED && (
                <button
                  id="listen-btn"
                  className={`action-btn ${isSpeaking ? 'speaking' : ''}`}
                  onClick={handleSpeak}
                  aria-pressed={isSpeaking}
                >
                  {isSpeaking ? '⏹ Stop' : '🔊 Listen'}
                </button>
              )}

              <button
                id="share-btn"
                className="action-btn"
                onClick={handleShare}
              >
                📤 Share
              </button>

              {submissionId && (
                <button
                  id="copy-link-btn"
                  className="action-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(roastShareUrl(submissionId));
                      toastMessage.current = '🔗 Link copied!';
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 2000);
                    } catch {
                      // Clipboard unavailable
                    }
                  }}
                >
                  🔗 Copy Link
                </button>
              )}

              <button
                id="vote-hurt-btn"
                className={`action-btn ${voted === 'up' ? 'voted' : ''}`}
                onClick={() => handleVote('up')}
                disabled={voted !== null}
              >
                💀 That hurt
              </button>

              <button
                id="vote-meh-btn"
                className={`action-btn ${voted === 'down' ? 'voted' : ''}`}
                onClick={() => handleVote('down')}
                disabled={voted !== null}
              >
                😐 Meh
              </button>
            </div>

            {voted && (
              <p className="vote-feedback" role="status">
                {VOTE_FEEDBACK[voted]}
              </p>
            )}
          </>
        )}

        {result.isCrisis && (
          <div className="crisis-card">
            <div className="crisis-icon" aria-hidden="true">🫂</div>
            <div className={lineClass}>
              {result.responseLine}
            </div>
            <div className="crisis-helplines">
              <h2 className="crisis-helplines-title">Helplines (India)</h2>
              {HELPLINES.map(h => (
                <a key={h.name} className="crisis-helpline" href={h.tel}>
                  <span className="crisis-helpline-name">{h.name}</span>
                  <span className="crisis-helpline-number">{h.number}</span>
                  <span className="crisis-helpline-note">{h.note}</span>
                </a>
              ))}
            </div>
            <div className="result-actions">
              {TTS_SUPPORTED && (
                <button
                  className={`action-btn ${isSpeaking ? 'speaking' : ''}`}
                  onClick={handleSpeak}
                  aria-pressed={isSpeaking}
                >
                  {isSpeaking ? '⏹ Stop' : '🔊 Listen'}
                </button>
              )}
              <Link to="/" className="action-btn primary">
                🏠 Go Home
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className={`toast ${showToast ? 'show' : ''}`}>
        {toastMessage.current}
      </div>
    </div>
  );
}
