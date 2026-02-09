"use client";

import Sidebar from "@/components/layout/Sidebar";
import { Calendar, dateFnsLocalizer, type Range } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEffect, useMemo, useState } from "react";
import EvidentiranjeForm from "./EvidentiranjeForm";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type ActivityDto = {
  id: string;
  userId: string;
  subjectId: string;
  type: string;
  room: string | null;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
};

function rangeToFromTo(range: Range | Date[] | { start: Date; end: Date }) {
  if (Array.isArray(range) && range.length > 0) {
    const from = new Date(range[0]);
    const to = new Date(range[range.length - 1]);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  if (range && "start" in range && "end" in range) {
    const from = new Date(range.start);
    const to = new Date(range.end);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  const from = new Date();
  from.setDate(from.getDate() - 30);
  const to = new Date();
  to.setDate(to.getDate() + 30);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [dbActivities, setDbActivities] = useState<ActivityDto[]>([]);
  const [mySubjects, setMySubjects] = useState<{ id: string; name: string }[]>([]);

  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await apiFetch("/me");
        const subjects = await apiFetch<{ id: string; name: string }[]>("/subjects/mine");
        setMySubjects(subjects);
      } catch {
        document.cookie = "token=; Path=/; Max-Age=0";
        router.replace("/login");
      }
    })();
  }, [router]);

  async function loadActivities(from: Date, to: Date) {
    try {
      const data = await apiFetch<ActivityDto[]>(
        `/activities?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`
      );
      setDbActivities(data);
    } catch (e) {
      console.error("Failed to load activities:", e);
    }
  }

  useEffect(() => {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const to = new Date();
    to.setDate(to.getDate() + 30);
    to.setHours(23, 59, 59, 999);
    loadActivities(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddEvent = async (data: {
    subjectId: string;
    tip: string;
    sat: number;
    minut: number;
    sala: string;
    komentar: string;
  }) => {
    if (!selectedDate) return;

    const subject = mySubjects.find((s) => s.id === data.subjectId);
    const subjectName = subject?.name ?? "Predmet";

    const start = new Date(selectedDate);
    start.setHours(data.sat, data.minut, 0, 0);

    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    try {
      await apiFetch("/activities", {
        method: "POST",
        body: JSON.stringify({
          subjectId: data.subjectId,
          type: data.tip,
          room: data.sala,
          title: `${subjectName} – ${data.tip}`,
          description: data.komentar,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }),
      });

      // refresuj (za sada oko danas)
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const to = new Date();
      to.setDate(to.getDate() + 30);
      to.setHours(23, 59, 59, 999);
      await loadActivities(from, to);

      setShowForm(false);
    } catch (e) {
      console.error("Greška pri upisu aktivnosti:", e);
    }
  };

  const dayPropGetter = (date: Date) => {
    if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
      return { style: { backgroundColor: "#eef2ff", color: "white" } };
    }
    return {};
  };

  const calendarEvents = useMemo(() => {
    return dbActivities.map((a) => ({
      title: a.title,
      start: new Date(a.startTime),
      end: new Date(a.endTime),
    }));
  }, [dbActivities]);

  return (
    <div className="flex min-h-screen bg-secondary-50 font-sans">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowForm(true)}
            className="bg-[color:var(--color-secondary-800)] hover:bg-[color:var(--color-secondary-700)] text-white px-4 py-2 rounded-md text-sm transition"
          >
            Evidentiraj nastavu +
          </button>
        </div>

        <Calendar
          localizer={localizer}
          selectable
          views={["month", "week", "day", "agenda"]}
          startAccessor="start"
          endAccessor="end"
          events={calendarEvents}
          style={{ height: 600 }}
          onSelectSlot={(slot: { start: Date }) => setSelectedDate(slot.start)}
          dayPropGetter={dayPropGetter}
          onRangeChange={(range: Range | Date[] | { start: Date; end: Date }) => {
            const { from, to } = rangeToFromTo(range);
            loadActivities(from, to);
          }}
        />

        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs z-50">
            <EvidentiranjeForm
              onClose={() => setShowForm(false)}
              onSubmit={handleAddEvent}
              subjects={mySubjects}
              datum={selectedDate}
            />
          </div>
        )}
      </main>
    </div>
  );
}
