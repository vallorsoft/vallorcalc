export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { CalcForm } from "@/components/calculations/CalcForm";

export default async function NewCalcPage() {
  const [trucks, trailers, drivers, pairings, settings] = await Promise.all([
    prisma.truck.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.trailer.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.driver.findMany({ where: { active: true }, include: { costItems: true }, orderBy: { name: "asc" } }),
    prisma.vehiclePairing.findMany({
      include: { truck: true, trailer: true, drivers: { include: { driver: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.systemSettings.upsert({ where: { id: "singleton" }, create: { id: "singleton" }, update: {} }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Új kalkuláció</h1>
      <CalcForm
        trucks={trucks}
        trailers={trailers}
        drivers={drivers}
        pairings={pairings}
        settings={{ excisaDiscountLei: settings.excisaDiscountLei, fuelDiscountLei: settings.fuelDiscountLei }}
        totalTrucks={trucks.length}
      />
    </div>
  );
}
