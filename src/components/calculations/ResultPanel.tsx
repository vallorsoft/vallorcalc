"use client";
import { CalcResult } from "@/lib/calc-engine";

interface Props {
  result: CalcResult;
  bnrRate: number;
}

function fmt(n: number) { return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

export function ResultPanel({ result, bnrRate }: Props) {
  const hasProfit = result.profitNet != null;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-700 text-white rounded-xl p-4">
          <div className="text-xs text-blue-200 mb-1">Nettó kiadás</div>
          <div className="text-2xl font-bold">{fmt(result.totalNet)} LEI</div>
          <div className="text-sm text-blue-200 mt-0.5">{fmt(result.totalNetEur)} EUR</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">ÁFA (TVA 21%)</div>
          <div className="text-2xl font-bold text-gray-800">{fmt(result.totalVat)} LEI</div>
          <div className="text-sm text-gray-400 mt-0.5">{fmt(result.totalVat / bnrRate)} EUR</div>
        </div>
        <div className="bg-gray-800 text-white rounded-xl p-4 col-span-2">
          <div className="text-xs text-gray-300 mb-1">Bruttó kiadás (ÁFA-val)</div>
          <div className="text-2xl font-bold">{fmt(result.totalGross)} LEI</div>
          <div className="text-sm text-gray-300 mt-0.5">{fmt(result.totalGrossEur ?? result.totalGross / bnrRate)} EUR</div>
        </div>
        {hasProfit && (
          <>
            <div className={`border rounded-xl p-4 ${result.profitNet! >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <div className={`text-xs mb-1 ${result.profitNet! >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {result.profitNet! >= 0 ? "Nyereség (nettó)" : "Veszteség (nettó)"}
              </div>
              <div className={`text-2xl font-bold ${result.profitNet! >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {fmt(result.profitNet!)} LEI
              </div>
              <div className={`text-sm mt-0.5 ${result.profitNet! >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                {fmt(result.profitEur!)} EUR
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Fuvar díj (nettó)</div>
              <div className="text-2xl font-bold text-gray-800">{fmt(result.freightNet!)} LEI</div>
              <div className="text-sm text-gray-400 mt-0.5">{fmt(result.freightNet! / bnrRate)} EUR</div>
            </div>
          </>
        )}
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Részletes bontás</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {result.lines.map((line, i) => (
            <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
              <span className="text-gray-600">{line.name}</span>
              <div className="text-right">
                <span className="font-medium text-gray-800">{fmt(line.netLei)} LEI</span>
                <span className="text-xs text-gray-400 ml-2">+TVA {fmt(line.vatLei)}</span>
              </div>
            </div>
          ))}

          {result.fuelGross > 0 && (
            <div className="px-4 py-2.5 flex items-center justify-between text-sm bg-amber-50">
              <span className="text-amber-700">Üzemanyag</span>
              <div className="text-right">
                <span className="font-medium text-amber-800">{fmt(result.fuelNet)} LEI</span>
                <span className="text-xs text-amber-500 ml-2">+TVA {fmt(result.fuelVat)}</span>
              </div>
            </div>
          )}

          {result.discountNet > 0 && (
            <div className="px-4 py-2.5 flex items-center justify-between text-sm bg-green-50">
              <span className="text-green-700">Kedvezmény (levonás)</span>
              <div className="text-right">
                <span className="font-medium text-green-700">− {fmt(result.discountNet)} LEI</span>
              </div>
            </div>
          )}

          {result.tollNet > 0 && (
            <div className="px-4 py-2.5 flex items-center justify-between text-sm">
              <span className="text-gray-600">Útdíjak</span>
              <span className="font-medium text-gray-800">{fmt(result.tollNet)} LEI</span>
            </div>
          )}

          <div className="px-4 py-3 flex items-center justify-between bg-blue-50">
            <span className="font-bold text-blue-900">ÖSSZESEN (nettó)</span>
            <div className="text-right">
              <div className="font-bold text-blue-900">{fmt(result.totalNet)} LEI</div>
              <div className="text-sm text-blue-600">{fmt(result.totalNetEur)} EUR</div>
            </div>
          </div>

          <div className="px-4 py-3 flex items-center justify-between bg-gray-100">
            <span className="font-bold text-gray-900">ÖSSZESEN (bruttó)</span>
            <div className="text-right">
              <div className="font-bold text-gray-900">{fmt(result.totalGross)} LEI</div>
              <div className="text-sm text-gray-600">{fmt(result.totalGrossEur ?? result.totalGross / bnrRate)} EUR</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
