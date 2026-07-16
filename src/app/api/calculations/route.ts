import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculate, CalcInput } from "@/lib/calc-engine";
import { generateSerialNo, computeFreightRevenue } from "@/lib/serial";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const calcs = await prisma.calculation.findMany({
    where: { savedAt: { not: null } },
    include: {
      truck: { select: { name: true, licensePlate: true } },
      trailer: { select: { name: true, licensePlate: true } },
      drivers: { include: { driver: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(calcs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const data = await req.json();

  const [truck, trailer, drivers, settings, companyCosts] = await Promise.all([
    prisma.truck.findUnique({ where: { id: data.truckId }, include: { costItems: true } }),
    prisma.trailer.findUnique({ where: { id: data.trailerId }, include: { costItems: true } }),
    prisma.driver.findMany({ where: { id: { in: data.driverIds ?? [] } }, include: { costItems: true } }),
    prisma.systemSettings.upsert({ where: { id: "singleton" }, create: { id: "singleton" }, update: {} }),
    prisma.companyCostItem.findMany(),
  ]);

  if (!truck || !trailer) return NextResponse.json({ error: "Vehicle not found" }, { status: 400 });

  // Bevétel: nettó/bruttó összeg, LEI vagy EUR pénznemben.
  const freightIsGross = data.freightRevenueIsGross ?? true;
  const freightAmount =
    data.freightRevenueAmount != null && data.freightRevenueAmount !== ""
      ? Number(data.freightRevenueAmount)
      : null;
  const { grossLei: freightGrossLei, grossEur: freightGrossEur } = computeFreightRevenue(
    freightAmount,
    data.freightRevenueCurrency,
    freightIsGross,
    data.bnrEurLei
  );

  const driverCosts = drivers.flatMap((d) =>
    d.costItems.map((ci) => ({ name: `${d.name} – ${ci.name}`, amountLei: ci.amountLei, isGross: ci.isGross }))
  );

  const input: CalcInput = {
    tripKm: data.tripKm,
    tripDays: data.tripDays,
    annualKmTarget: settings.annualKmTarget,
    workingWeeksPerYear: settings.workingWeeksPerYear,
    truckCosts: truck.costItems.map((c) => ({
      name: c.name,
      basisType: c.basisType as "km" | "time",
      intervalKm: c.intervalKm,
      intervalMonths: c.intervalMonths,
      amountLei: c.amountLei,
      isGross: c.isGross,
    })),
    trailerCosts: trailer.costItems.map((c) => ({
      name: c.name,
      basisType: c.basisType as "km" | "time",
      intervalKm: c.intervalKm,
      intervalMonths: c.intervalMonths,
      amountLei: c.amountLei,
      isGross: c.isGross,
    })),
    driverCosts,
    fuelMethod: data.fuelMethod,
    fuelLiterPer100km: data.fuelLiterPer100km,
    fuelPricePerLiterGross: data.fuelPricePerLiterGross,
    fuelTotalGross: data.fuelTotalGross,
    excisaApplied: data.excisaApplied ?? false,
    excisaDiscountLei: settings.excisaDiscountLei,
    excisaDiscountType: settings.excisaDiscountType,
    fuelDiscountApplied: data.fuelDiscountApplied ?? false,
    fuelDiscountLei: settings.fuelDiscountLei,
    fuelDiscountType: settings.fuelDiscountType,
    tolls: (data.tolls ?? []).map((t: { inputCurrency: string; amountLei?: number; amountEur?: number }) => ({
      amountLei:
        t.inputCurrency === "eur"
          ? (t.amountEur ?? 0) * data.bnrEurLei
          : (t.amountLei ?? 0),
    })),
    activeTrucksCount: data.activeTrucksCount ?? 1,
    companyCosts: companyCosts.map((c) => ({
      name: c.name,
      basisType: c.basisType as "km" | "time",
      intervalKm: undefined,
      intervalMonths: c.intervalMonths,
      amountLei: c.amountLei,
      isGross: c.isGross,
    })),
    freightRevenueLei: freightGrossLei,
    bnrEurLei: data.bnrEurLei,
  };

  const result = calculate(input);

  const serialNo = data.save ? await generateSerialNo() : null;

  const calc = await prisma.calculation.create({
    data: {
      name: data.name ?? null,
      createdById: userId,
      truckId: data.truckId,
      trailerId: data.trailerId,
      drivers: { create: (data.driverIds ?? []).map((did: string) => ({ driverId: did })) },
      startDate: new Date(data.startDate),
      tripDays: data.tripDays,
      tripKm: data.tripKm,
      fuelMethod: data.fuelMethod,
      fuelLiterPer100km: data.fuelLiterPer100km ?? null,
      fuelPricePerLiterGross: data.fuelPricePerLiterGross ?? null,
      fuelTotalGross: data.fuelTotalGross ?? null,
      excisaApplied: data.excisaApplied ?? false,
      fuelDiscountApplied: data.fuelDiscountApplied ?? false,
      tolls: {
        create: (data.tolls ?? []).map((t: { description?: string; inputCurrency: string; amountLei?: number; amountEur?: number }) => ({
          description: t.description ?? null,
          amountLei: t.inputCurrency === "lei" ? (t.amountLei ?? null) : null,
          amountEur: t.inputCurrency === "eur" ? (t.amountEur ?? null) : null,
          inputCurrency: t.inputCurrency,
        })),
      },
      activeTrucksCount: data.activeTrucksCount ?? 1,
      freightRevenueLei: freightGrossLei,
      freightRevenueEur: freightGrossEur,
      freightRevenueInput: freightAmount,
      freightRevenueCurrency: freightAmount != null ? (data.freightRevenueCurrency ?? "lei") : null,
      freightRevenueIsGross: freightIsGross,
      serialNo,
      bnrEurLei: data.bnrEurLei,
      resultJson: JSON.parse(JSON.stringify(result)),
      savedAt: data.save ? new Date() : null,
    },
    include: {
      truck: { select: { name: true, licensePlate: true } },
      trailer: { select: { name: true, licensePlate: true } },
      drivers: { include: { driver: { select: { name: true } } } },
    },
  });

  return NextResponse.json({ calc, result });
}
