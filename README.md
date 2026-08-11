# BURN (കത്തൽ)

A satirical "demotivator" app. Come in a mood, leave worse. 0% encouragement guaranteed.

- Type your problem → BURN roasts you. English or Malayalam (mixed text works too).
- 11 buckets (breakup, failed-exam, job-hunt, work-stress, loneliness, family-pressure, money, health-fitness, social-media, nothing-works, general) pick the tone and canned lines.
- Safety filter runs first — crisis input (self-harm, suicide, abuse) never gets roasted; it returns a support message with helplines.
- Optional dynamic roasts: if a server-side LLM is configured, the `roast` edge function generates a personalized line, with automatic fallback to the canned engine.
- Shareable roast cards: a "Victim card" is drawn on a canvas (download as PNG) and every submission gets a shareable `/roast/:id` link with an OG image for WhatsApp/Telegram/Twitter previews.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` to enable submissions and sharing.

## Tests, lint, build

```bash
npm test      # vitest
npm run lint  # oxlint
npm run build # tsc -b && vite build
```

## Optional dynamic roasts (Supabase edge function)

Set `VITE_ROAST_ENDPOINT` in `.env.local` to the deployed function URL (e.g. `https://<project-ref>.supabase.co/functions/v1/roast`) to have the app try the LLM first and fall back to canned lines when it's unavailable.

Deploy the edge functions:

```bash
supabase functions deploy roast --no-verify-jwt
supabase functions deploy og-image --no-verify-jwt
supabase functions deploy roast-page --no-verify-jwt
```

Set the LLM secret (required for `roast` to use the model) plus optional overrides:

```bash
supabase secrets set ROAST_LLM_API_KEY=<key>
supabase secrets set ROAST_LLM_BASE_URL=https://api.openai.com/v1
supabase secrets set ROAST_LLM_MODEL=gpt-4o-mini
supabase secrets set SITE_URL=https://<your-site-url>
```

`SITE_URL` is used by `roast-page` for the "Make your own roast" link; `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the Edge runtime.

## Voice-over

The read-aloud uses Google's free voice stream directly from the browser for both Malayalam and English — no API key and no server required.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | for submissions/sharing | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | for submissions/sharing | Supabase anon key |
| `VITE_ROAST_ENDPOINT` | no | URL of the deployed `roast` function |
| `VITE_SITE_URL` | no | Public site URL used in OG meta tags |
| `ROAST_LLM_API_KEY` | for dynamic roasts | Server secret, set via `supabase secrets set` |

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
