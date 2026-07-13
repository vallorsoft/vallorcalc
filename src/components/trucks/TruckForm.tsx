"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// amountLei mindig nettó; vatApplicable = kell-e rá 21% TVA
const DEFAULT_TRUCK_COSTS = [
  { name: "Gumiabroncs", basisType: "km", intervalKm: 240000, intervalMonths: null, amountLei: 12600, vatApplicable: true },
  { name: "Szerviz (revisie)", basisType: "km", intervalKm: 80000, intervalMonths: null, amountLei: 2450, vatApplicable: true },
  { name: "RCA biztosítás", basisType: "time", intervalKm: null, intervalMonths: 12, amountLei: 12000, vatApplicable: false },
  { name: "CASCO biztosítás", basisType: "time", intervalKm: null, intervalMonths: 12, amountLei: 7200, vatApplicable: false },
  { name: "Fékbetét", basisType: "km", intervalKm: null, intervalMonths: 12, amountLei: 1000, vatApplicable: true },
  { name: "Féktárcsa", basisType: "km", intervalKm: null, intervalMonths: 24, amountLei: 2000, vatApplicable: true },
  { name: "Lízing", basisType: "time", intervalKm: null, intervalMonths: 1, amountLei: 4300, vatApplicable: false },
  { name: "Karbantartás", basisType: "km", intervalKm: null, intervalMonths: 12, amountLei: 7000, vatApplicable: true },
  { name: "Váratlan szerviz", basisType: "time", intervalKm: null, intervalMonths: 12, amountLei: 15000, vatApplicable: true },
];

interface CostItem {
  name: string;
  basisType: string;
  intervalKm: number | null;
  intervalMonths: number | null;
  amountLei: number;
  vatApplicable: boolean;
}

interface TruckFormProps {
  initial?: {
    id?: string;
    name: string;
    licensePlate: string;
    year?: number | null;
    notes?: string | null;
    costItems: CostItem[];
  };
}

export function TruckForm({ initial }: TruckFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [plate, setPlate] = useState(initial?.licensePlate ?? "");
  const [year, setYear] = useState(initial?.year?.toString() ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [costs, setCosts] = useState<CostItem[]>(
    initial?.costItems ?? DEFAULT_TRUCK_COSTS
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
    const url = initial?.id ? `/api/trucks/${initial.id}` : "/api/trucks";
    const method = initial?.id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) {
      router.push("/trucks");
      router.refresh();
    } else {
      setError("Hiba a mentés során.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Alapadatok</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Név / Azonosító *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="pl. VOLVO FH16" />
          </div>
          <div>
            <label className="label">Rendszám *</label>
            <input value={plate} onChange={(e) => setPlate(e.target.value)} required className="input" placeholder="CJ-XX-XXX" />
          </div>
          <div>
            <label className="label">Évjárat</label>
            <input value={year} onChange={(e) => setYear(e.target.value)} type="number" className="input" placeholder="2020" />
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
        <div className="text-xs text-gray-400 mb-2">km-alapú: gumiabroncs, fék, karbantartás | idő-alapú: biztosítás, lízing stb.</div>
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
                  <label className="text-xs text-gray-500">Időszak (hónap)</label>
                  <input type="number" value={c.intervalMonths ?? ""} onChange={(e) => updateCost(i, "intervalMonths", e.target.value ? parseInt(e.target.value) : null)} className="input text-sm" placeholder="pl. 12" />
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
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Mentés..." : "Mentés"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">Vissza</button>
      </div>
    </form>
  );
}
