import { prisma } from "@/lib/prisma";
import { TruckForm } from "@/components/trucks/TruckForm";
import { notFound } from "next/navigation";

export default async function TruckEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const truck = await prisma.truck.findUnique({ where: { id }, include: { costItems: true } });
  if (!truck) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Vontató szerkesztése</h1>
      <TruckForm initial={truck} />
    </div>
  );
}
