// VISHADAM — Wall of Despair (Leaderboard)

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Bucket } from '../engine';

interface TopDemotivation {
  id: string;
  response_line: string;
  bucket: Bucket;
  lang: string;
  created_at: string;
  vote_count?: number;
}

const BUCKET_LABELS: Record<string, string> = {
  'failed-exam': '📝 Exam',
  'breakup': '💔 Breakup',
  'work-stress': '💼 Work',
  'nothing-works': '🌀 Nothing Works',
  'loneliness': '🫥 Loneliness',
  'family-pressure': '👨‍👩‍👧 Family',
  'money': '💸 Money',
  'general': '☠️ General',
};

const MOCK_LEADERBOARD: TopDemotivation[] = [
  {
    id: '1',
    bucket: 'breakup',
    lang: 'ml',
    response_line: 'അവൻ/അവൾ നിങ്ങളെ വിട്ടു പോയതിൽ സങ്കടപ്പെടേണ്ട. നിങ്ങളുടെ കൂടെ ജീവിക്കാൻ ഇതിലും വലിയ ക്ഷമ വേണം എന്ന് അവർ തിരിച്ചറിഞ്ഞു കാണും.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    vote_count: 42,
  },
  {
    id: '2',
    bucket: 'work-stress',
    lang: 'en',
    response_line: 'Your parents tell their friends you work in "corporate" because they are too embarrassed to explain what you actually do.',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    vote_count: 38,
  },
  {
    id: '3',
    bucket: 'failed-exam',
    lang: 'ml',
    response_line: 'പരീക്ഷയ്ക്ക് തോറ്റത് നന്നായി, നാട്ടുകാർക്ക് നിങ്ങളുടെ വീട്ടുകാരെ നോക്കി സഹതപിക്കാൻ ഒരു വകയായി.',
    created_at: new Date(Date.now() - 14400000).toISOString(),
    vote_count: 29,
  },
  {
    id: '4',
    bucket: 'nothing-works',
    lang: 'en',
    response_line: 'If Plan A didn\'t work, don\'t worry — the alphabet has 25 more letters. You\'ll fail those too.',
    created_at: new Date(Date.now() - 28800000).toISOString(),
    vote_count: 24,
  },
];

export default function Leaderboard() {
  const [topItems, setTopItems] = useState<TopDemotivation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTop() {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('id, bucket, lang, response_line, created_at')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        if (data && data.length > 0) {
          setTopItems(data as TopDemotivation[]);
        } else {
          setTopItems(MOCK_LEADERBOARD);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setTopItems(MOCK_LEADERBOARD);
      } finally {
        setLoading(false);
      }
    }

    fetchTop();
  }, []);

  return (
    <div className="feed">
      <div className="feed-header">
        <h1 className="feed-title">
          🏆 <span className="text-gradient">Wall of Despair</span>
        </h1>
        <p className="feed-subtitle">The most brutal & iconic demotivation lines</p>
      </div>

      {loading ? (
        <div className="feed-empty">
          <span
            className="spinner"
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(255, 255, 255, 0.1)',
              borderTopColor: 'var(--color-accent)',
              margin: '0 auto 16px',
              display: 'block',
            }}
          />
          <p>Ranking the misery...</p>
        </div>
      ) : (
        <div className="feed-list">
          {topItems.map((item, index) => (
            <div
              key={item.id}
              className="feed-item"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="feed-item-header">
                <span className="feed-item-bucket" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#d4af37' }}>
                  #{index + 1} Rank
                </span>
                <span className="feed-item-bucket">
                  {BUCKET_LABELS[item.bucket] || item.bucket}
                </span>
                <span className={`feed-item-lang ${item.lang}`}>
                  {item.lang === 'ml' ? 'ML' : 'EN'}
                </span>
              </div>
              <div className={`feed-item-line ${item.lang === 'ml' ? 'ml' : ''}`}>
                "{item.response_line}"
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
