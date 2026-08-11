// BURN — Shared bucket list + labels (server-side)
// Mirrors src/engine/keywords.ts bucket set so OG cards and the LLM
// prompt stay in sync with the client engine.

export const BUCKETS = [
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
] as const;

export type Bucket = (typeof BUCKETS)[number];

export const BUCKET_LABELS: Record<Bucket, string> = {
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

export function isBucket(value: string): value is Bucket {
  return (BUCKETS as readonly string[]).includes(value);
}
