import { useState, useEffect, useMemo } from 'react';
import type { Bucket } from '../engine';
import { supabase } from '../lib/supabaseClient';
import Reveal from '../components/Reveal';

interface FeedEntry {
  id: string;
  bucket: Bucket;
  lang: string;
  response_line: string;
  created_at: string;
}

const BUCKET_LABELS: Record<string, string> = {
  'failed-exam': '📝 Exam',
  'breakup': '💔 Breakup',
  'job-hunt': '🔍 Job Hunt',
  'work-stress': '💼 Work',
  'nothing-works': '🌀 Nothing Works',
  'loneliness': '🫥 Loneliness',
  'family-pressure': '👨‍👩‍👧 Family',
  'health-fitness': '💪 Health & Fitness',
  'money': '💸 Money',
  'social-media': '📱 Social Media',
  'general': '☠️ General',
};

const BUCKET_ORDER: Bucket[] = [
  'failed-exam',
  'breakup',
  'job-hunt',
  'work-stress',
  'nothing-works',
  'loneliness',
  'family-pressure',
  'health-fitness',
  'money',
  'social-media',
  'general',
];

const MOCK_FEED: FeedEntry[] = [
  {
    id: '1',
    bucket: 'failed-exam',
    lang: 'en',
    response_line: 'The syllabus wasn\'t the problem. The problem was who was reading it.',
    created_at: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: '2',
    bucket: 'breakup',
    lang: 'ml',
    response_line: 'അവർ മുന്നോട്ട് പോയി. നിങ്ങളും പോകണം. പക്ഷെ നമുക്കെല്ലാം അറിയാം നിങ്ങൾ പോകില്ല.',
    created_at: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: '3',
    bucket: 'work-stress',
    lang: 'en',
    response_line: 'Work-life balance? You have neither.',
    created_at: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: '4',
    bucket: 'nothing-works',
    lang: 'en',
    response_line: 'If Plan A didn\'t work, don\'t worry — the alphabet has 25 more letters. You\'ll fail those too.',
    created_at: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: '5',
    bucket: 'failed-exam',
    lang: 'ml',
    response_line: 'ടോപ്പേഴ്‌സ് സ്‌മാർട്ട് ആയി പഠിക്കുന്നു. നിങ്ങൾ പ്രതീക്ഷയോടെ പഠിക്കുന്നു.',
    created_at: new Date(Date.now() - 1200000).toISOString(),
  },
];

const MORE_LINES: Array<Omit<FeedEntry, 'id' | 'created_at'>> = [
  { bucket: 'money', lang: 'en', response_line: 'Your savings are as short-lived as your resolutions.' },
  { bucket: 'breakup', lang: 'en', response_line: 'They said "it\'s not you, it\'s me." It was definitely you.' },
  { bucket: 'work-stress', lang: 'en', response_line: 'Your boss doesn\'t check your work. They check your pulse.' },
  { bucket: 'family-pressure', lang: 'ml', response_line: 'അമ്മയ്ക്ക് അറിയില്ല, പക്ഷെ നിങ്ങളെ കാണുമ്പോൾ ദേഷ്യം വരുന്നു എന്ന്.' },
  { bucket: 'loneliness', lang: 'en', response_line: 'Your phone is your only friend — and even it ignores you on silent.' },
  { bucket: 'nothing-works', lang: 'ml', response_line: 'ശ്രമിച്ചാൽ ഫലം കാണും എന്ന് പറഞ്ഞവർ നിങ്ങളെ കണ്ടിട്ടില്ല.' },
  { bucket: 'failed-exam', lang: 'en', response_line: 'You studied until the exam. Not the syllabus — the exam date.' },
  { bucket: 'money', lang: 'ml', response_line: 'ബാലൻസ് പരിശോധിക്കുമ്പോൾ ആണ് ജീവിതം തന്നെ മാറുന്നത്.' },
  { bucket: 'work-stress', lang: 'en', response_line: 'Friday is the light at the end of the tunnel. It\'s Monday again.' },
  { bucket: 'breakup', lang: 'ml', response_line: 'പ്രണയം എന്നു പറയുന്നത് ഒരു രോഗം. നിങ്ങൾക്ക് രണ്ടും കിട്ടി.' },
  { bucket: 'family-pressure', lang: 'en', response_line: 'The wedding photos will be great. Too bad you\'ll be in them.' },
  { bucket: 'loneliness', lang: 'en', response_line: 'You\'re not alone. You have your doubts, your regrets, and your WiFi.' },
  { bucket: 'nothing-works', lang: 'en', response_line: 'Some people are late bloomers. You\'re a late never-bloomer.' },
  { bucket: 'money', lang: 'en', response_line: 'Your bank balance is proof that money can\'t buy happiness — you have neither.' },
];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function moodFor(id: string): number {
  return 2 + (hashId(id) % 18);
}

