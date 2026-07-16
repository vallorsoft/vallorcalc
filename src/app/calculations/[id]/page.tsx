import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ResultPanel } from "@/components/calculations/ResultPanel";
import { CalcResult } from "@/lib/calc-engine";
import { DeleteCalcButton } from "@/components/calculations/DeleteCalcButton";

export default async function CalcDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const calc = await prisma.calculation.findUnique({
    where: { id },
    include: {
      truck: true,
      trailer: true,
      drivers: { include: { driver: true } },
      tolls: true,
    },
  });
  if (!calc) notFound();

  const result = calc.resultJson as CalcResult | null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          {calc.serialNo && (
            <div className="text-xs font-mono font-semibold text-blue-700 mb-1">Sorszám: #{calc.serialNo}</div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{calc.name || `${calc.truck.name} + ${calc.trailer.name}`}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date(calc.startDate).toLocaleDateString("hu-HU")} • {calc.tripKm} km • {calc.tripDays} nap
          </p>
        </div>
        <div className="flex gap-2">
          <DeleteCalcButton id={calc.id} />
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div><span className="text-gray-500">Vontató:</span> <span className="font-medium">{calc.truck.name} ({calc.truck.licensePlate})</span></div>
          <div><span className="text-gray-500">Pótkocsi:</span> <span className="font-medium">{calc.trailer.name} ({calc.trailer.licensePlate})</span></div>
          {calc.drivers.length > 0 && (
            <div className="col-span-2"><span className="text-gray-500">Sofőr(ök):</span> <span className="font-medium">{calc.drivers.map(d => d.driver.name).join(", ")}</span></div>
          )}
          <div><span className="text-gray-500">BNR árfolyam:</span> <span className="font-medium">{calc.bnrEurLei.toFixed(4)} LEI/EUR</span></div>
          <div><span className="text-gray-500">Aktív vontatók:</span> <span className="font-medium">{calc.activeTrucksCount}</span></div>
          {calc.freightRevenueInput != null && (
            <div className="col-span-2">
              <span className="text-gray-500">Megadott bevétel:</span>{" "}
              <span className="font-medium">
                {calc.freightRevenueInput.toLocaleString("hu-HU")} {calc.freightRevenueCurrency === "eur" ? "EUR" : "LEI"} ({calc.freightRevenueIsGross ? "bruttó" : "nettó"})
              </span>
            </div>
          )}
        </div>
      </div>

      {result && <ResultPanel result={result} bnrRate={calc.bnrEurLei} />}

      <div className="flex gap-3">
        <Link href="/calculations" className="btn-secondary">Vissza a listához</Link>
        <Link href="/calculations/new" className="btn-primary">Új kalkuláció</Link>
      </div>
    </div>
  );
}
