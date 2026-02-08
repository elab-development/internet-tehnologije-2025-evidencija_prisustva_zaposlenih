"use client";

import Sidebar from "../../../components/layout/Sidebar";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

type SubjectOption = { id: string; name: string };

type ActivityDto = {
  id: string;
  userId: string;
  subjectId: string;
  type: string;
  room: string | null;
  title: string;
  description: string | null;
  startTime: string; // ISO
  endTime: string;   // ISO
};

function toHHMM(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toICSDate(d: Date) {
  // YYYYMMDDTHHMMSSZ
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export default function HistoryPage() {
  const router = useRouter();

  const [fromDate, setFromDate] = useState(""); // "YYYY-MM-DD"
  const [toDate, setToDate] = useState("");     // "YYYY-MM-DD"

  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [activities, setActivities] = useState<ActivityDto[]>([]);

  // auth + subjects
  useEffect(() => {
    (async () => {
      try {
        await apiFetch("/me");
        const s = await apiFetch<SubjectOption[]>("/subjects/mine");
        setSubjects(s);
      } catch {
        document.cookie = "token=; Path=/; Max-Age=0";
        router.replace("/login");
      }
    })();
  }, [router]);

  const subjectNameById = useMemo(() => {
    const map = new Map<string, string>();
    subjects.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [subjects]);

  async function loadActivities(from: Date, to: Date) {
    try {
      const data = await apiFetch<ActivityDto[]>(
        `/activities?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`
      );
      setActivities(data);
    } catch (e) {
      console.error("Failed to load activities:", e);
    }
  }

  // inicijalno: prošlih 90 dana do danas (možeš promeniti)
  useEffect(() => {
    const now = new Date();
    const from = new Date();
    from.setDate(now.getDate() - 90);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);

    loadActivities(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // kad korisnik promeni filter, povuci novi opseg
  useEffect(() => {
    // ako nema filtera, ne moramo da refetchujemo (ostaje inicijalni opseg)
    if (!fromDate && !toDate) return;

    const from = fromDate ? new Date(`${fromDate}T00:00:00.000Z`) : (() => {
      const d = new Date();
      d.setDate(d.getDate() - 365);
      return d;
    })();

    const to = toDate ? new Date(`${toDate}T23:59:59.999Z`) : (() => {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      return d;
    })();

    loadActivities(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  // samo održane (u prošlosti)
  const pastActivities = useMemo(() => {
    const now = new Date();
    return activities
      .filter((a) => new Date(a.endTime) <= now)
      .sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime));
  }, [activities]);

  const handleExportICS = () => {
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//FON Evidencija//SR\n";

    pastActivities.forEach((a) => {
      const start = new Date(a.startTime);
      const end = new Date(a.endTime);

      const subjectName = subjectNameById.get(a.subjectId) ?? "Predmet";
      const summary = `${subjectName} - ${a.type}`;
      const location = a.room ?? "";
      const description = a.description ?? "";

      ics +=
        "BEGIN:VEVENT\n" +
        `SUMMARY:${summary}\n` +
        `DTSTART:${toICSDate(start)}\n` +
        `DTEND:${toICSDate(end)}\n` +
        `LOCATION:${location}\n` +
        `DESCRIPTION:${description}\n` +
        "END:VEVENT\n";
    });

    ics += "END:VCALENDAR";

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "istorija-evidencije.ics";
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

        {/* Filter + Export */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={handleExportICS}
            className="px-4 py-2 rounded-md bg-[color:var(--color-secondary-800)] text-white text-sm hover:bg-[color:var(--color-secondary-700)] transition"
          >
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
              {pastActivities.map((a) => {
                const start = new Date(a.startTime);
                const end = new Date(a.endTime);
                const subjectName = subjectNameById.get(a.subjectId) ?? a.title;

                return (
                  <tr key={a.id} className="border-t hover:bg-secondary-50 transition">
                    <td className="px-4 py-2">{subjectName}</td>
                    <td className="px-4 py-2">{a.type}</td>
                    <td className="px-4 py-2">{start.toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      {toHHMM(start)} – {toHHMM(end)}
                    </td>
                    <td className="px-4 py-2">{a.room ?? "—"}</td>
                    <td className="px-4 py-2">{a.description ?? "—"}</td>
                  </tr>
                );
              })}

              {pastActivities.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-secondary-600" colSpan={6}>
                    Nema održane nastave u izabranom periodu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