export default function Feed() {
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [filter, setFilter] = useState<Bucket | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [usedIndex, setUsedIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [, setTick] = useState(0);

  // Update time-ago labels every 30s
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial feed from Supabase
  useEffect(() => {
    async function fetchFeed() {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('id, bucket, lang, response_line, created_at')
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) throw error;
        if (data && data.length > 0) {
          setFeed(data as FeedEntry[]);
        } else {
          // If database is empty, use mock data
          setFeed(MOCK_FEED);
        }
      } catch (err) {
        console.error('Failed to load feed from Supabase. Falling back to mock data.', err);
        setFeed(MOCK_FEED);
      } finally {
        setLoading(false);
      }
    }

    fetchFeed();

    // Subscribe to Realtime inserts
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions' },
        (payload) => {
          const newRow = payload.new as FeedEntry;
          setFeed((prev) => [newRow, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      const next = MORE_LINES.slice(usedIndex, usedIndex + 4).map((line, i) => ({
        ...line,
        id: `m${usedIndex + i}`,
        created_at: new Date(Date.now() - (i + 1) * 60000).toISOString(),
      }));
      setFeed(prev => [...prev, ...next]);
      setUsedIndex(u => u + 4);
      setLoadingMore(false);
    }, 600);
  };

  const visibleFeed = useMemo(() => {
    if (filter === 'all') return feed;
    return feed.filter(e => e.bucket === filter);
  }, [feed, filter]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: feed.length };
    for (const b of BUCKET_ORDER) {
      map[b] = feed.filter(e => e.bucket === b).length;
    }
    return map;
  }, [feed]);

  return (
    <div className="feed">
      <div className="feed-header">
        <h1 className="feed-title">
          <span className="text-gradient">Latest Victims</span>
        </h1>
        <p className="feed-subtitle">Real-time feed of recent demotivations</p>
      </div>

      <div className="feed-filters" role="group" aria-label="Filter by category">
        <button
          type="button"
          className={`feed-filter ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All <span className="feed-filter-count">{counts.all}</span>
        </button>
        {BUCKET_ORDER.map(b => (
          <button
            key={b}
            type="button"
            className={`feed-filter ${filter === b ? 'active' : ''}`}
            onClick={() => setFilter(b)}
          >
            {BUCKET_LABELS[b] || b} <span className="feed-filter-count">{counts[b]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="feed-empty">
          <p className="feed-loading-text">Connecting to the misery stream...</p>
          <div className="feed-skeleton">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="skeleton-item">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text short" />
              </div>
            ))}
          </div>
        </div>
      ) : visibleFeed.length === 0 ? (
        <div className="feed-empty">
          <div className="feed-empty-icon">👻</div>
          <p>No victims in this category yet. Be the first!</p>
        </div>
      ) : (
        <>
          <div className="feed-list">
            {visibleFeed.map((entry, index) => (
              <Reveal key={entry.id} delay={Math.min(index * 60, 300)}>
                <div
                  className="feed-item"
                >
                  <div className="feed-item-header">
                    <span className="feed-item-bucket">
                      {BUCKET_LABELS[entry.bucket] || entry.bucket}
                    </span>
                    <span className={`feed-item-lang ${entry.lang}`}>
                      {entry.lang === 'ml' ? 'ML' : 'EN'}
                    </span>
                    <span className="feed-item-time">{timeAgo(entry.created_at)}</span>
                  </div>
                  <div className={`feed-item-line ${entry.lang === 'ml' ? 'ml' : ''}`}>
                    {entry.response_line}
                  </div>
                  <div className="feed-item-mood">
                    <span className="feed-item-mood-label">Mood</span>
                    <div className="feed-item-mood-track" aria-hidden="true">
                      <div
                        className="feed-item-mood-fill"
                        style={{ width: `${moodFor(entry.id)}%` }}
                      />
                    </div>
                    <span className="feed-item-mood-value">{moodFor(entry.id)}%</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {usedIndex < MORE_LINES.length && (
            <div className="feed-load-more">
              <button
                type="button"
                className="action-btn"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <span className="spinner dark" />
                    Digging up more victims...
                  </>
                ) : (
                  <>💀 Load More Misery</>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
