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

  it('maps job-hunt input to a job-hunt roast', () => {
    const res = demotivate('I failed my job interview again');
    expect(res.bucket).toBe('job-hunt');
    expect(res.responseLine).toBeTruthy();
  });

  it('maps health-fitness input to a health-fitness roast', () => {
    const res = demotivate('I need to lose weight and hit the gym');
    expect(res.bucket).toBe('health-fitness');
    expect(res.responseLine).toBeTruthy();
  });

  it('maps social-media input to a social-media roast', () => {
    const res = demotivate('my instagram followers are dropping');
    expect(res.bucket).toBe('social-media');
    expect(res.responseLine).toBeTruthy();
  });
});
