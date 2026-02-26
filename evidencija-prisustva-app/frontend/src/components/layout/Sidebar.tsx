"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type SubjectOption = { id: string; name: string };

export default function Sidebar() {
  const pathname = usePathname();

  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string>("");

 
  const [displayName, setDisplayName] = useState<string>("Korisnik");

  const itemClass = (href: string) =>
    `w-full text-left px-3 py-2 rounded-md transition ${
      pathname === href
        ? "bg-primary-100 text-primary-700"
        : "text-secondary-200 hover:bg-secondary-100 hover:text-secondary-900"
    }`;

  
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;

    try {
      const u = JSON.parse(raw);

      // ne važi za admina
      if (u?.role === "ADMIN") return;

      const full = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
      if (full) setDisplayName(full);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<SubjectOption[]>("/subjects/mine");
        setSubjects(data);

       
        const saved = localStorage.getItem("activeSubjectId");

        const initial =
          (saved && data.some((s) => s.id === saved) ? saved : "") ||
          data[0]?.id ||
          "";

        setActiveSubjectId(initial);

        if (initial) {
          localStorage.setItem("activeSubjectId", initial);
          const name = data.find((s) => s.id === initial)?.name ?? "";
          localStorage.setItem("activeSubjectName", name);

          
          window.dispatchEvent(new CustomEvent("activeSubjectChanged"));
        }
      } catch (e) {
        console.error("Sidebar: failed to load subjects", e);
      }
    })();
  }, []);

  const handleSubjectChange = (id: string) => {
    setActiveSubjectId(id);
    localStorage.setItem("activeSubjectId", id);

    const name = subjects.find((s) => s.id === id)?.name ?? "";
    localStorage.setItem("activeSubjectName", name);

    window.dispatchEvent(new CustomEvent("activeSubjectChanged"));
  };

  const handleLogout = () => {
    
  // cookie
  document.cookie = "token=; Path=/; Max-Age=0; SameSite=Lax";

  // localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("employeeType");
  localStorage.removeItem("activeSubjectId");
  localStorage.removeItem("activeSubjectName");

  window.location.href = "/login";
  };

  return (
    <aside className="w-64 h-screen bg-[color:var(--color-secondary-800)] flex flex-col text-white shadow-[5px_0px_6px_-4px_rgba(0,0,0,0.5)]">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4">
        <img src="/logo-svetli.png" alt="FON" className="h-8" />
      </div>

      <div className="px-6 text-2xl mb-8">
        Dobrodošli,<br /><span className="font-sans"> {displayName}!</span>
      </div>

      {/* Predmeti + Navigacija */}
      <div className="px-4 flex flex-col text-md">
        <nav className="flex flex-col gap-1">
          {/* Izbor predmeta */}
          <div className="rounded-md transition hover:bg-secondary-100">
            <select
              value={activeSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2 text-left text-md rounded-md bg-transparent appearance-none text-white focus:outline-none cursor-pointer"
              disabled={subjects.length === 0}
            >
              {subjects.length === 0 ? (
                <option className="text-black" value="">
                  Nema predmeta
                </option>
              ) : (
                subjects.map((s) => (
                  <option key={s.id} className="text-black" value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Evidencija */}
          <Link href="/dashboard" className={itemClass("/dashboard")}>
            Evidencija
          </Link>

          {/* Istorija */}
          <Link
            href="/dashboard/history"
            className={itemClass("/dashboard/history")}
          >
            Istorija
          </Link>
        </nav>
      </div>

      <div className="flex-grow" />

      {/* Nalog */}
      <div className="shadow-[0_-4px_4px_rgba(0,0,0,0.2)] px-4 py-4 border-t w-full border-[color:var(--color-secondary-75)]">
        <button
          onClick={handleLogout}
          className="w-full text-left text-md text-secondary-700 hover:text-secondary-900"
        >
          Odjavi se
        </button>
      </div>
    </aside>
  );
}
