import { sql } from "./db";

/**
 * Rate limit simples baseado em banco (funciona em serverless, sem estado local).
 * Os limites (quantidade e janela em segundos) são configuráveis no painel admin
 * e ficam salvos em site_config.rate_limit_max / rate_limit_window_seconds.
 */
export async function checkRateLimit(
  ip: string,
  max: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  await sql`
    DELETE FROM rate_limit_log
    WHERE created_at < now() - (${windowSeconds} || ' seconds')::interval;
  `;

  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM rate_limit_log
    WHERE ip = ${ip}
      AND created_at > now() - (${windowSeconds} || ' seconds')::interval;
  `;
  const count = (rows[0]?.count as number) ?? 0;

  if (count >= max) {
    return { allowed: false, remaining: 0 };
  }

  await sql`INSERT INTO rate_limit_log (ip) VALUES (${ip});`;
  return { allowed: true, remaining: Math.max(0, max - count - 1) };
}
