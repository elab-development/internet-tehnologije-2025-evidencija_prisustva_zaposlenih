"use client";

import Sidebar from "@/components/layout/Sidebar";
import { Calendar, dateFnsLocalizer} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import EvidentiranjeForm from "./EvidentiranjeForm";


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

// Primer događaja
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

type CalendarSlot = {
  start: Date;
  end: Date;
  slots: Date[];
  action: "select" | "click" | "doubleClick";
};

export default function DashboardPage() {

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [eventsList, setEventsList] = useState(events);
  const aktivanPredmet = "Internet tehnologije"; // zameniti nekad posle tako da uzme iz sidebara

  const handleAddEvent = (data: { predmet: string; tip: string; sat: number; minut: number; sala: string; komentar: string }) => {
  if (!selectedDate) return;

  const start = new Date(selectedDate);
  start.setHours(data.sat, data.minut);

  const end = new Date(start);
  end.setHours(end.getHours() + 1); // promeniti po potrebi, 1h trajanje

  const noviEvent = {
    title: `${data.predmet} - ${data.tip}`,
    start,
    end,
  };

  setEventsList([...eventsList, noviEvent]);
  setShowForm(false); // zatvori modal
};

  const dayPropGetter = (date: Date) => {
    if (
      selectedDate &&
      date.toDateString() === selectedDate.toDateString()
    ) {
      return {
        style: {
          backgroundColor: '#eef2ff',
          color: 'white',
        },
      };
    }
  
    return {};
  };   

  return (
    <div className="flex min-h-screen bg-secondary-50 font-sans">
      {/* Tvoj originalni sidebar */}
      <Sidebar />

      {/* Glavni sadržaj */}
      <main className="flex-1 p-6">

        <div className="flex justify-end mb-4">
          <button onClick={() => setShowForm(true)} className="bg-[color:var(--color-secondary-800)] hover:bg-[color:var(--color-secondary-700)] text-white px-4 py-2 rounded-md text-sm transition">     
            Evidentiraj nastavu +
          </button>
        </div>

        {/* Kalendar */}
        <Calendar
          localizer={localizer}
          selectable
          views={['month', 'week', 'day', 'agenda']}
          startAccessor="start"
          endAccessor="end"
          events={eventsList}
          style={{ height: 600 }}
          onSelectSlot={(slot: { start: Date; end: Date; slots?: Date[]; action?: string }) => setSelectedDate(slot.start)}
          dayPropGetter={dayPropGetter}
        />

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs z-50">
            <EvidentiranjeForm onClose={() => setShowForm(false)} onSubmit={handleAddEvent}
            predmet={aktivanPredmet} datum={selectedDate}/>
          </div>
        )}
      
      </main>
    </div>
  );
}
