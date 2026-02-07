"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message ?? "Greška pri prijavi.");
        return;
      }

      // očekujemo { token }
      if (!data?.token) {
        setError("Server nije vratio token.");
        return;
      }

      localStorage.setItem("token", data.token);

      // preusmeri na dashboard (prilagodi rutu ako je drugačija)
      router.push("/dashboard");
    } catch (err) {
      setError("Ne mogu da se povežem sa serverom (backend).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
        {/* Logo i tekst */}
        <div className="flex items-center justify-between mb-8">
          <img src="/logo-tamni.png" alt="FON logo" className="h-10 w-auto" />
          <span className="text-sm text-[color:var(--color-secondary-75)]">
            Fakultetski servis FON-a
          </span>
        </div>

        <h1 className="text-2xl font-sans font-extrabold text-text mb-6 text-center">
          Evidencija prisustva
        </h1>

        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-6 pb-4 pt-4" onSubmit={onSubmit}>
          {/* Email */}
          <div>
            <label className="block text-sm font-sans text-text mb-1">Email</label>
            <input
              type="email"
              placeholder="ime.prezime.xxxx@fon.bg.ac.rs"
              className="w-full rounded-md border border-primary-300 px-3 py-2 bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)] focus:ring-offset-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-sans text-text mb-1">Lozinka</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-md border border-secondary-300 px-3 py-2 bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)] focus:ring-offset-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div>
            <hr className="w-full h-[1.5px] bg-[color:var(--color-secondary-600)] border-0 my-6 rounded-md" />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[color:var(--color-primary-900)] hover:bg-[var(--color-secondary-700)] font-sans text-white rounded-md py-2 font-medium transition duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {loading ? "Prijavljivanje..." : "Prijavi se"}
          </button>
        </form>
      </div>
    </div>
  );
}
