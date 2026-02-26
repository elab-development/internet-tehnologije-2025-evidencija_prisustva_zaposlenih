"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type EmployeeType = "PROFESSOR" | "ASSISTANT";

type LoginResponse = {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    role: "ADMIN" | "EMPLOYEE";
    firstName: string;
    lastName: string;

    employeeType?: EmployeeType;
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // SAVE AUTH DATA
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // cookie za Next middleware (ne može da čita localStorage)
      document.cookie = `token=${data.token}; Path=/; SameSite=Lax`;

      localStorage.setItem("role", data.user?.role ?? "");
      localStorage.setItem("employeeType", data.user?.employeeType ?? "");

      // REDIRECT
      if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: string }).message)
          : "Neuspešan login";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
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
          <p className="text-sm text-[color:var(--color-danger-600)] mb-2">
            {error}
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-6 pb-4 pt-4">
          <div>
            <label className="block text-sm font-sans text-text mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="ime.prezime.xxxx@fon.bg.ac.rs"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-primary-300 px-3 py-2 bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)] focus:ring-offset-2"
            />
          </div>

          <div>
            <label className="block text-sm font-sans text-text mb-1">
              Lozinka
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-secondary-300 px-3 py-2 bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)] focus:ring-offset-2"
            />
          </div>

          <div>
            <hr className="w-full h-[1.5px] bg-[color:var(--color-secondary-600)] border-0 my-6 rounded-md" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[color:var(--color-primary-900)] hover:bg-[var(--color-secondary-700)] font-sans text-white py-2 rounded-md font-medium transition duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Prijavljivanje..." : "Prijavi se"}
          </button>
        </form>
      </div>
    </div>
  );
}