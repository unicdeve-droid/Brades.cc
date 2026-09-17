"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Senha incorreta.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-ink px-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm flex flex-col gap-4 bg-glass backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-glass"
      >
        <h1 className="text-white text-xl font-bold mb-2">Painel admin</h1>
        <label className="flex flex-col gap-2">
          <span className="text-white/60 text-sm">Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="font-mono rounded-lg px-4 py-3 bg-white/5 text-white border border-white/10 focus:border-crimson-start outline-none"
            autoFocus
          />
        </label>
        {error && <p className="text-sm text-crimson-start">{error}</p>}
        <button
          disabled={loading}
          className="mt-2 rounded-full bg-okgreen hover:bg-okgreendark disabled:opacity-50 text-white font-semibold py-3 transition-colors"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
