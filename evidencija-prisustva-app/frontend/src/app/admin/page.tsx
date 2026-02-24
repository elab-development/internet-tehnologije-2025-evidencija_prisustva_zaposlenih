"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { apiFetch } from "@/lib/api";

type Subject = { id: string; name: string; code?: string };
type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  subjects: { id: string; name: string }[];
};

function normalizeEmailPart(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/đ/g, "dj")
    .replace(/[čć]/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/\s+/g, "");
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // modal state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profCode, setProfCode] = useState(""); // "0003"
  const [password, setPassword] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const computedEmail = useMemo(() => {
    const fn = normalizeEmailPart(firstName);
    const ln = normalizeEmailPart(lastName);
    const code = (profCode || "").trim();
    if (!fn || !ln || code.length !== 4) return "";
    return `${fn}.${ln}.${code}@fon.bg.ac.rs`;
  }, [firstName, lastName, profCode]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [u, s] = await Promise.all([
        apiFetch<UserRow[]>("/admin/users"),
        apiFetch<Subject[]>("/admin/subjects"),
      ]);
      setUsers(u);
      setSubjects(s);
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: string }).message)
          : "Greška";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((u) => {
      const full = `${u.firstName} ${u.lastName}`.toLowerCase();
      return (
        full.includes(needle) ||
        u.email.toLowerCase().includes(needle) ||
        u.subjects.some((s) => s.name.toLowerCase().includes(needle))
      );
    });
  }, [users, q]);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setProfCode("");
    setPassword("");
    setSelectedSubjectIds([]);
    setEditingId(null);
  }

  async function openCreate() {
    resetForm();
    setMode("create");
    setOpen(true);
    try {
      const resp = await apiFetch<{ nextCode: string }>("/admin/next-professor-code");
      setProfCode(resp.nextCode);
    } catch {
      // nema potrebe
    }
  }

  function openEdit(u: UserRow) {
    resetForm();
    setMode("edit");
    setEditingId(u.id);
    setFirstName(u.firstName);
    setLastName(u.lastName);

    const m = u.email.match(/\.([0-9]{4})@/);
    setProfCode(m?.[1] ?? "");

    setSelectedSubjectIds(u.subjects.map((x) => x.id));
    setOpen(true);
  }

  async function submit() {
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Unesi ime i prezime.");
      return;
    }
    if (!/^\d{4}$/.test(profCode)) {
      setError("Šifra profesora mora imati tačno 4 cifre (npr 0003).");
      return;
    }
    if (mode === "create" && password.length < 4) {
      setError("Unesi lozinku (min 4 karaktera).");
      return;
    }

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      professorCode: profCode,
      password: password || undefined,
      subjectIds: selectedSubjectIds,
    };

    try {
      if (mode === "create") {
        await apiFetch("/admin/users", { method: "POST", body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/admin/users/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      }
      setOpen(false);
      resetForm();
      await loadAll();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: string }).message)
          : "Greška";
      setError(msg);
    }
  }

  async function removeUser(id: string) {
    if (!confirm("Da li si siguran da želiš da obrišeš korisnika?")) return;
    try {
      await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: string }).message)
          : "Greška";
      setError(msg);
    }
  }

  async function downloadIcs(userId: string) {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
      const res = await fetch(`${base}/admin/users/${userId}/ics`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
      });
      if (!res.ok) throw new Error("Ne mogu da preuzmem .ics");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `profesor_${userId}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: string }).message)
          : "Greška";
      setError(msg);
    }
  }

  return (
    <div className="flex min-h-screen bg-secondary-50 font-sans">
      <AdminSidebar />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-sans font-extrabold text-text">Korisnici</h1>

          <button
            onClick={openCreate}
            className="bg-[color:var(--color-secondary-800)] hover:bg-[color:var(--color-secondary-700)] text-white px-4 py-2 rounded-md text-sm transition"
          >
            Dodaj korisnika +
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-4 mb-4">
          <label className="block text-sm font-sans text-text mb-1">Pretraga</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ime, email, predmet…"
            className="w-full rounded-md border border-primary-300 px-3 py-2 bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)] focus:ring-offset-2"
          />
        </div>

        {loading ? (
          <div className="text-secondary-700">Učitavanje…</div>
        ) : error ? (
          <div className="text-[color:var(--color-danger-600)]">{error}</div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary-100 text-secondary-900">
                <tr>
                  <th className="text-left p-3">Korisnik</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Predmeti</th>
                  <th className="text-right p-3">Akcije</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-3">
                      {u.firstName} {u.lastName}
                      {u.role === "ADMIN" ? (
                        <span className="ml-2 text-xs px-2 py-1 rounded bg-primary-100 text-primary-700">ADMIN</span>
                      ) : null}
                    </td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                      {u.subjects.length === 0 ? (
                        <span className="text-secondary-600">—</span>
                      ) : (
                        u.subjects.map((s) => s.name).join(", ")
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => downloadIcs(u.id)}
                          className="px-3 py-1 rounded-md border border-secondary-300 hover:bg-secondary-100 transition"
                        >
                          .ics
                        </button>

                        <button
                          onClick={() => openEdit(u)}
                          className="px-3 py-1 rounded-md border border-secondary-300 hover:bg-secondary-100 transition"
                        >
                          Izmeni
                        </button>

                        <button
                          onClick={() => removeUser(u.id)}
                          className="px-3 py-1 rounded-md border border-[color:var(--color-danger-600)] text-[color:var(--color-danger-600)] hover:bg-red-50 transition"
                          disabled={u.role === "ADMIN"}
                          title={u.role === "ADMIN" ? "Admin se ne briše" : ""}
                        >
                          Obriši
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td className="p-3 text-secondary-600" colSpan={4}>
                      Nema rezultata.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        {open && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs z-50">
            <div className="w-full max-w-xl bg-white rounded-xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-sans font-extrabold text-text">
                  {mode === "create" ? "Dodaj korisnika" : "Izmeni korisnika"}
                </h2>
                <button onClick={() => setOpen(false)} className="text-secondary-700 hover:text-secondary-900">
                  ✕
                </button>
              </div>

              {error && <p className="text-sm text-[color:var(--color-danger-600)] mb-2">{error}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-sans text-text mb-1">Ime</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-md border border-primary-300 px-3 py-2 bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)] focus:ring-offset-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-sans text-text mb-1">Prezime</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-md border border-primary-300 px-3 py-2 bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)] focus:ring-offset-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-sans text-text mb-1">Šifra profesora (4 cifre)</label>
                  <input
                    value={profCode}
                    onChange={(e) => setProfCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="0003"
                    className="w-full rounded-md border border-secondary-300 px-3 py-2 bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)] focus:ring-offset-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-sans text-text mb-1">
                    Lozinka {mode === "edit" ? "(ostavi prazno ako ne menjaš)" : ""}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-secondary-300 px-3 py-2 bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)] focus:ring-offset-2"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-sans text-text mb-1">Email (auto)</label>
                  <input
                    value={computedEmail}
                    readOnly
                    className="w-full rounded-md border border-secondary-300 px-3 py-2 bg-secondary-50 text-secondary-900"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-sans text-text mb-2">Predmeti</label>
                  <div className="grid grid-cols-2 gap-2 max-h-44 overflow-auto border border-secondary-200 rounded-md p-2">
                    {subjects.map((s) => {
                      const checked = selectedSubjectIds.includes(s.id);
                      return (
                        <label key={s.id} className="flex items-center gap-2 text-sm text-secondary-900">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedSubjectIds((prev) =>
                                checked ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                              );
                            }}
                          />
                          {s.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-md border border-secondary-300 hover:bg-secondary-100 transition"
                >
                  Otkaži
                </button>

                <button
                  onClick={submit}
                  className="px-4 py-2 rounded-md bg-[color:var(--color-primary-900)] hover:bg-[var(--color-secondary-700)] text-white transition"
                >
                  Sačuvaj
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}