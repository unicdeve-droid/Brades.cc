"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SiteConfig = {
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

type Submission = {
  id: number;
  field1_value: string;
  field2_value: string;
  field3_value: string;
  ip: string;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"config" | "envios">("config");
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  useEffect(() => {
    if (tab === "envios") {
      fetch("/api/admin/submissions")
        .then((r) => r.json())
        .then(setSubmissions);
    }
  }, [tab]);

  async function save(patch: Partial<SiteConfig>) {
    if (!config) return;
    const next = { ...config, ...patch };
    setConfig(next);
  }

  async function persist(overrideConfig?: SiteConfig) {
    const toSave = overrideConfig ?? config;
    if (!toSave) return;
    setSaving(true);
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSave),
    });
    setSaving(false);
    if (res.ok) {
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    }
    return res.ok;
  }

  async function handleLogoUpload(file: File) {
    if (!config) return;
    setUploading(true);
    setUploadError(null);
    try {
      const authRes = await fetch("/api/admin/upload-auth", {
        cache: "no-store",
      });
      const auth = await authRes.json();
      if (!authRes.ok) throw new Error(auth.error || "Falha na autenticação.");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("publicKey", auth.publicKey);
      formData.append("signature", auth.signature);
      formData.append("expire", String(auth.expire));
      formData.append("token", auth.token);
      formData.append("folder", "/checkout-logo");

      const uploadRes = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        { method: "POST", body: formData }
      );
      const uploaded = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploaded.message || "Falha no upload.");

      // Já salva a logo direto no banco, sem depender do botão "Salvar
      // alterações" — assim que o upload termina, a logo já vale pro site.
      const merged = { ...config, logo_url: uploaded.url as string };
      setConfig(merged);
      const ok = await persist(merged);
      if (!ok) {
        setUploadError(
          "A logo subiu, mas não deu pra salvar no site. Clique em Salvar alterações."
        );
      }
    } catch (err: any) {
      setUploadError(err.message || "Erro ao subir a logo.");
    } finally {
      setUploading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  if (!config) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-ink/50">
        Carregando…
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-ink text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-ink/95 backdrop-blur z-10">
        <h1 className="font-bold">Painel admin</h1>
        <button
          onClick={logout}
          className="text-sm text-white/50 hover:text-white transition-colors"
        >
          Sair
        </button>
      </header>

      <nav className="flex gap-1 px-6 pt-4">
        {(["config", "envios"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-glass border border-white/10 border-b-0"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {t === "config" ? "Configurações" : "Envios recebidos"}
          </button>
        ))}
      </nav>

      <div className="bg-glass border-t border-white/10 min-h-[70vh] px-6 py-8">
        {tab === "config" ? (
          <div className="max-w-2xl mx-auto flex flex-col gap-10">
            <Section title="Logo">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {config.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={config.logo_url}
                      alt="Logo"
                      className="object-contain w-full h-full p-2"
                    />
                  ) : (
                    <span className="text-xs text-white/30">sem logo</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogoUpload(f);
                    }}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploading ? "Enviando…" : "Trocar logo (PNG)"}
                  </button>
                  {uploadError && (
                    <span className="text-xs text-crimson-start">
                      {uploadError}
                    </span>
                  )}
                </div>
              </div>
            </Section>

            <Section title="Título principal">
              <TextInput
                value={config.title}
                onChange={(v) => save({ title: v })}
              />
            </Section>

            <Section title="Campo principal">
              <div className="grid grid-cols-2 gap-4">
                <LabeledInput
                  label="Rótulo do campo"
                  value={config.field1_label}
                  onChange={(v) => save({ field1_label: v })}
                />
                <LabeledInput
                  label="Formato (use x para cada caractere)"
                  value={config.field1_format}
                  onChange={(v) => save({ field1_format: v })}
                  mono
                />
              </div>
            </Section>

            <Section title="Campo secundário 1">
              <div className="grid grid-cols-2 gap-4">
                <LabeledInput
                  label="Rótulo do campo"
                  value={config.field2_label}
                  onChange={(v) => save({ field2_label: v })}
                />
                <LabeledInput
                  label="Formato"
                  value={config.field2_format}
                  onChange={(v) => save({ field2_format: v })}
                  mono
                />
              </div>
            </Section>

            <Section title="Campo secundário 2">
              <div className="grid grid-cols-2 gap-4">
                <LabeledInput
                  label="Rótulo do campo"
                  value={config.field3_label}
                  onChange={(v) => save({ field3_label: v })}
                />
                <LabeledInput
                  label="Formato"
                  value={config.field3_format}
                  onChange={(v) => save({ field3_format: v })}
                  mono
                />
              </div>
            </Section>

            <Section title="Textos livres (sem limite de caracteres)">
              <div className="flex flex-col gap-3">
                {config.paragraphs.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <textarea
                      value={p}
                      onChange={(e) => {
                        const next = [...config.paragraphs];
                        next[i] = e.target.value;
                        save({ paragraphs: next });
                      }}
                      rows={2}
                      className="flex-1 rounded-lg px-4 py-3 bg-white/5 border border-white/10 focus:border-crimson-start outline-none text-sm"
                    />
                    <button
                      onClick={() =>
                        save({
                          paragraphs: config.paragraphs.filter(
                            (_, idx) => idx !== i
                          ),
                        })
                      }
                      className="text-white/40 hover:text-crimson-start px-2"
                      aria-label="Remover parágrafo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    save({ paragraphs: [...config.paragraphs, ""] })
                  }
                  className="self-start text-sm text-white/50 hover:text-white"
                >
                  + Adicionar texto
                </button>
              </div>
            </Section>

            <Section title="Rodapé">
              <textarea
                value={config.footer_text}
                onChange={(e) => save({ footer_text: e.target.value })}
                rows={3}
                className="w-full rounded-lg px-4 py-3 bg-white/5 border border-white/10 focus:border-crimson-start outline-none text-sm"
              />
            </Section>

            <Section title="Tela de aprovado">
              <div className="grid grid-cols-1 gap-4">
                <LabeledInput
                  label="Título"
                  value={config.success_title}
                  onChange={(v) => save({ success_title: v })}
                />
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-white/60">Mensagem</span>
                  <textarea
                    value={config.success_message}
                    onChange={(e) =>
                      save({ success_message: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-lg px-4 py-3 bg-white/5 border border-white/10 focus:border-crimson-start outline-none text-sm"
                  />
                </div>
              </div>
            </Section>

            <Section title="Limite de envios (rate limit)">
              <div className="grid grid-cols-2 gap-4">
                <LabeledInput
                  label="Máximo de envios"
                  type="number"
                  value={String(config.rate_limit_max)}
                  onChange={(v) =>
                    save({ rate_limit_max: Number(v) || 1 })
                  }
                />
                <LabeledInput
                  label="Janela (segundos)"
                  type="number"
                  value={String(config.rate_limit_window_seconds)}
                  onChange={(v) =>
                    save({ rate_limit_window_seconds: Number(v) || 1 })
                  }
                />
              </div>
              <p className="text-xs text-white/40 mt-2">
                Ex.: 5 envios a cada 60 segundos, por IP.
              </p>
            </Section>

            <div className="sticky bottom-0 pt-4 pb-2 bg-ink/95 backdrop-blur -mx-6 px-6 border-t border-white/10">
              <button
                onClick={() => persist()}
                disabled={saving}
                className="w-full rounded-full bg-okgreen hover:bg-okgreendark disabled:opacity-50 text-white font-semibold py-3 transition-colors"
              >
                {saving ? "Salvando…" : savedAt ? "Salvo ✓" : "Salvar alterações"}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/10">
                  <th className="py-2 pr-4">Data</th>
                  <th className="py-2 pr-4">Campo principal</th>
                  <th className="py-2 pr-4">Campo 2</th>
                  <th className="py-2 pr-4">Campo 3</th>
                  <th className="py-2 pr-4">IP</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id} className="border-b border-white/5">
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2 pr-4 font-mono">{s.field1_value}</td>
                    <td className="py-2 pr-4 font-mono">{s.field2_value}</td>
                    <td className="py-2 pr-4 font-mono">{s.field3_value}</td>
                    <td className="py-2 pr-4 text-white/40">{s.ip}</td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/30">
                      Nenhum envio recebido ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </section>
  );
}

function TextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg px-4 py-3 bg-white/5 border border-white/10 focus:border-crimson-start outline-none"
    />
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  mono,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-white/60">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg px-4 py-3 bg-white/5 border border-white/10 focus:border-crimson-start outline-none text-sm ${
          mono ? "font-mono" : ""
        }`}
      />
    </label>
  );
}
