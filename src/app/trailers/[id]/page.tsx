import { prisma } from "@/lib/prisma";
import { TrailerForm } from "@/components/trailers/TrailerForm";
import { notFound } from "next/navigation";

export default async function TrailerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trailer = await prisma.trailer.findUnique({ where: { id }, include: { costItems: true } });
  if (!trailer) notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Pótkocsi szerkesztése</h1>
      <TrailerForm initial={trailer} />
    </div>
  );
}
