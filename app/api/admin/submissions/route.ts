import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, field1_value, field2_value, field3_value, ip, created_at
      FROM submissions
      ORDER BY created_at DESC
      LIMIT 200;
    `;
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Erro ao buscar submissões:", err);
    return NextResponse.json(
      { error: "Não foi possível carregar os envios." },
      { status: 500 }
    );
  }
}
