import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "ADMIN") redirect("/dashboard");

  const [settings, companyCosts] = await Promise.all([
    prisma.systemSettings.upsert({ where: { id: "singleton" }, create: { id: "singleton" }, update: {} }),
    prisma.companyCostItem.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Beállítások</h1>
      <SettingsForm initial={settings} companyCosts={companyCosts} />
    </div>
  );
}
