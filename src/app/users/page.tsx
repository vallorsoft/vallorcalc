export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UsersManager } from "@/components/users/UsersManager";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const currentUserId = (session!.user as { id: string }).id;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Felhasználók</h1>
      <UsersManager
        initialUsers={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        currentUserId={currentUserId}
      />
    </div>
  );
}
