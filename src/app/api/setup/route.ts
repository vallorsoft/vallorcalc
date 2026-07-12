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
    message: "Admin felhasználó készen áll. Jelentkezz be: admin@vallor.ro / Admin1234!",
  });
}
