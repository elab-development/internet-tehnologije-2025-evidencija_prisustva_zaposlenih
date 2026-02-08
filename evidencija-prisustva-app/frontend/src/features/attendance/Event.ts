export type TeachingEvent = {
  id: string;
  predmet: string;
  tip: "Predavanje" | "Vežbe";
  datum: string;        // YYYY-MM-DD
  pocetak: string;      // HH:mm
  kraj: string;         // HH:mm
  sala: string;
  komentar?: string;
};
