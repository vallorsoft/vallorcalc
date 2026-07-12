import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const data = await req.json();
  await prisma.driverCostItem.deleteMany({ where: { driverId: id } });
  const driver = await prisma.driver.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone ?? null,
      licenseNumber: data.licenseNumber ?? null,
      licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : null,
      notes: data.notes ?? null,
      costItems: data.costItems
        ? {
            create: data.costItems.map((c: { name: string; amountLei: number; isGross: boolean }) => ({
              name: c.name,
              amountLei: c.amountLei,
              isGross: c.isGross,
            })),
          }
        : undefined,
    },
    include: { costItems: true },
  });
  return NextResponse.json(driver);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.driver.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
