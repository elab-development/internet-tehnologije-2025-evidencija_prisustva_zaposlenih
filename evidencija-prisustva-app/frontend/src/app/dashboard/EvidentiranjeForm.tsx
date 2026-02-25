"use client";

import { useEffect, useMemo, useState } from "react";

type SubjectOption = { id: string; name: string };

interface EvidentiranjeFormProps {
  onClose: () => void;
  onSubmit: (data: {
    subjectId: string;
    tip: string;
    sat: number;
    minut: number;
    sala: string;
    komentar: string;
  }) => void;

  // umesto jednog naziva, prosleđujemo listu predmeta
  subjects: SubjectOption[];

  // preselektovan predmet
  initialSubjectId?: string;

  datum: Date | null;
}

export default function EvidentiranjeForm({
  onClose,
  onSubmit,
  subjects,
  initialSubjectId,
  datum,
}: EvidentiranjeFormProps) {
  const [subjectId, setSubjectId] = useState<string>(initialSubjectId ?? subjects[0]?.id ?? "");

  const isAssistant = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (localStorage.getItem("employeeType") ?? "").toUpperCase() === "ASSISTANT";
  }, []);

  const [tip, setTip] = useState(isAssistant ? "Vežbe" : "Vežbe");

  const [sat, setSat] = useState(8);
  const [minut, setMinut] = useState(15);
  const [sala, setSala] = useState("");
  const [komentar, setKomentar] = useState("");

  useEffect(() => {
    if (!subjectId && subjects[0]?.id) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  useEffect(() => {
    if (isAssistant && tip === "Predavanje") {
      setTip("Vežbe");
    }
  }, [isAssistant, tip]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;

    const safeTip = isAssistant ? "Vežbe" : tip;

    onSubmit({ subjectId, tip: safeTip, sat, minut, sala, komentar });
  };

  const hasSubjects = subjects.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-96">
      <h2 className="text-xl font-sans font-semibold mb-4 text-center">Evidentiranje nastave</h2>

      {datum && (
        <p className="text-sm text-[color:var(--color-secondary-75)] mb-4 text-center">
          Izabrani datum: {datum.toLocaleDateString()}
        </p>
      )}

      {!hasSubjects ? (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          Nemate nijedan predmet dodeljen nalogu. Ulogujte se kao profesor (EMPLOYEE) ili proverite relacije u bazi.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {/* Predmet */}
        <div>
          <label className="block text-sm text-secondary-700 mb-1">Predmet</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-md border border-[color:var(--color-secondary-700)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)]"
            disabled={!hasSubjects}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tip */}
        <div>
          <label className="block text-sm text-secondary-700 mb-1">Tip nastave</label>
          <select
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            className="w-full rounded-md border border-[color:var(--color-secondary-700)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)]"
          >
            {!isAssistant ? <option>Predavanje</option> : null}
            <option>Vežbe</option>
          </select>

          {isAssistant ? (
            <p className="text-xs text-secondary-600 mt-1">
              Kao asistent možete evidentirati samo vežbe.
            </p>
          ) : null}
        </div>

        {/* Vreme */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm text-secondary-700 mb-1">Sat</label>
            <input
              type="number"
              value={sat}
              onChange={(e) => setSat(Number(e.target.value))}
              min={0}
              max={23}
              className="w-full rounded-md border border-[color:var(--color-secondary-700)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-secondary-700 mb-1">Minut</label>
            <input
              type="number"
              value={minut}
              onChange={(e) => setMinut(Number(e.target.value))}
              min={0}
              max={59}
              className="w-full rounded-md border border-[color:var(--color-secondary-700)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)]"
            />
          </div>
        </div>

        {/* Sala */}
        <div>
          <label className="block text-sm text-secondary-700 mb-1">Sala</label>
          <input
            type="text"
            value={sala}
            onChange={(e) => setSala(e.target.value)}
            className="w-full rounded-md border border-[color:var(--color-secondary-700)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)]"
          />
        </div>

        {/* Komentar */}
        <div>
          <label className="block text-sm text-secondary-700 mb-1">Dodatni komentar</label>
          <input
            type="text"
            value={komentar}
            onChange={(e) => setKomentar(e.target.value)}
            className="w-full rounded-md border border-[color:var(--color-secondary-700)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)]"
            placeholder="Opcionalno..."
          />
        </div>

        {/* Dugmad */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[color:var(--color-danger-600)] font-sans text-white transition"
          >
            Otkaži
          </button>

          <button
            type="submit"
            disabled={!hasSubjects || !subjectId}
            className="px-4 py-2 rounded-md bg-[color:var(--color-accent-600)] font-sans text-white transition disabled:opacity-60"
          >
            Evidentiraj
          </button>
        </div>
      </form>
    </div>
  );
}