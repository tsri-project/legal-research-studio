CREATE TABLE IF NOT EXISTS workspaces (
  owner_id TEXT PRIMARY KEY NOT NULL,
  body TEXT NOT NULL CHECK (json_valid(body)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at TEXT NOT NULL
);
-- Workspace documents are isolated by validated Access subject (never a client-supplied user ID).
-- Starter design: 800 KB document limit, no real-time collaboration or document history.
