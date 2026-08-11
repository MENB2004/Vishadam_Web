// BURN — Shareable roast page (/roast/:id)
// Loads a saved roast by id (or from router state when arriving via the
// Result page) so share links survive a refresh. Includes the shareable
// card + actions.

import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import type { Bucket } from '../engine';
import { supabase } from '../lib/supabaseClient';
import { BUCKETS } from '../engine/keywords';
import { roastShareUrl } from '../lib/roastClient';
import RoastCard from '../components/RoastCard';

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

interface RoastRow {
  id: string;
  bucket: string;
  lang: string;
  response_line: string;
  created_at: string;
}

interface RoastView {
  bucket: Bucket;
  lang: 'en' | 'ml' | 'mixed';
  responseLine: string;
  moodMeter: number;
  id?: string;
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function isBucket(value: string): value is Bucket {
  return (BUCKETS as readonly string[]).includes(value);
}

function rowToView(row: RoastRow): RoastView {
  return {
    bucket: isBucket(row.bucket) ? row.bucket : 'general',
    lang: row.lang === 'ml' ? 'ml' : row.lang === 'mixed' ? 'mixed' : 'en',
    responseLine: row.response_line,
    moodMeter: 2 + (hashId(row.id) % 15),
    id: row.id,
  };
}

export default function Roast() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [view, setView] = useState<RoastView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [showToast, setShowToast] = useState(false);

  const stateView = (location.state as { view?: RoastView } | null)?.view;

  useEffect(() => {
    if (stateView) {
      setView(stateView);
      setStatus('ready');
      return;
    }

    if (!id) {
      setStatus('missing');
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('id, bucket, lang, response_line, created_at')
          .eq('id', id)
          .single();

        if (cancelled) return;
        if (error || !data) {
          setStatus('missing');
          return;
        }
        setView(rowToView(data as RoastRow));
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('missing');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, stateView]);

  const handleCopyLink = async () => {
    if (!view?.id) return;
    try {
      await navigator.clipboard.writeText(roastShareUrl(view.id));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2200);
    } catch {
      // Clipboard unavailable
    }
  };

  if (status === 'loading') {
    return (
      <div className="result">
        <div className="result-card">
          <div className="route-loading" role="status" aria-live="polite">
            <div className="processing-skull" aria-hidden="true">💀</div>
            <p>Digging up this roast...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'missing' || !view) {
    return (
      <div className="result">
        <div className="result-card">
          <div className="crisis-icon" aria-hidden="true">👻</div>
          <p className="result-line" style={{ opacity: 1 }}>
            This roast has been roasted into nonexistence.
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

  return (
    <div className="result">
      <div className="result-card">
        <div className="result-bucket">
          {BUCKET_LABELS[view.bucket] || view.bucket}
        </div>

        <div className={`result-line ${view.lang === 'ml' || view.lang === 'mixed' ? 'ml' : ''}`}>
          {view.responseLine}
        </div>

        <section className="roast-card-section" aria-label="Shareable roast card">
          <h2 className="roast-card-title">Share this victim card</h2>
          <RoastCard
            text={view.responseLine}
            bucketLabel={BUCKET_LABELS[view.bucket] || view.bucket}
            lang={view.lang}
            moodMeter={view.moodMeter}
          />
        </section>

        <div className="result-actions">
          <Link to="/" className="action-btn primary">
            💀 Make Your Own
          </Link>

          {view.id && (
            <button type="button" className="action-btn" onClick={handleCopyLink}>
              🔗 Copy Link
            </button>
          )}
        </div>
      </div>

      <div className={`toast ${showToast ? 'show' : ''}`}>
        ✅ Link copied to clipboard!
      </div>
    </div>
  );
}
