import { describe, it, expect } from 'vitest';
import { checkSafety } from '../safetyFilter';

describe('safetyFilter', () => {
  it('detects English crisis keywords and returns fallback message', () => {
    const result = checkSafety('I want to end my life', 'en');
    expect(result.isCrisis).toBe(true);
    expect(result.fallbackMessage).toContain('You\'re not alone');
    expect(result.fallbackMessage).toContain('Helplines');
  });

  it('detects Malayalam crisis keywords and returns Malayalam fallback message', () => {
    const result = checkSafety('ആത്മഹത്യ ചെയ്യാൻ തോന്നുന്നു', 'ml');
    expect(result.isCrisis).toBe(true);
    expect(result.fallbackMessage).toContain('ഞങ്ങൾ കേൾക്കുന്നു');
    expect(result.fallbackMessage).toContain('ഹെൽപ്‌ലൈനുകൾ');
  });

  it('passes normal bad-mood inputs as safe', () => {
    const resEn = checkSafety('My exam went terrible today', 'en');
    expect(resEn.isCrisis).toBe(false);

    const resMl = checkSafety('പരീക്ഷ തോറ്റു പോയി', 'ml');
    expect(resMl.isCrisis).toBe(false);
  });
});
