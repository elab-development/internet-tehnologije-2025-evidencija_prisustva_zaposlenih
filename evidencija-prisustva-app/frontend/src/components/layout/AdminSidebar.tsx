"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  const itemClass = (href: string) =>
    `w-full text-left px-3 py-2 rounded-md transition ${
      pathname === href
        ? "bg-primary-100 text-primary-700"
        : "text-secondary-200 hover:bg-secondary-100 hover:text-secondary-900"
    }`;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeSubjectId");
    localStorage.removeItem("activeSubjectName");
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 h-screen bg-[color:var(--color-secondary-800)] flex flex-col text-white shadow-[5px_0px_6px_-4px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 px-6 py-4">
        <img src="/logo-svetli.png" alt="FON" className="h-8" />
      </div>

      <div className="px-6 text-2xl mb-8">
        Admin panel
      </div>

      <div className="px-4 flex flex-col text-md">
        <nav className="flex flex-col gap-1">
          <Link href="/admin" className={itemClass("/admin")}>
            Korisnici
          </Link>
        </nav>
      </div>

      <div className="flex-grow" />

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
