---
name: cloudflare-deploy
description: Configure and deploy this Vite frontend and Worker API to Cloudflare Workers with D1 and Access. Use for Wrangler, migrations, authentication and release tasks.
---

# Cloudflare deployment
1. Read docs/DEPLOY-CLOUDFLARE.md and wrangler.jsonc. Confirm target account, Worker name, D1 ID and domain from actual configuration; do not invent identifiers.
2. Build with npm run check. Use Workers Static Assets for this full-stack package. Treat Cloudflare Pages as frontend-only unless a separate backend is deliberately configured.
3. Create/bind the D1 database and apply migrations to local first. Remote migrations require authorization from the task. Never recreate a populated database to fix a schema error.
4. Configure Access on the hostname and verify JWT signature, issuer, audience, algorithm and expiry in the Worker. Keep LOCAL_DEV_USER only in ignored .dev.vars.
5. Run a dry-run build before release. Never expose credentials in code or VITE_* variables. Use wrangler login or the CI secret store.
6. After authorized deploy, verify unauthenticated API denial, isolated data for two identities, successful sync, and stale revision rejection. Verify a real JWT; unit-test authentication stubs are not end-to-end proof.
7. Report deployment URL and migrations actually applied. Preserve the previous release and back up D1 before schema changes.
Read docs/SOURCES.md and current official docs when syntax or platform behavior is uncertain.
