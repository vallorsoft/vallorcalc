"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalcResult } from "@/lib/calc-engine";
import { ResultPanel } from "./ResultPanel";

interface Truck { id: string; name: string; licensePlate: string; }
interface Trailer { id: string; name: string; licensePlate: string; }
interface Driver { id: string; name: string; costItems?: { basisType: string }[]; }
interface Pairing { id: string; name: string; truckId: string; trailerId: string; drivers: { driver: Driver }[]; }
interface Toll { description: string; amount: string; currency: "lei" | "eur"; }

interface Props {
  trucks: Truck[];
  trailers: Trailer[];
  drivers: Driver[];
  pairings: Pairing[];
  settings: { excisaDiscountLei?: number | null; fuelDiscountLei?: number | null };
  totalTrucks: number;
}

export function CalcForm({ trucks, trailers, drivers, pairings, settings, totalTrucks }: Props) {
  const router = useRouter();
  const [bnrRate, setBnrRate] = useState(5.1);
  const [truckId, setTruckId] = useState("");
  const [trailerId, setTrailerId] = useState("");
  const [driverIds, setDriverIds] = useState<string[]>([]);
  const [tripWeeks, setTripWeeks] = useState(1);
  const [perDiemDays, setPerDiemDays] = useState("");
  const [tripKm, setTripKm] = useState("");
  const [fuelMethod, setFuelMethod] = useState<"per_liter" | "fixed">("per_liter");
  const [fuelLiterPer100km, setFuelLiterPer100km] = useState("30");
  const [fuelPricePerLiterGross, setFuelPricePerLiterGross] = useState("");
  const [fuelTotalGross, setFuelTotalGross] = useState("");
  const [fuelLiters, setFuelLiters] = useState("");
  const [excisaApplied, setExcisaApplied] = useState(false);
  const [fuelDiscountApplied, setFuelDiscountApplied] = useState(false);
  const [tolls, setTolls] = useState<Toll[]>([]);
  const [activeTrucksCount, setActiveTrucksCount] = useState(1);
  const [freightRevenue, setFreightRevenue] = useState("");
  const [freightCurrency, setFreightCurrency] = useState<"lei" | "eur">("lei");
  const [freightIsGross, setFreightIsGross] = useState(true);
  const [calcName, setCalcName] = useState("");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [calcId, setCalcId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/bnr").then((r) => r.json()).then((d) => setBnrRate(d.rate));
  }, []);

  function loadPairing(p: Pairing) {
    setTruckId(p.truckId);
    setTrailerId(p.trailerId);
    setDriverIds(p.drivers.map((d) => d.driver.id));
  }

  function toggleDriver(id: string) {
    setDriverIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : prev.length < 2 ? [...prev, id] : prev
    );
  }

  function addToll() {
    setTolls([...tolls, { description: "", amount: "", currency: "eur" }]);
  }

  function updateToll(i: number, field: keyof Toll, value: string) {
    setTolls(tolls.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  }

  async function handleCalculate(save = false) {
    if (!truckId || !trailerId || !tripKm) { setError("Kérlek töltsd ki a kötelező mezőket!"); return; }
    setError("");
    setLoading(true);
    const payload = {
      truckId, trailerId, driverIds,
      tripWeeks, tripDays: tripWeeks * 7, tripKm: parseFloat(tripKm),
      perDiemDays: perDiemDays !== "" ? parseInt(perDiemDays) : Math.round(tripWeeks * 7),
      fuelMethod,
      fuelLiterPer100km: fuelMethod === "per_liter" ? parseFloat(fuelLiterPer100km) : undefined,
      fuelPricePerLiterGross: fuelMethod === "per_liter" ? parseFloat(fuelPricePerLiterGross) : undefined,
      fuelTotalGross: fuelMethod === "fixed" ? parseFloat(fuelTotalGross) : undefined,
      fuelLiters: fuelMethod === "fixed" && fuelLiters ? parseFloat(fuelLiters) : undefined,
      excisaApplied, fuelDiscountApplied,
      tolls: tolls.map((t) => ({
        description: t.description,
        inputCurrency: t.currency,
        amountLei: t.currency === "lei" ? parseFloat(t.amount) : parseFloat(t.amount) * bnrRate,
        amountEur: t.currency === "eur" ? parseFloat(t.amount) : parseFloat(t.amount) / bnrRate,
      })),
      activeTrucksCount,
      freightRevenueAmount: freightRevenue ? parseFloat(freightRevenue) : undefined,
      freightRevenueCurrency: freightCurrency,
      freightRevenueIsGross: freightIsGross,
      bnrEurLei: bnrRate,
      name: calcName || undefined,
      save,
    };
    const res = await fetch("/api/calculations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setResult(data.result);
      setCalcId(data.calc.id);
    } else {
      setError("Hiba a számítás során.");
    }
  }

  async function handleSaveExisting() {
    if (!calcId) return;
    setSaving(true);
    await fetch(`/api/calculations/${calcId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: calcName, save: true }),
    });
    setSaving(false);
    router.push("/calculations");
  }

  async function savePairing() {
    if (!truckId || !trailerId) return;
    const name = prompt("Párosítás neve:");
    if (!name) return;
    await fetch("/api/pairings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, truckId, trailerId, driverIds }),
    });
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* BNR rate */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between text-sm">
        <span className="text-blue-700 font-medium">BNR árfolyam</span>
        <div className="flex items-center gap-2">
          <span className="text-blue-900 font-bold">1 EUR = {bnrRate.toFixed(4)} LEI</span>
          <button onClick={() => fetch("/api/bnr").then(r=>r.json()).then(d=>setBnrRate(d.rate))} className="text-blue-600 hover:underline text-xs">Frissítés</button>
        </div>
      </div>

      {/* Saved pairings */}
      {pairings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Mentett párosítások</h3>
          <div className="flex flex-wrap gap-2">
            {pairings.map((p) => (
              <button key={p.id} onClick={() => loadPairing(p)} className="text-xs bg-gray-100 hover:bg-blue-50 border border-gray-200 rounded-lg px-3 py-1.5 transition">
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Jármű párosítás</h2>
          {truckId && trailerId && (
            <button onClick={savePairing} className="text-xs text-blue-600 hover:underline">Párosítás mentése</button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Vontató *</label>
            <select value={truckId} onChange={(e) => setTruckId(e.target.value)} className="input">
              <option value="">— Válassz —</option>
              {trucks.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.licensePlate})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Pótkocsi *</label>
            <select value={trailerId} onChange={(e) => setTrailerId(e.target.value)} className="input">
              <option value="">— Válassz —</option>
              {trailers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.licensePlate})</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Sofőr(ök) – max. 2</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {drivers.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDriver(d.id)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition ${driverIds.includes(d.id) ? "bg-blue-700 text-white border-blue-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trip details */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Fuvar adatok</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Hetek száma *</label>
            <input type="number" value={tripWeeks} onChange={(e) => setTripWeeks(parseFloat(e.target.value) || 0)} className="input" min={0} step="0.5" placeholder="pl. 2" />
            <p className="text-xs text-gray-400 mt-1">A rendszer hetekben számol (48 hét / év)</p>
          </div>
          <div>
            <label className="label">Kilométer *</label>
            <input type="number" value={tripKm} onChange={(e) => setTripKm(e.target.value)} className="input" placeholder="2800" />
          </div>
        </div>
        {drivers.some((d) => driverIds.includes(d.id) && d.costItems?.some((ci) => ci.basisType === "per_day")) && (
          <div>
            <label className="label">Napidíj napok száma</label>
            <input
              type="number"
              value={perDiemDays}
              onChange={(e) => setPerDiemDays(e.target.value)}
              className="input"
              min={0}
              placeholder={String(Math.round(tripWeeks * 7))}
            />
            <p className="text-xs text-gray-400 mt-1">
              A sofőr napidíj tételeit ennyi nappal szorozzuk. Ha üresen hagyod, a fuvar napjaival ({Math.round(tripWeeks * 7)}) számol.
            </p>
          </div>
        )}
      </div>

      {/* Fuel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Üzemanyag</h2>
        <div className="flex gap-3">
          <button type="button" onClick={() => setFuelMethod("per_liter")} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${fuelMethod === "per_liter" ? "bg-blue-700 text-white border-blue-700" : "bg-white border-gray-300 text-gray-600"}`}>
            L/100km alapján
          </button>
          <button type="button" onClick={() => setFuelMethod("fixed")} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${fuelMethod === "fixed" ? "bg-blue-700 text-white border-blue-700" : "bg-white border-gray-300 text-gray-600"}`}>
            Fix összeg (bruttó)
          </button>
        </div>
        {fuelMethod === "per_liter" ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fogyasztás (L/100km)</label>
              <input type="number" value={fuelLiterPer100km} onChange={(e) => setFuelLiterPer100km(e.target.value)} className="input" step="0.1" />
            </div>
            <div>
              <label className="label">Diesel ár (LEI/liter, bruttó)</label>
              <input type="number" value={fuelPricePerLiterGross} onChange={(e) => setFuelPricePerLiterGross(e.target.value)} className="input" step="0.01" placeholder="7.55" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Összes üzemanyag költség (LEI, bruttó)</label>
              <input type="number" value={fuelTotalGross} onChange={(e) => setFuelTotalGross(e.target.value)} className="input" placeholder="pl. 3200" />
            </div>
            <div>
              <label className="label">Tankolt liter (kedvezményhez, opc.)</label>
              <input type="number" value={fuelLiters} onChange={(e) => setFuelLiters(e.target.value)} className="input" step="0.1" placeholder="pl. 420" />
            </div>
          </div>
        )}

        {/* Discounts – literenkénti kedvezmények */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">A kedvezmények literenkénti értékek, a felhasznált literrel szorozva.</p>
          {settings.excisaDiscountLei && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={excisaApplied} onChange={(e) => setExcisaApplied(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">Acciza kedvezmény ({settings.excisaDiscountLei} LEI/liter)</span>
            </label>
          )}
          {settings.fuelDiscountLei && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={fuelDiscountApplied} onChange={(e) => setFuelDiscountApplied(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">Üzemanyag kedvezmény ({settings.fuelDiscountLei} LEI/liter)</span>
            </label>
          )}
        </div>
      </div>

      {/* Tolls */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Útdíjak / Extra kiadások</h2>
          <button type="button" onClick={addToll} className="text-sm text-blue-700 hover:underline">+ Hozzáadás</button>
        </div>
        {tolls.map((t, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={t.description} onChange={(e) => updateToll(i, "description", e.target.value)} placeholder="Megnevezés" className="input flex-1 text-sm" />
            <input type="number" value={t.amount} onChange={(e) => updateToll(i, "amount", e.target.value)} placeholder="Összeg" className="input w-28 text-sm" />
            <select value={t.currency} onChange={(e) => updateToll(i, "currency", e.target.value as "lei" | "eur")} className="input text-sm w-20">
              <option value="eur">EUR</option>
              <option value="lei">LEI</option>
            </select>
            <button type="button" onClick={() => setTolls(tolls.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">×</button>
          </div>
        ))}
      </div>

      {/* Company costs split */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="label">Jelenleg aktív vontatók száma (céges fix ktg. elosztáshoz)</label>
        <div className="flex items-center gap-3 mt-1">
          <input type="range" min={1} max={totalTrucks || 1} value={activeTrucksCount} onChange={(e) => setActiveTrucksCount(parseInt(e.target.value))} className="flex-1" />
          <span className="font-bold text-blue-800 w-8 text-center">{activeTrucksCount}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Max: {totalTrucks} regisztrált vontató</p>
      </div>

      {/* Optional revenue */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <label className="label">Bevétel / Fuvar díj – opcionális</label>
        <div className="flex gap-2">
          <input type="number" value={freightRevenue} onChange={(e) => setFreightRevenue(e.target.value)} className="input flex-1 min-w-0" placeholder="Összeg" />
          <select value={freightCurrency} onChange={(e) => setFreightCurrency(e.target.value as "lei" | "eur")} className="input w-20 shrink-0 text-sm">
            <option value="lei">LEI</option>
            <option value="eur">EUR</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setFreightIsGross(true)} className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition ${freightIsGross ? "bg-blue-700 text-white border-blue-700" : "bg-white border-gray-300 text-gray-600"}`}>
            Bruttó összeg
          </button>
          <button type="button" onClick={() => setFreightIsGross(false)} className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition ${!freightIsGross ? "bg-blue-700 text-white border-blue-700" : "bg-white border-gray-300 text-gray-600"}`}>
            Nettó összeg
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Add meg, hogy a beírt összeg nettó vagy bruttó, és milyen pénznemben (LEI = RON vagy EUR). Ez alapján számoljuk a profitot.
        </p>
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => handleCalculate(false)} disabled={loading} className="flex-1 bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition disabled:opacity-50">
          {loading ? "Számítás..." : "Kalkulálás"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <ResultPanel
            result={result}
            bnrRate={bnrRate}
            printTitle={`${trucks.find((t) => t.id === truckId)?.name ?? ""}${trailerId ? " + " + (trailers.find((t) => t.id === trailerId)?.name ?? "") : ""}`}
            printMeta={`${tripWeeks} hét • ${tripKm} km`}
          />
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="font-semibold text-gray-800">Mentés</h3>
            <input value={calcName} onChange={(e) => setCalcName(e.target.value)} placeholder="Számítás neve (opcionális)" className="input" />
            <div className="flex gap-3">
              <button onClick={handleSaveExisting} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50">
                {saving ? "Mentés..." : "Mentés"}
              </button>
              <button onClick={() => { setResult(null); setCalcId(null); }} className="btn-secondary">Dobás</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
