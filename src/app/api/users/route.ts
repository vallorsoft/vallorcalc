import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Csak ADMIN kezelhet felhasználókat
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const data = await req.json();

  const email = (data.email ?? "").trim().toLowerCase();
  const name = (data.name ?? "").trim();
  const password = data.password ?? "";
  const role = data.role === "ADMIN" ? "ADMIN" : "VIEWER";

  if (!name || !email || password.length < 6) {
    return NextResponse.json({ error: "Hiányzó adat vagy túl rövid jelszó (min. 6 karakter)." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Ez az email már foglalt." }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json(user);
}
