import { NextResponse } from "next/server";
import { getConfig } from "@/lib/db";

// Sempre buscar do banco na hora da requisição (nunca cachear/pré-renderizar
// em build), já que o admin pode alterar a config a qualquer momento.
export const dynamic = "force-dynamic";

// Config pública: só o necessário para renderizar o checkout e a tela de aprovado.
export async function GET() {
  try {
    const c = await getConfig();
    return NextResponse.json(
      {
        logo_url: c.logo_url,
        title: c.title,
        field1_label: c.field1_label,
        field1_format: c.field1_format,
        field2_label: c.field2_label,
        field2_format: c.field2_format,
        field3_label: c.field3_label,
        field3_format: c.field3_format,
        paragraphs: c.paragraphs,
        footer_text: c.footer_text,
        success_title: c.success_title,
        success_message: c.success_message,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error("Erro ao buscar config pública:", err);
    return NextResponse.json(
      { error: "Não foi possível carregar a configuração do site." },
      { status: 500 }
    );
  }
}
