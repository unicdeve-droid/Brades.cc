import { NextResponse } from "next/server";
import { getImageKit } from "@/lib/imagekit";

// Cada upload precisa de um token novo — nunca deixar essa resposta
// ser cacheada (pela Vercel, CDN, navegador, etc.), senão o ImageKit
// recusa o token repetido com "token has been used before".
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Endpoint que o SDK client-side do ImageKit consulta para conseguir
// enviar o arquivo direto para o ImageKit com uma assinatura válida.
export async function GET() {
  try {
    const imagekit = getImageKit();
    const result = imagekit.getAuthenticationParameters();
    return NextResponse.json(
      {
        ...result,
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Não foi possível gerar autenticação do ImageKit." },
      { status: 500 }
    );
  }
}
