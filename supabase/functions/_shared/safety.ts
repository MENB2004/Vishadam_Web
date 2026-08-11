// BURN — Server-side safety filter
// Mirror of src/engine/safetyFilter.ts so the LLM is never asked to roast
// crisis content, even if a client bypasses its own check.

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

const FALLBACK_EN = `Hey, we hear you. This isn't something we'll joke about. You're not alone, and it's okay to ask for help.

📞 Helplines:
• iCall: 9152987821
• Vandrevala Foundation: 1860-2662-345
• KIRAN (Govt. of India): 1800-599-0019 (toll-free, 24/7)`;

const FALLBACK_ML = `ഹേയ്, ഞങ്ങൾ കേൾക്കുന്നു. ഇതിനെക്കുറിച്ച് ഞങ്ങൾ തമാശ പറയില്ല. നിങ്ങൾ ഒറ്റയ്ക്കല്ല, സഹായം ചോദിക്കുന്നത് ശരിയാണ്.

📞 ഹെൽപ്പ്‌ലൈനുകൾ:
• iCall: 9152987821
• വന്ദ്രേവാല ഫൗണ്ടേഷൻ: 1860-2662-345
• KIRAN (ഗവ. ഓഫ് ഇന്ത്യ): 1800-599-0019 (ടോൾ-ഫ്രീ, 24/7)`;

export interface ServerSafetyResult {
  isCrisis: boolean;
  fallbackMessage?: string;
}

/** Returns the support/helpline message in the text's language. */
export function crisisFallbackFor(text: string): string {
  return text.match(/[\u0D00-\u0D7F]/) ? FALLBACK_ML : FALLBACK_EN;
}

export function checkSafety(text: string): ServerSafetyResult {
  const lower = text.toLowerCase().normalize('NFC');
  const hasEnCrisis = CRISIS_KEYWORDS_EN.some(kw => lower.includes(kw));
  const hasMlCrisis = CRISIS_KEYWORDS_ML.some(kw => lower.includes(kw));

  if (hasEnCrisis || hasMlCrisis) {
    return {
      isCrisis: true,
      fallbackMessage: crisisFallbackFor(text),
    };
  }

  return { isCrisis: false };
}
