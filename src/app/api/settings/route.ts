import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const s = await prisma.systemSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
  return NextResponse.json(s);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const data = await req.json();
  const s = await prisma.systemSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      annualKmTarget: data.annualKmTarget,
      workingWeeksPerYear: data.workingWeeksPerYear,
      excisaDiscountLei: data.excisaDiscountLei ?? null,
      excisaDiscountType: data.excisaDiscountType ?? null,
      fuelDiscountLei: data.fuelDiscountLei ?? null,
      fuelDiscountType: data.fuelDiscountType ?? null,
    },
    update: {
      annualKmTarget: data.annualKmTarget,
      workingWeeksPerYear: data.workingWeeksPerYear,
      excisaDiscountLei: data.excisaDiscountLei ?? null,
      excisaDiscountType: data.excisaDiscountType ?? null,
      fuelDiscountLei: data.fuelDiscountLei ?? null,
      fuelDiscountType: data.fuelDiscountType ?? null,
    },
  });
  return NextResponse.json(s);
}
