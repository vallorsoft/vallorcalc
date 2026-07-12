import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const truck = await prisma.truck.findUnique({ where: { id }, include: { costItems: true } });
  if (!truck) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(truck);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const data = await req.json();
  await prisma.truckCostItem.deleteMany({ where: { truckId: id } });
  const truck = await prisma.truck.update({
    where: { id },
    data: {
      name: data.name,
      licensePlate: data.licensePlate,
      year: data.year ?? null,
      notes: data.notes ?? null,
      active: data.active ?? true,
      costItems: data.costItems
        ? {
            create: data.costItems.map((c: {
              name: string;
              basisType: string;
              intervalKm?: number;
              intervalMonths?: number;
              amountLei: number;
              isGross: boolean;
              notes?: string;
            }) => ({
              name: c.name,
              basisType: c.basisType,
              intervalKm: c.intervalKm ?? null,
              intervalMonths: c.intervalMonths ?? null,
              amountLei: c.amountLei,
              isGross: c.isGross,
              notes: c.notes ?? null,
            })),
          }
        : undefined,
    },
    include: { costItems: true },
  });
  return NextResponse.json(truck);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.truck.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
