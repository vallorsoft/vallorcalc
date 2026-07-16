import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSerialNo } from "@/lib/serial";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const calc = await prisma.calculation.findUnique({
    where: { id },
    include: {
      truck: true,
      trailer: true,
      drivers: { include: { driver: true } },
      tolls: true,
    },
  });
  if (!calc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(calc);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.calculation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const data = await req.json();

  // Mentéskor egyedi sorszámot rendelünk hozzá (ha még nincs), így a régi
  // számítások megmaradnak, mindegyik saját dátum + sorszám azonosítót kap.
  let serialNo: string | undefined;
  if (data.save) {
    const existing = await prisma.calculation.findUnique({
      where: { id },
      select: { serialNo: true },
    });
    if (existing && !existing.serialNo) {
      serialNo = await generateSerialNo();
    }
  }

  const calc = await prisma.calculation.update({
    where: { id },
    data: {
      name: data.name,
      savedAt: data.save ? new Date() : null,
      ...(serialNo ? { serialNo } : {}),
    },
  });
  return NextResponse.json(calc);
}
