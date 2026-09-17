import { NextRequest, NextResponse } from "next/server";
import { getConfig, updateConfig } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json(config, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (err) {
    console.error("Erro ao buscar config admin:", err);
    return NextResponse.json(
      { error: "Não foi possível carregar a configuração." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const patch = await req.json();

  // Sanitização básica
  if (patch.rate_limit_max !== undefined) {
    patch.rate_limit_max = Math.max(1, Number(patch.rate_limit_max) || 1);
  }
  if (patch.rate_limit_window_seconds !== undefined) {
    patch.rate_limit_window_seconds = Math.max(
      1,
      Number(patch.rate_limit_window_seconds) || 1
    );
  }
  if (patch.paragraphs !== undefined && !Array.isArray(patch.paragraphs)) {
    patch.paragraphs = [];
  }

  const updated = await updateConfig(patch);
  return NextResponse.json(updated);
}
