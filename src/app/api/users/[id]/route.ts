import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") return null;
  return session;
}

// Szerep vagy jelszó módosítása
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const data = await req.json();

  const update: { role?: "ADMIN" | "VIEWER"; passwordHash?: string } = {};
  if (data.role) update.role = data.role === "ADMIN" ? "ADMIN" : "VIEWER";
  if (data.password) {
    if (data.password.length < 6) return NextResponse.json({ error: "Túl rövid jelszó (min. 6)." }, { status: 400 });
    update.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: update,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  // Ne törölhesse magát, és maradjon legalább egy admin
  if ((session.user as { id: string }).id === id) {
    return NextResponse.json({ error: "Saját fiók nem törölhető." }, { status: 400 });
  }
  const target = await prisma.user.findUnique({ where: { id } });
  if (target?.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) return NextResponse.json({ error: "Az utolsó admin nem törölhető." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
