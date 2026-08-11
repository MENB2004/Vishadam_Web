// BURN — Roast Card preview + download
// Shows a canvas preview of the shareable roast card and lets the user
// download it as a PNG.

import { useEffect, useRef, useState } from 'react';
import { drawRoastCard, downloadRoastCard } from '../lib/roastCard';
import type { RoastCardOptions } from '../lib/roastCard';

interface RoastCardProps extends RoastCardOptions {
  showDownload?: boolean;
}

export default function RoastCard({
  text,
  bucketLabel,
  lang,
  moodMeter,
  showDownload = true,
}: RoastCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      await drawRoastCard(canvas, { text, bucketLabel, lang, moodMeter });
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [text, bucketLabel, lang, moodMeter]);

  const handleDownload = async () => {
    setSaving(true);
    try {
      await downloadRoastCard({ text, bucketLabel, lang, moodMeter });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="roast-card-wrap">
      <canvas
        ref={canvasRef}
        width={1200}
        height={630}
        className="roast-card-canvas"
        aria-label={`BURN roast card: ${text}`}
      />
      {showDownload && (
        <button
          type="button"
          className="action-btn"
          onClick={handleDownload}
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="spinner dark" />
              Rendering...
            </>
          ) : (
            <>🖼️ Save Card</>
          )}
        </button>
      )}
    </div>
  );
}
