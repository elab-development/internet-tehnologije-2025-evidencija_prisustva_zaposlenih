"use client"; // obavezno za interaktivne komponente

import Sidebar from "@/components/layout/Sidebar";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Lokalizacija datuma
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Primer događaja (kasnije poveži sa backend-om)
const events = [
  {
    title: "Sastanak sa timom",
    start: new Date(2026, 0, 29, 10, 0),
    end: new Date(2026, 0, 29, 11, 0),
  },
  {
    title: "Pregled prisustva",
    start: new Date(2026, 0, 30, 14, 0),
    end: new Date(2026, 0, 30, 15, 0),
  },
];

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-secondary-50">
      {/* Tvoj originalni sidebar */}
      <Sidebar />

      {/* Glavni sadržaj */}
      <main className="flex-1 p-6">

        {/* Kalendar */}
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          className="bg-white rounded-lg shadow"
        />
      </main>
    </div>
  );
}
