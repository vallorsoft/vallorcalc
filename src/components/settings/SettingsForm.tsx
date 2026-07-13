"use client";
import { useState } from "react";

interface CompanyCost {
  id: string;
  name: string;
  amountLei: number; // mindig nettó
  vatApplicable: boolean;
  basisType: string;
  intervalMonths: number | null;
}

interface Props {
  initial: {
    annualKmTarget: number;
    workingWeeksPerYear: number;
    excisaDiscountLei?: number | null;
    excisaDiscountType?: string | null;
    fuelDiscountLei?: number | null;
    fuelDiscountType?: string | null;
  };
  companyCosts: CompanyCost[];
}

export function SettingsForm({ initial, companyCosts: initCosts }: Props) {
  const [annualKm, setAnnualKm] = useState(initial.annualKmTarget.toString());
  const [weeks, setWeeks] = useState(initial.workingWeeksPerYear.toString());
  const [excisaLei, setExcisaLei] = useState(initial.excisaDiscountLei?.toString() ?? "");
  const [excisaType, setExcisaType] = useState(initial.excisaDiscountType ?? "gross");
  const [fuelDiscLei, setFuelDiscLei] = useState(initial.fuelDiscountLei?.toString() ?? "");
  const [fuelDiscType, setFuelDiscType] = useState(initial.fuelDiscountType ?? "gross");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [costs, setCosts] = useState<CompanyCost[]>(initCosts);
  const [newCost, setNewCost] = useState({ name: "", amountLei: "", vatApplicable: false, basisType: "time", intervalMonths: "12" });
  const [addingCost, setAddingCost] = useState(false);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        annualKmTarget: parseFloat(annualKm),
        workingWeeksPerYear: parseInt(weeks),
        excisaDiscountLei: excisaLei ? parseFloat(excisaLei) : null,
        excisaDiscountType: excisaLei ? excisaType : null,
        fuelDiscountLei: fuelDiscLei ? parseFloat(fuelDiscLei) : null,
        fuelDiscountType: fuelDiscLei ? fuelDiscType : null,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function addCompanyCost() {
    const res = await fetch("/api/company-costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCost.name,
        amountLei: parseFloat(newCost.amountLei),
        vatApplicable: newCost.vatApplicable,
        basisType: newCost.basisType,
        intervalMonths: parseInt(newCost.intervalMonths),
      }),
    });
    if (res.ok) {
      const item = await res.json();
      setCosts([...costs, item]);
      setNewCost({ name: "", amountLei: "", vatApplicable: false, basisType: "time", intervalMonths: "12" });
      setAddingCost(false);
    }
  }

  async function deleteCompanyCost(id: string) {
    await fetch("/api/company-costs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setCosts(costs.filter((c) => c.id !== id));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <form onSubmit={saveSettings} className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        <h2 className="font-semibold text-gray-800">Rendszer paraméterek</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Éves km cél</label>
            <input type="number" value={annualKm} onChange={(e) => setAnnualKm(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Munkahetek / év</label>
            <input type="number" value={weeks} onChange={(e) => setWeeks(e.target.value)} className="input" />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Acciza kedvezmény</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Összeg (LEI/liter)</label>
              <input type="number" value={excisaLei} onChange={(e) => setExcisaLei(e.target.value)} className="input" step="0.01" placeholder="pl. 0.5" />
            </div>
            <div>
              <label className="label">Típus</label>
              <select value={excisaType} onChange={(e) => setExcisaType(e.target.value)} className="input">
                <option value="gross">Bruttó</option>
                <option value="net">Nettó</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Üzemanyag kedvezmény</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Összeg (LEI/liter)</label>
              <input type="number" value={fuelDiscLei} onChange={(e) => setFuelDiscLei(e.target.value)} className="input" step="0.01" placeholder="pl. 0.3" />
            </div>
            <div>
              <label className="label">Típus</label>
              <select value={fuelDiscType} onChange={(e) => setFuelDiscType(e.target.value)} className="input">
                <option value="gross">Bruttó</option>
                <option value="net">Nettó</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saved ? "Mentve!" : saving ? "Mentés..." : "Beállítások mentése"}
        </button>
      </form>

      {/* Company costs */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Vállalati fix költségek</h2>
            <p className="text-xs text-gray-400">Ezek az összeg elosztódik az aktív vontatók között</p>
          </div>
          <button onClick={() => setAddingCost(true)} className="text-sm text-blue-700 hover:underline">+ Hozzáadás</button>
        </div>

        {addingCost && (
          <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={newCost.name} onChange={(e) => setNewCost({ ...newCost, name: e.target.value })} placeholder="Megnevezés" className="input text-sm col-span-2" />
              <input type="number" value={newCost.amountLei} onChange={(e) => setNewCost({ ...newCost, amountLei: e.target.value })} placeholder="Összeg LEI (nettó)" className="input text-sm" />
              <select value={newCost.basisType} onChange={(e) => setNewCost({ ...newCost, basisType: e.target.value })} className="input text-sm">
                <option value="time">Idő-alapú</option>
                <option value="km">km-alapú</option>
              </select>
              <input type="number" value={newCost.intervalMonths} onChange={(e) => setNewCost({ ...newCost, intervalMonths: e.target.value })} placeholder="Időszak (hónap)" className="input text-sm col-span-2" />
              <label className="flex items-center gap-2 cursor-pointer col-span-2">
                <input type="checkbox" checked={newCost.vatApplicable} onChange={(e) => setNewCost({ ...newCost, vatApplicable: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-600">TVA (21%) rászámítása erre a tételre</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={addCompanyCost} className="btn-primary text-sm py-1.5">Hozzáadás</button>
              <button onClick={() => setAddingCost(false)} className="btn-secondary text-sm py-1.5">Mégse</button>
            </div>
          </div>
        )}

        {costs.length === 0 ? (
          <p className="text-sm text-gray-400">Nincs vállalati fix tétel.</p>
        ) : (
          <div className="space-y-2">
            {costs.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm">
                <div>
                  <span className="font-medium text-gray-800">{c.name}</span>
                  <span className="text-gray-400 ml-2">{c.amountLei} LEI (nettó) {c.vatApplicable ? "+TVA" : "TVA nélkül"} • {c.basisType === "time" ? `${c.intervalMonths} hó` : "km-alapú"}</span>
                </div>
                <button onClick={() => deleteCompanyCost(c.id)} className="text-red-400 hover:text-red-600 ml-2">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
