"use strict"
/**
 * migrate.ts - creates tables if they don't exist.
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
})

import db from "./db"

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sites (
  id          TEXT PRIMARY KEY,          -- UUID
  name        TEXT NOT NULL,             -- human label, e.g. "My Shop"
  domain      TEXT NOT NULL,             -- allowed origin, e.g. "https://myshop.com"
  api_key     TEXT NOT NULL UNIQUE,      -- what the site sends in X-Api-Key header
  smtp_host   TEXT,                      -- where to forward emails for this site
  smtp_port   INTEGER,                   -- what port to use when forwarding emails for this site
  smtp_user   TEXT,                      -- what username to use when forwarding emails for this site
  smtp_pass   TEXT,                      -- what password to use when forwarding emails for this site
  smtp_secure BOOLEAN,                   -- whether to use TLS when forwarding emails for this site
  smtp_name   TEXT,                      -- what name to use in the "From" field when forwarding emails for this site
  smtp_from   TEXT,                      -- what email address to use in the "From" field
  email_to    TEXT,                      -- where to forward emails for this site
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  note        TEXT
);

CREATE TABLE IF NOT EXISTS email_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id       TEXT NOT NULL,
  from_email    TEXT NOT NULL,
  to_email      TEXT NOT NULL,
  subject       TEXT,
  body_text     TEXT,
  body_html     TEXT,
  error         TEXT,
  ip            TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

CREATE TABLE IF NOT EXISTS email_tokens (
  id            TEXT PRIMARY KEY,
  site_id       TEXT NOT NULL,
  token_hash    TEXT NOT NULL UNIQUE,
  origin        TEXT NOT NULL,
  ip            TEXT,
  expires_at    TEXT NOT NULL,
  revoked_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

CREATE INDEX IF NOT EXISTS idx_email_tokens_site_id
  ON email_tokens(site_id);

CREATE INDEX IF NOT EXISTS idx_email_tokens_expires_at
  ON email_tokens(expires_at);

CREATE TABLE IF NOT EXISTS email_dedup (
  site_id       TEXT NOT NULL,
  email_id      TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (site_id, email_id),
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

CREATE INDEX IF NOT EXISTS idx_email_dedup_created_at
  ON email_dedup(created_at);

CREATE TABLE IF NOT EXISTS admin_tokens (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL,
  token_hash    TEXT NOT NULL UNIQUE,
  token_type    TEXT NOT NULL,
  expires_at    TEXT NOT NULL,
  revoked_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_tokens_session_id
  ON admin_tokens(session_id);

CREATE INDEX IF NOT EXISTS idx_admin_tokens_expires_at
  ON admin_tokens(expires_at);
`

const SCHEMA_PG = `
CREATE TABLE IF NOT EXISTS sites (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  domain      TEXT NOT NULL,
  api_key     TEXT NOT NULL UNIQUE,
  smtp_host   TEXT,
  smtp_port   INTEGER,
  smtp_user   TEXT,
  smtp_pass   TEXT,
  smtp_secure BOOLEAN,
  smtp_name   TEXT,
  smtp_from   TEXT,
  email_to    TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note        TEXT
);

CREATE TABLE IF NOT EXISTS email_log (
  id            SERIAL PRIMARY KEY,
  site_id       TEXT NOT NULL REFERENCES sites(id),
  from_email    TEXT NOT NULL,
  to_email      TEXT NOT NULL,
  subject       TEXT,
  body_text     TEXT,
  body_html     TEXT,
  error         TEXT,
  ip            TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_tokens (
  id            TEXT PRIMARY KEY,
  site_id       TEXT NOT NULL REFERENCES sites(id),
  token_hash    TEXT NOT NULL UNIQUE,
  origin        TEXT NOT NULL,
  ip            TEXT,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_tokens_site_id
  ON email_tokens(site_id);

CREATE INDEX IF NOT EXISTS idx_email_tokens_expires_at
  ON email_tokens(expires_at);

CREATE TABLE IF NOT EXISTS email_dedup (
  site_id       TEXT NOT NULL REFERENCES sites(id),
  email_id      TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (site_id, email_id)
);

CREATE INDEX IF NOT EXISTS idx_email_dedup_created_at
  ON email_dedup(created_at);

CREATE TABLE IF NOT EXISTS admin_tokens (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL,
  token_hash    TEXT NOT NULL UNIQUE,
  token_type    TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_tokens_session_id
  ON admin_tokens(session_id);

CREATE INDEX IF NOT EXISTS idx_admin_tokens_expires_at
  ON admin_tokens(expires_at);
`

async function migrate(): Promise<void> {
  const schema = db.driver === "postgres" ? SCHEMA_PG : SCHEMA
  await db.exec(schema)
  await ensureSmtpFromColumn()
  console.log(`✅  Migration complete (driver: ${db.driver})`)
  process.exit(0)
}

async function ensureSmtpFromColumn(): Promise<void> {
  if (db.driver === "postgres") {
    await db.run("ALTER TABLE sites ADD COLUMN IF NOT EXISTS smtp_from TEXT")
    return
  }

  const columns = await db.all<{ name: string }>("PRAGMA table_info(sites)")
  const hasColumn = columns.some((column) => column.name === "smtp_from")
  if (!hasColumn) {
    await db.run("ALTER TABLE sites ADD COLUMN smtp_from TEXT")
  }
}

migrate().catch((err: unknown) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
