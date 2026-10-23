# Legal Research Studio — Agent working agreement

Read README.md and docs/ARCHITECTURE.md before changes. This is a React/Vite application with Cloudflare Worker + D1; do not replace the React interface with imperative HTML injection.

## Commands
- `npm ci`
- `npm run dev` (frontend only)
- `npm run check` (tests + production build)
- `npm run db:local` then `npm run dev:worker` (local full stack; see README)

## Product rules
- Use Thai UI with short, precise labels. Make every form control accessible by label.
- Keep legal text, legal interpretation, research findings and recommendations distinct.
- Never invent sections, cases, sources, versions, citations or claims of accreditation.
- Show the scope and provenance of frameworks. Reporting guidelines are not quality certificates.
- Make demo data explicit. Do not preload confidential TSRI records.
- Do not claim AI processing exists until a server endpoint, grounded output and tests exist.

## Engineering rules
- Shared data validation lives in src/lib/model.js; apply it in browser AND Worker.
- Authenticate API requests by cryptographically verified Access JWT subject; never trust an email or user ID supplied by the browser.
- Preserve the owner_id predicate on every database access. Test unauthorized and cross-owner cases.
- Never place credentials in VITE_* variables, frontend code, logs or prompts.
- Use prepared D1 statements and optimistic revisions. Treat 409 as a conflict, never silently overwrite.
- Import must validate before replacing data. Keep exports compatible or supply a versioned migration.
- Respect the 800 KB workspace-document limit. Use relational tables/R2 before adding large files.
- Keep private records out of localStorage on shared machines. Cloud Sync is explicit and per-user; no cross-user collaboration yet.
- Do not deploy to a real account or apply remote migrations unless the user's current task authorizes that action.
- Finish changes with `npm run check`; report exactly what ran and remaining limitations.

## Project skills
Use the relevant skill under `.agents/skills/`:
- react-vite-development
- cloudflare-deploy
- legal-evidence-review
- research-method-design
- quality-and-security

Do not reset the known remote revision on a local-only import: retain the displayed remote identity, then let an explicit PUT enforce CAS.

Read docs/ROADMAP.md for staged development. Skills support agent work inside the IDE; they do not provide a runtime AI model to the app.
