-- Este schema é criado automaticamente pelo app (lib/db.ts -> ensureSchema())
-- na primeira requisição. Este arquivo é só para referência/inspeção manual
-- no console do Neon, se você quiser rodar na mão.

CREATE TABLE IF NOT EXISTS site_config (
  id INT PRIMARY KEY DEFAULT 1,
  logo_url TEXT,
  title TEXT NOT NULL,
  field1_label TEXT NOT NULL,
  field1_format TEXT NOT NULL,
  field2_label TEXT NOT NULL,
  field2_format TEXT NOT NULL,
  field3_label TEXT NOT NULL,
  field3_format TEXT NOT NULL,
  paragraphs JSONB NOT NULL DEFAULT '[]',
  footer_text TEXT NOT NULL,
  success_title TEXT NOT NULL,
  success_message TEXT NOT NULL,
  rate_limit_max INT NOT NULL DEFAULT 5,
  rate_limit_window_seconds INT NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  field1_value TEXT,
  field2_value TEXT,
  field3_value TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rate_limit_log (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
