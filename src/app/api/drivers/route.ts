import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const drivers = await prisma.driver.findMany({
    where: { active: true },
    include: { costItems: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(drivers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const data = await req.json();
  const driver = await prisma.driver.create({
    data: {
      name: data.name,
      phone: data.phone ?? null,
      licenseNumber: data.licenseNumber ?? null,
      licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : null,
      notes: data.notes ?? null,
      costItems: data.costItems
        ? {
            create: data.costItems.map((c: { name: string; amountLei: number; vatApplicable: boolean }) => ({
              name: c.name,
              amountLei: c.amountLei,
              vatApplicable: c.vatApplicable ?? false,
            })),
          }
        : undefined,
    },
    include: { costItems: true },
  });
  return NextResponse.json(driver);
}
