---
name: react-vite-development
description: Build and modify the React/Vite research application. Use for pages, components, forms, state, exports, accessibility and UI defects.
---

# React/Vite development
1. Read AGENTS.md, src/App.jsx, src/components/UI.jsx and src/lib/model.js.
2. Identify the user workflow and data invariants before editing. Keep page-level behavior in React; extract a component when it has independent state or repeated logic.
3. Keep form changes separate from saved workspace state. Save only after validation. Preserve data on failure; show errors in Thai.
4. Use stable record IDs and project links. Deleting a project must preserve its evidence and readings by unassigning them.
5. Render user content as React text. Avoid dangerouslySetInnerHTML. Restrict clickable source URLs to HTTP(S); use safe links in a new tab.
6. Update schema migrations when changing persisted fields. Test old/new import and rejected malformed files.
7. Run npm run check. Verify create/edit/delete, reload persistence, search, export and narrow-screen navigation when a browser is available.
Read docs/ARCHITECTURE.md before adding routing, global state libraries or an API integration.
