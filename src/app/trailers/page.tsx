import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function TrailersPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  const trailers = await prisma.trailer.findMany({
    where: { active: true },
    include: { costItems: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pótkocsik</h1>
        {isAdmin && (
          <Link href="/trailers/new" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
            + Új pótkocsi
          </Link>
        )}
      </div>
      {trailers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Még nincs pótkocsi rögzítve.</div>
      ) : (
        <div className="grid gap-3">
          {trailers.map((t) => (
            <Link key={t.id} href={`/trailers/${t.id}`} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">{t.name}</div>
                <div className="text-sm text-gray-500">{t.licensePlate}{t.year ? ` • ${t.year}` : ""}</div>
                <div className="text-xs text-gray-400 mt-1">{t.costItems.length} költségtétel</div>
              </div>
              <div className="text-gray-400">›</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
