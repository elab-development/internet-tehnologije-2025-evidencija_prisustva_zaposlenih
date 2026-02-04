"use client";

import { useState } from "react";

interface EvidentiranjeFormProps {
  onClose: () => void;
  onSubmit: (data: {
    predmet: string;
    tip: string;
    sat: number;
    minut: number;
    sala: string;
    komentar: string;
  }) => void;
  predmet: string;
  datum: Date | null;
}

export default function EvidentiranjeForm({ onClose, onSubmit, predmet, datum }: EvidentiranjeFormProps) {
  const [tip, setTip] = useState("Vezbe");
  const [sat, setSat] = useState(8);
  const [minut, setMinut] = useState(15);
  const [sala, setSala] = useState("");
  const [komentar, setKomentar] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ predmet, tip, sat, minut, sala, komentar });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-96">
      <h2 className="text-xl font-sans font-semibold mb-4 text-center">Evidentiranje nastave</h2>

      {datum && (
        <p className="text-sm text-[color:var(--color-secondary-75)] mb-4 text-center">
          Izabrani datum: {datum.toLocaleDateString()}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tip */}
        <div>
          <label className="block text-sm text-secondary-700 mb-1">
            Tip nastave
          </label>
          <select
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            className="w-full rounded-md border border-[color:var(--color-secondary-700)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)]">
            <option>Predavanje</option>
            <option>Vežbe</option>
          </select>
        </div>

        {/* Vreme */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm text-secondary-700 mb-1">
              Sat
            </label>
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
            <label className="block text-sm text-secondary-700 mb-1">
              Minut
            </label>
            <input
              type="number"
              value={minut}
              onChange={(e) => setMinut(Number(e.target.value))}
              min={0}
              max={59}
              className="w-full rounded-md border border-[color:var(--color-secondary-700)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)]"/>
          </div>
        </div>

        {/* Sala */}
        <div>
          <label className="block text-sm text-secondary-700 mb-1">
            Sala
          </label>
          <input
            type="text"
            value={sala}
            onChange={(e) => setSala(e.target.value)}
            className="w-full rounded-md border border-[color:var(--color-secondary-700)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-900)]"
          />
        </div>

        {/* Komentar */}
        <div>
          <label className="block text-sm text-secondary-700 mb-1">
            Dodatni komentar
          </label>
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
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-[color:var(--color-danger-600)] font-sans text-white transition">
            Otkaži
          </button>

          <button type="submit" className="px-4 py-2 rounded-md bg-[color:var(--color-accent-600)] ont-sans text-white transition">
            Evidentiraj
          </button>
        </div>
      </form>
    </div>
  );
}
