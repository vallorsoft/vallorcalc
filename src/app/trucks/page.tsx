export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function TrucksPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  const trucks = await prisma.truck.findMany({
    where: { active: true },
    include: { costItems: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vontatók</h1>
        {isAdmin && (
          <Link
            href="/trucks/new"
            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
          >
            + Új vontató
          </Link>
        )}
      </div>

      {trucks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Még nincs vontató rögzítve.
        </div>
      ) : (
        <div className="grid gap-3">
          {trucks.map((truck) => (
            <Link
              key={truck.id}
              href={`/trucks/${truck.id}`}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-gray-900">{truck.name}</div>
                <div className="text-sm text-gray-500">
                  {truck.licensePlate}{truck.year ? ` • ${truck.year}` : ""}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {truck.costItems.length} költségtétel
                </div>
              </div>
              <div className="text-gray-400">›</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
