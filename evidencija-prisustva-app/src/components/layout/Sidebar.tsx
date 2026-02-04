"use client";

import { useState } from "react";

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<"evidencija" | "istorija">(
    "evidencija"
  );

  return (
    <aside className="w-64 h-screen bg-[color:var(--color-secondary-800)] flex flex-col text-white shadow-[5px_0px_6px_-4px_rgba(0,0,0,0.5)]">
      
    {/* Logo */}
    <div className="flex items-center gap-2 px-6 py-4">
        <img src="/logo-svetli.png" alt="FON" className="h-8" />
    </div>

    <div className="px-6 text-2xl mb-8">
        Dobrodošli,<span className="font-sans"> Korisnik!</span>
    </div>

    {/* <hr className="my-4 w-2/3 border-[color:var(--color-secondary-75)]" /> */}

    {/* Predmeti + Navigacija */}
    <div className="px-4 flex flex-col text-md">
        <nav className="flex flex-col gap-1">

            {/* Izbor predmeta */}
            <div className="rounded-md transition hover:bg-secondary-100">
                <select className="w-full px-3 py-2 text-left text-md rounded-md bg-transparent appearance-none text-white focus:outline-none cursor-pointer">
                    <option className="text-black">Internet tehnologije</option>
                    <option className="text-black">Baze podataka</option>
                </select>
            </div>

            {/* Evidencija */}
            <button onClick={() => setActiveTab("evidencija")} className={`w-full text-left px-3 py-2 rounded-md transition ${activeTab === "evidencija" ?  "bg-primary-100 text-primary-700" : "text-secondary-200 hover:bg-secondary-100 hover:text-secondary-900"}`}>
                Evidencija
            </button>

            {/* Istorija */}
            <button onClick={() => setActiveTab("istorija")} className={`w-full text-left px-3 py-2 rounded-md transition ${activeTab === "istorija" ? "bg-primary-100 text-primary-700" : "text-secondary-200 hover:bg-secondary-100 hover:text-secondary-900"}`}>
                Istorija
            </button>

        </nav>
    </div>

    <div className="flex-grow" />

    {/* Nalog */}
    <div className="shadow-[0_-4px_4px_rgba(0,0,0,0.2)] px-4 py-4 border-t w-full border-[color:var(--color-secondary-75)]">
        <button className="w-full text-left text-md text-secondary-700 hover:text-secondary-900">
          Profil
        </button>
    </div>

    </aside>
  );
}
