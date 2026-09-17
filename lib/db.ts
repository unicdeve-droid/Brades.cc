import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  // Em build time isso pode não estar setado ainda; só falha em runtime real.
  console.warn("DATABASE_URL não definida. Configure no .env / Vercel.");
}

export const sql = neon(process.env.DATABASE_URL || "");

// Em serverless, várias requisições podem chegar ao mesmo tempo e tentar
// criar as tabelas simultaneamente. "CREATE TABLE IF NOT EXISTS" não é
// perfeitamente atômico contra isso no Postgres, então em corrida ele pode
// devolver um erro de chave duplicada no catálogo (23505). Isso é inofensivo:
// significa que a tabela já existe (foi criada pela outra requisição
// concorrente), então só ignoramos esse erro específico.
async function safeExec(run: () => Promise<unknown>) {
  try {
    await run();
  } catch (err: any) {
    if (err?.code === "23505") return;
    throw err;
  }
}

export type SiteConfig = {
  id: number;
  logo_url: string | null;
  title: string;
  field1_label: string;
  field1_format: string;
  field2_label: string;
  field2_format: string;
  field3_label: string;
  field3_format: string;
  paragraphs: string[];
  footer_text: string;
  success_title: string;
  success_message: string;
  rate_limit_max: number;
  rate_limit_window_seconds: number;
};

const DEFAULT_CONFIG: Omit<SiteConfig, "id"> = {
  logo_url: null,
  title: "Título editável pelo admin",
  field1_label: "Título do campo",
  field1_format: "xxxx xxxxxxxx xxxxxx",
  field2_label: "Título",
  field2_format: "xxxxx",
  field3_label: "Título",
  field3_format: "xxxxx",
  paragraphs: [
    "Texto editável sem limite de caracteres.",
    "Texto editável sem limite.",
  ],
  footer_text: "Rodapé editável com dados empresariais tipo CNPJ, nome de empresa e etc.",
  success_title: "Aprovado",
  success_message: "Recebemos suas informações com sucesso.",
  rate_limit_max: 5,
  rate_limit_window_seconds: 60,
};

export async function ensureSchema() {
  await safeExec(
    () => sql`
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
  `
  );
  await safeExec(
    () => sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      field1_value TEXT,
      field2_value TEXT,
      field3_value TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `
  );
  await safeExec(
    () => sql`
    CREATE TABLE IF NOT EXISTS rate_limit_log (
      id SERIAL PRIMARY KEY,
      ip TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `
  );
}

export async function getConfig(): Promise<SiteConfig> {
  await ensureSchema();
  // INSERT ... ON CONFLICT ... RETURNING é uma operação atômica única:
  // ou cria a linha padrão (primeira vez) ou não faz nada e mesmo assim
  // devolve a linha já existente — sem o risco de duas requisições
  // concorrentes "pisarem no pé" uma da outra num fluxo de vários passos.
  const rows = await sql`
    INSERT INTO site_config (
      id, logo_url, title,
      field1_label, field1_format,
      field2_label, field2_format,
      field3_label, field3_format,
      paragraphs, footer_text,
      success_title, success_message,
      rate_limit_max, rate_limit_window_seconds
    ) VALUES (
      1, ${DEFAULT_CONFIG.logo_url}, ${DEFAULT_CONFIG.title},
      ${DEFAULT_CONFIG.field1_label}, ${DEFAULT_CONFIG.field1_format},
      ${DEFAULT_CONFIG.field2_label}, ${DEFAULT_CONFIG.field2_format},
      ${DEFAULT_CONFIG.field3_label}, ${DEFAULT_CONFIG.field3_format},
      ${JSON.stringify(DEFAULT_CONFIG.paragraphs)}, ${DEFAULT_CONFIG.footer_text},
      ${DEFAULT_CONFIG.success_title}, ${DEFAULT_CONFIG.success_message},
      ${DEFAULT_CONFIG.rate_limit_max}, ${DEFAULT_CONFIG.rate_limit_window_seconds}
    )
    ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id
    RETURNING *;
  `;

  if (!rows[0]) {
    throw new Error(
      "Não foi possível obter a configuração do site (linha vazia inesperada)."
    );
  }

  return rows[0] as unknown as SiteConfig;
}

export async function updateConfig(patch: Partial<Omit<SiteConfig, "id">>) {
  const current = await getConfig();
  const merged = { ...current, ...patch };
  await sql`
    UPDATE site_config SET
      logo_url = ${merged.logo_url},
      title = ${merged.title},
      field1_label = ${merged.field1_label},
      field1_format = ${merged.field1_format},
      field2_label = ${merged.field2_label},
      field2_format = ${merged.field2_format},
      field3_label = ${merged.field3_label},
      field3_format = ${merged.field3_format},
      paragraphs = ${JSON.stringify(merged.paragraphs)},
      footer_text = ${merged.footer_text},
      success_title = ${merged.success_title},
      success_message = ${merged.success_message},
      rate_limit_max = ${merged.rate_limit_max},
      rate_limit_window_seconds = ${merged.rate_limit_window_seconds},
      updated_at = now()
    WHERE id = 1;
  `;
  return merged;
}
