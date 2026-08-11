import { describe, it, expect } from 'vitest';
import { detectLanguage } from '../detectLanguage';

describe('detectLanguage', () => {
  it('detects English text', () => {
    expect(detectLanguage('I failed my chemistry exam today')).toBe('en');
    expect(detectLanguage('work is so stressful')).toBe('en');
  });

  it('detects Malayalam text', () => {
    expect(detectLanguage('എനിക്ക് ജോലിയിൽ വളരെയധികം സ്ട്രെസ്സ് ഉണ്ട്')).toBe('ml');
    expect(detectLanguage('പരീക്ഷ തോറ്റു പോയി')).toBe('ml');
  });

  it('detects mixed English and Malayalam text', () => {
    expect(detectLanguage('exam തോറ്റു പോയി')).toBe('mixed');
    expect(detectLanguage('എന്റെ breakup ആയി')).toBe('mixed');
  });

  it('defaults to English for empty or whitespace input', () => {
    expect(detectLanguage('')).toBe('en');
    expect(detectLanguage('   ')).toBe('en');
  });

  it('handles emoji-only input gracefully', () => {
    expect(detectLanguage('😭💔☠️')).toBe('en');
  });
});
