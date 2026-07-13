import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const trailers = await prisma.trailer.findMany({
    include: { costItems: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(trailers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const data = await req.json();
  const trailer = await prisma.trailer.create({
    data: {
      name: data.name,
      licensePlate: data.licensePlate,
      year: data.year ?? null,
      notes: data.notes ?? null,
      costItems: data.costItems
        ? {
            create: data.costItems.map((c: {
              name: string;
              basisType: string;
              intervalKm?: number;
              intervalMonths?: number;
              amountLei: number;
              vatApplicable: boolean;
              notes?: string;
            }) => ({
              name: c.name,
              basisType: c.basisType,
              intervalKm: c.intervalKm ?? null,
              intervalMonths: c.intervalMonths ?? null,
              amountLei: c.amountLei,
              vatApplicable: c.vatApplicable ?? false,
              notes: c.notes ?? null,
            })),
          }
        : undefined,
    },
    include: { costItems: true },
  });
  return NextResponse.json(trailer);
}
