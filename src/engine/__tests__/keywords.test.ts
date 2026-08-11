import { describe, it, expect } from 'vitest';
import { extractKeywords, mapToBucket } from '../keywords';

describe('keywords module', () => {
  it('extracts English candidate keywords stripping stopwords', () => {
    const kws = extractKeywords('I really failed my chemistry exam today', 'en');
    expect(kws).toContain('chemistry');
    expect(kws).toContain('exam');
    expect(kws).not.toContain('i');
    expect(kws).not.toContain('my');
  });

  it('maps exam-related keywords to failed-exam bucket', () => {
    const kws = ['exam', 'chemistry', 'marks'];
    const res = mapToBucket(kws, 'en');
    expect(res.bucket).toBe('failed-exam');
    expect(res.score).toBeGreaterThan(0);
  });

  it('maps Malayalam exam text to failed-exam bucket', () => {
    const kws = extractKeywords('പരീക്ഷ തോറ്റു പോയി മാർക്ക് ഇല്ല', 'ml');
    const res = mapToBucket(kws, 'ml');
    expect(res.bucket).toBe('failed-exam');
  });

  it('maps breakup text to breakup bucket', () => {
    const kws = extractKeywords('my girlfriend broke up with me', 'en');
    const res = mapToBucket(kws, 'en');
    expect(res.bucket).toBe('breakup');
  });

  it('falls back to general bucket when no keywords match', () => {
    const kws = extractKeywords('xyz abc 123', 'en');
    const res = mapToBucket(kws, 'en');
    expect(res.bucket).toBe('general');
  });
});
