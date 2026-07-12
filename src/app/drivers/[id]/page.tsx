import { prisma } from "@/lib/prisma";
import { DriverForm } from "@/components/drivers/DriverForm";
import { notFound } from "next/navigation";

export default async function DriverEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const driver = await prisma.driver.findUnique({ where: { id }, include: { costItems: true } });
  if (!driver) notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Sofőr szerkesztése</h1>
      <DriverForm initial={driver} />
    </div>
  );
}
