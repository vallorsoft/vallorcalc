import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pairings = await prisma.vehiclePairing.findMany({
    include: {
      truck: true,
      trailer: true,
      drivers: { include: { driver: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(pairings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const pairing = await prisma.vehiclePairing.create({
    data: {
      name: data.name,
      truckId: data.truckId,
      trailerId: data.trailerId,
      drivers: data.driverIds
        ? {
            create: data.driverIds.map((did: string) => ({ driverId: did })),
          }
        : undefined,
    },
    include: {
      truck: true,
      trailer: true,
      drivers: { include: { driver: true } },
    },
  });
  return NextResponse.json(pairing);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await prisma.vehiclePairing.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
