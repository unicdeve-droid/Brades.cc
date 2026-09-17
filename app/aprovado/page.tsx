"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AprovadoPage() {
  const [data, setData] = useState<{
    success_title: string;
    success_message: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((c) =>
        setData({
          success_title: c.success_title,
          success_message: c.success_message,
        })
      );
  }, []);

  return (
    <main className="min-h-dvh mx-auto max-w-[430px] flex flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-okgreen flex items-center justify-center shadow-lg shadow-okgreen/25">
        <svg
          viewBox="0 0 24 24"
          className="w-10 h-10"
          fill="none"
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold">
        {data?.success_title ?? "Aprovado"}
      </h1>
      <p className="text-ink/60 leading-relaxed">
        {data?.success_message ?? ""}
      </p>

      <Link
        href="/"
        className="mt-4 text-sm font-semibold text-crimson-start"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
