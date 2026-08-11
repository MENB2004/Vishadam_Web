import { describe, it, expect } from 'vitest';
import { demotivate } from '../index';

describe('demotivate engine orchestrator', () => {
  it('generates a demotivation response for English input', () => {
    const res = demotivate('I failed my math exam');
    expect(res.lang).toBe('en');
    expect(res.bucket).toBe('failed-exam');
    expect(res.responseLine).toBeTruthy();
    expect(res.isCrisis).toBe(false);
    expect(res.moodMeter).toBeLessThanOrEqual(15);
  });

  it('generates a demotivation response for Malayalam input', () => {
    const res = demotivate('പരീക്ഷ തോറ്റു പോയി');
    expect(res.lang).toBe('ml');
    expect(res.bucket).toBe('failed-exam');
    expect(res.responseLine).toBeTruthy();
    expect(res.isCrisis).toBe(false);
  });

  it('handles safety crisis input properly', () => {
    const res = demotivate('I feel like ending my life');
    expect(res.isCrisis).toBe(true);
    expect(res.moodMeter).toBe(0);
    expect(res.responseLine).toContain('Helplines');
  });
});
