import { TeachingEvent } from "@/features/attendance/Event";
import { CalendarEvent } from "./calendar";

export function teachingToCalendarEvent(
  event: TeachingEvent
): CalendarEvent {
  const start = new Date(`${event.datum}T${event.pocetak}`);
  const end = new Date(`${event.datum}T${event.kraj}`);

  return {
    title: `${event.predmet} – ${event.tip}`,
    start,
    end,
  };
}
