export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Egyszeri beállító végpont az admin felhasználó létrehozásához/visszaállításához.
// Használat után eltávolítandó.
const SETUP_KEY = "vallor-setup-2026";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== SETUP_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Séma-frissítés: vatApplicable oszlopok hozzáadása (ha még nincsenek)
  const alters = [
    `ALTER TABLE "TruckCostItem" ADD COLUMN IF NOT EXISTS "vatApplicable" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "TrailerCostItem" ADD COLUMN IF NOT EXISTS "vatApplicable" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "DriverCostItem" ADD COLUMN IF NOT EXISTS "vatApplicable" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "CompanyCostItem" ADD COLUMN IF NOT EXISTS "vatApplicable" BOOLEAN NOT NULL DEFAULT false`,
  ];
  for (const sql of alters) {
    await prisma.$executeRawUnsafe(sql);
  }

  const email = "admin@vallor.ro";
  const password = "Admin1234!";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN" },
    create: { email, name: "Admin", passwordHash, role: "ADMIN" },
  });

  // Biztosítjuk a SystemSettings singletont is
  await prisma.systemSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  return NextResponse.json({
    ok: true,
    email: user.email,
    role: user.role,
    schema: "vatApplicable oszlopok rendben",
    message: "Admin felhasználó készen áll. Jelentkezz be: admin@vallor.ro / Admin1234!",
  });
}
