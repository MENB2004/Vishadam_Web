# BURN — Tone Guardrails & Safety Policy

## Core Principle
Satirical and funny — **never genuinely harmful**. We mock the *situation*, not the *person's worth*.

---

## Never-Mock Topics
- Suicide / suicidal ideation
- Self-harm / cutting
- Physical abuse / domestic violence
- Sexual abuse / assault
- Child abuse
- Eating disorders
- Severe mental health crises
- Death of a loved one (recent grief)

---

## Crisis Keywords

### English
```
suicide, kill myself, end my life, want to die, self-harm, cutting, 
hurt myself, abuse, assault, rape, molest, domestic violence, 
beaten, hitting me, no reason to live, give up on life, overdose,
jump off, hang myself, slit, worthless to everyone
```

### Malayalam
```
ആത്മഹത്യ, മരിക്കാൻ, ജീവിതം അവസാനിപ്പിക്കാൻ, സ്വയം ഉപദ്രവിക്കുക, 
പീഡനം, ലൈംഗിക പീഡനം, ബലാത്സംഗം, അടിക്കുന്നു, 
ജീവിക്കാൻ കാരണമില്ല, മരണം, ഉപദ്രവം
```

---

## Kind Fallback Response

### English
> "Hey, we hear you. This isn't something we'll joke about. You're not alone, and it's okay to ask for help."
>
> **Helplines:**
> - **iCall:** 9152987821
> - **Vandrevala Foundation:** 1860-2662-345
> - **KIRAN (Govt. of India):** 1800-599-0019 (toll-free, 24/7)

### Malayalam
> "ഹേയ്, ഞങ്ങൾ കേൾക്കുന്നു. ഇതിനെക്കുറിച്ച് ഞങ്ങൾ തമാശ പറയില്ല. നിങ്ങൾ ഒറ്റയ്ക്കല്ല, സഹായം ചോദിക്കുന്നത് ശരിയാണ്."

---

## Guardrail Implementation
1. **Pre-check:** Before any NLP processing, scan input against crisis keyword list.
2. **Immediate return:** If any crisis keyword is detected, skip the demotivation engine entirely.
3. **No storage:** Crisis-flagged inputs are NOT stored in the database.
4. **No logging:** Do not log the content of crisis-flagged inputs.
