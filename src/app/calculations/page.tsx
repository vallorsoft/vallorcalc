import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CalculationsPage() {
  const calcs = await prisma.calculation.findMany({
    where: { savedAt: { not: null } },
    orderBy: { createdAt: "desc" },
    include: {
      truck: { select: { name: true, licensePlate: true } },
      trailer: { select: { name: true, licensePlate: true } },
      drivers: { include: { driver: { select: { name: true } } } },
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mentett számítások</h1>
        <Link href="/calculations/new" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
          + Új kalkuláció
        </Link>
      </div>

      {calcs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 mb-3">Még nincs mentett számítás.</p>
          <Link href="/calculations/new" className="text-blue-700 font-medium hover:underline">Kezdj egy új kalkulációt</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {calcs.map((c) => {
            const result = c.resultJson as { totalNet?: number; totalNetEur?: number; profitNet?: number } | null;
            return (
              <Link key={c.id} href={`/calculations/${c.id}`} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {c.name || `${c.truck.name} + ${c.trailer.name}`}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {c.drivers.map((d) => d.driver.name).join(", ")} •{" "}
                      {new Date(c.startDate).toLocaleDateString("hu-HU")} • {c.tripKm} km • {c.tripDays} nap
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {result?.totalNet != null && (
                      <>
                        <div className="text-sm font-bold text-gray-800">{Math.round(result.totalNet).toLocaleString("hu-HU")} LEI</div>
                        {result.profitNet != null && (
                          <div className={`text-xs font-medium ${result.profitNet >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {result.profitNet >= 0 ? "+" : ""}{Math.round(result.profitNet).toLocaleString("hu-HU")} LEI
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
