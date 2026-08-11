// VISHADAM — NLP Engine: Safety Filter
// Crisis detection — never mock these topics

import type { Language } from './detectLanguage';

/** Crisis keywords that trigger the safety fallback */
const CRISIS_KEYWORDS_EN = [
  'suicide', 'kill myself', 'end my life', 'ending my life', 'want to die', 'wanna die',
  'self-harm', 'self harm', 'cutting', 'hurt myself', 'harming myself',
  'abuse', 'assault', 'rape', 'molest', 'domestic violence',
  'beaten', 'hitting me', 'no reason to live', 'give up on life',
  'overdose', 'jump off', 'hang myself', 'slit', 'worthless to everyone',
  'end it all', 'better off dead', 'nobody would care', 'kill me', 'ending life',
];

const CRISIS_KEYWORDS_ML = [
  'ആത്മഹത്യ', 'മരിക്കാൻ', 'ജീവിതം അവസാനിപ്പിക്കാൻ',
  'സ്വയം ഉപദ്രവിക്കുക', 'പീഡനം', 'ലൈംഗിക പീഡനം',
  'ബലാത്സംഗം', 'അടിക്കുന്നു', 'ജീവിക്കാൻ കാരണമില്ല',
  'മരണം', 'ഉപദ്രവം',
];

export interface SafetyResult {
  isCrisis: boolean;
  fallbackMessage?: string;
}

const FALLBACK_EN = `Hey, we hear you. This isn't something we'll joke about. You're not alone, and it's okay to ask for help.

📞 Helplines:
• iCall: 9152987821
• Vandrevala Foundation: 1860-2662-345
• KIRAN (Govt. of India): 1800-599-0019 (toll-free, 24/7)`;

const FALLBACK_ML = `ഹേയ്, ഞങ്ങൾ കേൾക്കുന്നു. ഇതിനെക്കുറിച്ച് ഞങ്ങൾ തമാശ പറയില്ല. നിങ്ങൾ ഒറ്റയ്ക്കല്ല, സഹായം ചോദിക്കുന്നത് ശരിയാണ്.

📞 ഹെൽപ്‌ലൈനുകൾ:
• iCall: 9152987821
• വന്ദ്രേവാല ഫൗണ്ടേഷൻ: 1860-2662-345
• KIRAN (ഗവ. ഓഫ് ഇന്ത്യ): 1800-599-0019 (ടോൾ-ഫ്രീ, 24/7)`;

/**
 * Checks input text for crisis keywords.
 * If detected, returns a kind fallback message with helpline info.
 */
export function checkSafety(text: string, lang: Language): SafetyResult {
  const lower = text.toLowerCase().normalize('NFC');

  // Check English crisis keywords
  const hasEnCrisis = CRISIS_KEYWORDS_EN.some(kw => lower.includes(kw));

  // Check Malayalam crisis keywords
  const hasMlCrisis = CRISIS_KEYWORDS_ML.some(kw => lower.includes(kw));

  if (hasEnCrisis || hasMlCrisis) {
    return {
      isCrisis: true,
      fallbackMessage: lang === 'ml' ? FALLBACK_ML : FALLBACK_EN,
    };
  }

  return { isCrisis: false };
}
