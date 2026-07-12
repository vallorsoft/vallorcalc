export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const [trucks, trailers, drivers, recentCalcs] = await Promise.all([
    prisma.truck.findMany({ where: { active: true } }),
    prisma.trailer.findMany({ where: { active: true } }),
    prisma.driver.findMany({ where: { active: true } }),
    prisma.calculation.findMany({
      where: { savedAt: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        truck: { select: { name: true } },
        trailer: { select: { name: true } },
        drivers: { include: { driver: { select: { name: true } } } },
      },
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">Üdvözöllek, {session?.user?.name}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Vontatók", value: trucks.length, href: "/trucks", color: "blue" },
          { label: "Pótkocsik", value: trailers.length, href: "/trailers", color: "indigo" },
          { label: "Sofőrök", value: drivers.length, href: "/drivers", color: "violet" },
          { label: "Mentett számítás", value: recentCalcs.length, href: "/calculations", color: "emerald" },
        ].map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition"
          >
            <div className="text-3xl font-bold text-blue-800">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Gyors műveletek</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/calculations/new"
            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
          >
            + Új kalkuláció
          </Link>
          <Link
            href="/trucks/new"
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            + Új vontató
          </Link>
          <Link
            href="/trailers/new"
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            + Új pótkocsi
          </Link>
          <Link
            href="/drivers/new"
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            + Új sofőr
          </Link>
        </div>
      </div>

      {/* Recent calcs */}
      {recentCalcs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Legutóbbi számítások</h2>
          <div className="space-y-2">
            {recentCalcs.map((c) => {
              const result = c.resultJson as { totalNet?: number; totalNetEur?: number } | null;
              return (
                <Link
                  key={c.id}
                  href={`/calculations/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition"
                >
                  <div>
                    <div className="font-medium text-sm text-gray-800">
                      {c.name || `${c.truck.name} + ${c.trailer.name}`}
                    </div>
                    <div className="text-xs text-gray-400">
                      {c.drivers.map((d) => d.driver.name).join(", ")} •{" "}
                      {new Date(c.startDate).toLocaleDateString("hu-HU")} • {c.tripKm} km
                    </div>
                  </div>
                  {result?.totalNet != null && (
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-700">
                        {result.totalNet.toFixed(0)} LEI
                      </div>
                      <div className="text-xs text-gray-400">
                        {result.totalNetEur?.toFixed(0)} EUR
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
