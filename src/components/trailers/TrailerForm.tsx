"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// amountLei mindig nettó; vatApplicable = kell-e rá 21% TVA
const DEFAULT_TRAILER_COSTS = [
  { name: "Gumiabroncs", basisType: "km", intervalKm: 240000, intervalMonths: null, amountLei: 10800, vatApplicable: true },
  { name: "RCA biztosítás", basisType: "time", intervalKm: null, intervalMonths: 12, amountLei: 500, vatApplicable: false },
  { name: "CASCO biztosítás", basisType: "time", intervalKm: null, intervalMonths: 12, amountLei: 2200, vatApplicable: false },
  { name: "Fékbetét", basisType: "km", intervalKm: null, intervalMonths: 12, amountLei: 1650, vatApplicable: true },
  { name: "Féktárcsa", basisType: "km", intervalKm: null, intervalMonths: 24, amountLei: 3450, vatApplicable: true },
  { name: "Lízing", basisType: "time", intervalKm: null, intervalMonths: 1, amountLei: 2150, vatApplicable: false },
];

interface CostItem {
  name: string;
  basisType: string;
  intervalKm: number | null;
  intervalMonths: number | null;
  amountLei: number;
  vatApplicable: boolean;
  intervalUnit?: "month" | "year";
}

// Idő-alapú tétel megjelenítési egysége: 12 hónap = 1 év (arányosításban azonos).
function deriveUnit(m: number | null | undefined): "month" | "year" {
  return m != null && m >= 12 && m % 12 === 0 ? "year" : "month";
}

interface TrailerFormProps {
  initial?: {
    id?: string;
    name: string;
    licensePlate: string;
    year?: number | null;
    notes?: string | null;
    costItems: CostItem[];
  };
}

export function TrailerForm({ initial }: TrailerFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [plate, setPlate] = useState(initial?.licensePlate ?? "");
  const [year, setYear] = useState(initial?.year?.toString() ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [costs, setCosts] = useState<CostItem[]>(
    (initial?.costItems ?? DEFAULT_TRAILER_COSTS).map((c) => ({ ...c, intervalUnit: deriveUnit(c.intervalMonths) }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addCost() {
    setCosts([...costs, { name: "", basisType: "time", intervalKm: null, intervalMonths: 12, amountLei: 0, vatApplicable: false }]);
  }

  function updateCost(i: number, field: keyof CostItem, value: unknown) {
    setCosts(costs.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  }

  function removeCost(i: number) {
    setCosts(costs.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = { name, licensePlate: plate, year: year ? parseInt(year) : null, notes: notes || null, costItems: costs };
    const url = initial?.id ? `/api/trailers/${initial.id}` : "/api/trailers";
    const method = initial?.id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { router.push("/trailers"); router.refresh(); }
    else setError("Hiba a mentés során.");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Alapadatok</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Név / Azonosító *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="pl. Schmitz SCS" />
          </div>
          <div>
            <label className="label">Rendszám *</label>
            <input value={plate} onChange={(e) => setPlate(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="label">Évjárat</label>
            <input value={year} onChange={(e) => setYear(e.target.value)} type="number" className="input" />
          </div>
          <div className="col-span-2">
            <label className="label">Megjegyzés</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows={2} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Költségtételek</h2>
          <button type="button" onClick={addCost} className="text-sm text-blue-700 hover:underline">+ Hozzáadás</button>
        </div>
        {costs.map((c, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-3 bg-gray-50">
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Tétel neve</label>
                <input value={c.name} onChange={(e) => updateCost(i, "name", e.target.value)} placeholder="pl. Gumiabroncs" className="input text-sm" />
              </div>
              <button type="button" onClick={() => removeCost(i)} className="text-red-400 hover:text-red-600 px-2 pt-5 text-lg">×</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Alap</label>
                <select value={c.basisType} onChange={(e) => updateCost(i, "basisType", e.target.value)} className="input text-sm">
                  <option value="km">km-alapú</option>
                  <option value="time">idő-alapú</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Összeg (LEI, nettó)</label>
                <input type="number" value={c.amountLei} onChange={(e) => updateCost(i, "amountLei", parseFloat(e.target.value))} className="input text-sm" />
              </div>
              {c.basisType === "km" ? (
                <div>
                  <label className="text-xs text-gray-500">Élettartam (km)</label>
                  <input type="number" value={c.intervalKm ?? ""} onChange={(e) => updateCost(i, "intervalKm", e.target.value ? parseFloat(e.target.value) : null)} className="input text-sm" placeholder="pl. 240000" />
                </div>
              ) : (
                <div>
                  <label className="text-xs text-gray-500">Időszak (havi / éves)</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={c.intervalUnit === "year" ? (c.intervalMonths != null ? c.intervalMonths / 12 : "") : (c.intervalMonths ?? "")}
                      onChange={(e) => {
                        const n = e.target.value ? parseFloat(e.target.value) : null;
                        updateCost(i, "intervalMonths", n == null ? null : Math.round((c.intervalUnit === "year" ? 12 : 1) * n));
                      }}
                      className="input text-sm"
                      placeholder={c.intervalUnit === "year" ? "pl. 1" : "pl. 12"}
                    />
                    <select
                      value={c.intervalUnit ?? "month"}
                      onChange={(e) => {
                        const u = e.target.value as "month" | "year";
                        const shown = c.intervalUnit === "year" ? (c.intervalMonths != null ? c.intervalMonths / 12 : null) : c.intervalMonths;
                        const months = shown == null ? null : Math.round((u === "year" ? 12 : 1) * shown);
                        setCosts(costs.map((cc, idx) => idx === i ? { ...cc, intervalUnit: u, intervalMonths: months } : cc));
                      }}
                      className="input text-sm w-20"
                    >
                      <option value="month">Hónap</option>
                      <option value="year">Év</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input type="checkbox" checked={c.vatApplicable} onChange={(e) => updateCost(i, "vatApplicable", e.target.checked)} className="rounded" />
              <span className="text-xs text-gray-600">TVA (21%) rászámítása erre a tételre</span>
            </label>
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Mentés..." : "Mentés"}</button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">Vissza</button>
      </div>
    </form>
  );
}
