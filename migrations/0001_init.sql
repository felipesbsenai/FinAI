-- FinAI · Schema inicial para Cloudflare D1 (SQLite)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  name TEXT,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount_cents INTEGER NOT NULL,
  date TEXT NOT NULL, -- Formato YYYY-MM-DD
  merchant TEXT,
  category TEXT NOT NULL,
  note TEXT,
  source TEXT CHECK(source IN ('image', 'text', 'manual')),
  confidence REAL,
  image_key TEXT,
  image_hash TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budgets (
  user_id TEXT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL, -- Pode assumir '_TOTAL' para teto global mensal
  limit_cents INTEGER NOT NULL,
  PRIMARY KEY (user_id, category)
);

CREATE TABLE IF NOT EXISTS merchant_rules (
  user_id TEXT NOT NULL REFERENCES users(id),
  merchant_norm TEXT NOT NULL,
  category TEXT NOT NULL,
  PRIMARY KEY (user_id, merchant_norm)
);

CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_usage (
  user_id TEXT NOT NULL REFERENCES users(id),
  day TEXT NOT NULL, -- Formato YYYY-MM-DD
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_image_hash ON expenses(user_id, image_hash);
