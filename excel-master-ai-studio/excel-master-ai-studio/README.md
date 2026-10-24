# Excel Master AI Learning & Analytics Studio

React 19 + TypeScript + Vite + Cloudflare Pages Functions. Mobile-first MVP with Learn / Analyze / Create.

## Run locally
```bash
npm install
npm run dev
npm run typecheck
npm run build
```
For local Pages Functions (AI), use `npx wrangler pages dev dist` after building; provide server-side secrets via Cloudflare or a local `.dev.vars` file (never commit secrets).

## Cloudflare Pages
- Import repository from GitHub.
- Framework: Vite; build command `npm run build`; output directory `dist`.
- Add `AI_API_KEY` as an encrypted secret and `AI_BASE_URL`, `AI_MODEL` as server-side variables.
- The `/api/ai` endpoint is handled by Pages Functions. API key must never be exposed in frontend VITE_ variables.
- Provision an R2 bucket and bind it as `STUDIO_BUCKET` under Pages Functions > R2 bindings. Storage upload endpoint is intentionally disabled until authentication and authorization are implemented.
- Run `supabase/schema.sql` in your Supabase project to prepare authenticated tables with RLS. Database persistence and login UI are not wired into the MVP yet.

## Current features
- Learn: four lessons, practice, local exact-match feedback (not AI grading).
- Analyze: XLSX/CSV upload, local preview, numeric summary, missing values, bar chart, optional AI endpoint (sends summary + first 12 rows).
- Create: export XLSX data and summary, DOCX report, PPTX executive summary. Outputs are basic templates, not a full research matrix/dashboard engine.

## Security & next steps
- Add Supabase Auth and JWT verification to Pages Functions before enabling R2 uploads or saved projects.
- Add request limits, rate limiting, file-size limits, CSV formula-injection prevention, sensitive-data redaction, retention rules, and audit logs before production.
- For large datasets, move parsing to streaming/backend jobs; current demo limits the imported dataset to 10,000 rows.
- Improve AI grading, formula sandbox, chart selection, research matrices, and multi-slide templates.
- For public deployment, replace the direct browser-side XLSX parser if dependency security review identifies unacceptable risk.
