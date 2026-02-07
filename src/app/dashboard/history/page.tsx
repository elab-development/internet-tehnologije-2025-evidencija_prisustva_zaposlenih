"use client";

import Sidebar from "@/components/layout/Sidebar";
import { useState } from "react";
import { TeachingEvent } from "@/types/Event";

type HistoryEvent = {
    id: number;
    predmet: string;
    tip: "Predavanje" | "Vežbe";
    datum: string;
    pocetak: string;
    kraj: string;
    sala: string;
    komentar?: string;
};

// DUMMY PODACI, kasnije to da se zameni sa fetch("/api/events")
const dummyTeachingEvents: TeachingEvent[] = [
  {
    id: "1",
    predmet: "Internet tehnologije",
    tip: "Predavanje",
    datum: "2026-01-29",
    pocetak: "10:00",
    kraj: "11:00",
    sala: "Amfiteatar 1",
    komentar: "Uvod u React",
  },
  {
    id: "2",
    predmet: "Baze podataka",
    tip: "Vežbe",
    datum: "2026-01-30",
    pocetak: "12:00",
    kraj: "13:00",
    sala: "Lab 2",
  },
];

const events: TeachingEvent[] = [
  {
    id: "1",
    predmet: "Internet tehnologije",
    tip: "Predavanje",
    datum: "2026-01-29",
    pocetak: "10:00",
    kraj: "12:00",
    sala: "301",
    komentar: "Uvod u React",
  },
];

export default function HistoryPage() {

    const [events] = useState<TeachingEvent[]>(dummyTeachingEvents);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const filteredEvents = events.filter((e) => {
        const eventDate = new Date(e.datum);

        if (fromDate && eventDate < new Date(fromDate)) return false;
        if (toDate && eventDate > new Date(toDate)) return false;

        return true;
    });

    // funkcija za izvoz
    const handleExportICS = () => {
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//FON Evidencija//SR\n";

        filteredEvents.forEach((e) => {
            const start = new Date(`${e.datum}T${e.pocetak}`);
            const end = new Date(`${e.datum}T${e.kraj}`);

            const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

            icsContent += "BEGIN:VEVENT\n" + `SUMMARY:${e.predmet} - ${e.tip}\n` + `DTSTART:${formatDate(start)}\n` + `DTEND:${formatDate(end)}\n` + `LOCATION:${e.sala}\n` + `DESCRIPTION:${e.komentar || ""}\n` + "END:VEVENT\n";
        });

        icsContent += "END:VCALENDAR";

        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "evidencija.ics";
        link.click();

        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex min-h-screen bg-secondary-50">
            <Sidebar />

            <main className="flex-1 p-6">
                <h1 className="text-2xl font-sans font-semibold mb-6">
                    Istorija održane nastave
                </h1>

                {/* Filter */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-4">
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
                    </div>

                    {/* Dugme za izvoz */}
                    <button onClick={() => handleExportICS()} className="px-4 py-2 rounded-md bg-[color:var(--color-secondary-800)] text-white text-sm hover:bg-[color:var(--color-secondary-700)] transition">
                        Izvezi .ics
                    </button>
                </div>

                

                {/* Tabela */}
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="w-full text-sm">
                        <thead className="bg-secondary-100 text-secondary-700">
                            <tr>
                                <th className="px-4 py-3 text-left">Predmet</th>
                                <th className="px-4 py-3 text-left">Tip</th>
                                <th className="px-4 py-3 text-left">Datum</th>
                                <th className="px-4 py-3 text-left">Vreme</th>
                                <th className="px-4 py-3 text-left">Sala</th>
                                <th className="px-4 py-3 text-left">Komentar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents.map((e) => (
                                <tr key={e.id} className="border-t hover:bg-secondary-50 transition">
                                    <td className="px-4 py-2">{e.predmet}</td>
                                    <td className="px-4 py-2">{e.tip}</td>
                                    <td className="px-4 py-2">{new Date(e.datum).toLocaleDateString()}</td>
                                    <td className="px-4 py-2">{e.pocetak} – {e.kraj}</td>
                                    <td className="px-4 py-2">{e.sala}</td>
                                    <td className="px-4 py-2">{e.komentar || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
