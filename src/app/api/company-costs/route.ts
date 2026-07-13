import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.companyCostItem.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const data = await req.json();
  const item = await prisma.companyCostItem.create({
    data: {
      name: data.name,
      amountLei: data.amountLei,
      vatApplicable: data.vatApplicable ?? false,
      basisType: data.basisType ?? "time",
      intervalMonths: data.intervalMonths ?? 12,
    },
  });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const data = await req.json();
  const item = await prisma.companyCostItem.update({
    where: { id: data.id },
    data: {
      name: data.name,
      amountLei: data.amountLei,
      vatApplicable: data.vatApplicable ?? false,
      basisType: data.basisType ?? "time",
      intervalMonths: data.intervalMonths ?? 12,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await req.json();
  await prisma.companyCostItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
