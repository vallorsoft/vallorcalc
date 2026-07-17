"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type BasisType = "monthly" | "yearly" | "per_day" | "per_km";
type Currency = "lei" | "eur";

interface CostItem { name: string; amountLei: number; vatApplicable: boolean; basisType: BasisType; currency: Currency; }

// amountLei mindig nettó; a bérek/adók általában TVA-mentesek
const DEFAULT_DRIVER_COSTS: CostItem[] = [
  { name: "Fizetés", amountLei: 5000, vatApplicable: false, basisType: "monthly", currency: "lei" },
  { name: "Napidíj (diurna)", amountLei: 70, vatApplicable: false, basisType: "per_day", currency: "eur" },
  { name: "Alkalmazott adók", amountLei: 2070, vatApplicable: false, basisType: "monthly", currency: "lei" },
];

const BASIS_OPTIONS: { value: BasisType; label: string; suffix: string }[] = [
  { value: "monthly", label: "Havi fizetés", suffix: "/ hó" },
  { value: "yearly", label: "Éves fizetés", suffix: "/ év" },
  { value: "per_day", label: "Napidíj (nap)", suffix: "/ nap" },
  { value: "per_km", label: "Km díjazás", suffix: "/ km" },
];

const VALID_BASIS: BasisType[] = ["monthly", "yearly", "per_day", "per_km"];
function normalizeBasis(b?: string | null): BasisType {
  return VALID_BASIS.includes(b as BasisType) ? (b as BasisType) : "monthly";
}
function normalizeCurrency(c?: string | null): Currency {
  return c === "eur" ? "eur" : "lei";
}

interface DriverFormProps {
  initial?: {
    id?: string;
    name: string;
    phone?: string | null;
    licenseNumber?: string | null;
    licenseExpiry?: Date | string | null;
    notes?: string | null;
    costItems: { name: string; amountLei: number; vatApplicable: boolean; basisType?: string | null; currency?: string | null }[];
  };
}

export function DriverForm({ initial }: DriverFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [licenseNumber, setLicenseNumber] = useState(initial?.licenseNumber ?? "");
  const [licenseExpiry, setLicenseExpiry] = useState(
    initial?.licenseExpiry
      ? new Date(initial.licenseExpiry).toISOString().split("T")[0]
      : ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [costs, setCosts] = useState<CostItem[]>(
    initial?.costItems
      ? initial.costItems.map((c) => ({
          name: c.name,
          amountLei: c.amountLei,
          vatApplicable: c.vatApplicable,
          basisType: normalizeBasis(c.basisType),
          currency: normalizeCurrency(c.currency),
        }))
      : DEFAULT_DRIVER_COSTS
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addCost() {
    setCosts([...costs, { name: "", amountLei: 0, vatApplicable: false, basisType: "monthly", currency: "lei" }]);
  }

  function updateCost(i: number, field: keyof CostItem, value: unknown) {
    setCosts(costs.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name, phone: phone || null, licenseNumber: licenseNumber || null,
      licenseExpiry: licenseExpiry || null, notes: notes || null, costItems: costs,
    };
    const url = initial?.id ? `/api/drivers/${initial.id}` : "/api/drivers";
    const method = initial?.id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { router.push("/drivers"); router.refresh(); }
    else setError("Hiba a mentés során.");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Alapadatok</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Név *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="Teljes név" />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+40..." />
          </div>
          <div>
            <label className="label">Jogosítvány száma</label>
            <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Jogosítvány lejárata</label>
            <input type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Megjegyzés</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Havi fix kiadások</h2>
          <button type="button" onClick={addCost} className="text-sm text-blue-700 hover:underline">+ Hozzáadás</button>
        </div>
        <p className="text-xs text-gray-400">
          Fizetés, napidíj, adók stb. Az összeg mindig nettó. Számítási mód tételenként: havi / éves fix,
          napidíj (napok száma × összeg), vagy km díjazás (kilométer × összeg). Pénznem LEI vagy EUR – az EUR
          összegeket a kalkuláció BNR árfolyamával váltjuk át. Egyszerre több típus is megadható.
        </p>
        {costs.map((c, i) => {
          const suffix = BASIS_OPTIONS.find((o) => o.value === c.basisType)?.suffix ?? "";
          const unit = `${c.currency === "eur" ? "EUR" : "LEI"} ${suffix}, nettó`;
          return (
            <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-3 bg-gray-50">
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Megnevezés</label>
                  <input value={c.name} onChange={(e) => updateCost(i, "name", e.target.value)} placeholder="pl. Fizetés" className="input text-sm" />
                </div>
                <button type="button" onClick={() => setCosts(costs.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 px-2 pt-5 text-lg">×</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Összeg ({unit})</label>
                  <input type="number" step="any" value={c.amountLei} onChange={(e) => updateCost(i, "amountLei", parseFloat(e.target.value) || 0)} className="input text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Pénznem</label>
                  <select value={c.currency} onChange={(e) => updateCost(i, "currency", e.target.value as Currency)} className="input text-sm">
                    <option value="lei">LEI (RON)</option>
                    <option value="eur">EUR</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Számítási mód</label>
                  <select value={c.basisType} onChange={(e) => updateCost(i, "basisType", e.target.value as BasisType)} className="input text-sm">
                    {BASIS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={c.vatApplicable} onChange={(e) => updateCost(i, "vatApplicable", e.target.checked)} className="rounded" />
                <span className="text-xs text-gray-600">TVA (21%) rászámítása erre a tételre</span>
              </label>
            </div>
          );
        })}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Mentés..." : "Mentés"}</button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">Vissza</button>
      </div>
    </form>
  );
}
