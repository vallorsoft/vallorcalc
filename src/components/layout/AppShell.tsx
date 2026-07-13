"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/calculations", label: "Kalkulátor", icon: "🧮" },
  { href: "/trucks", label: "Vontatók", icon: "🚛" },
  { href: "/trailers", label: "Pótkocsik", icon: "🚌" },
  { href: "/drivers", label: "Sofőrök", icon: "👤" },
  { href: "/settings", label: "Beállítások", icon: "⚙️", adminOnly: true },
  { href: "/users", label: "Felhasználók", icon: "👥", adminOnly: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = navItems.filter((n) => !n.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-1 rounded"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className="text-xl">☰</span>
          </button>
          <span className="font-bold text-lg">VállorCalc</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-blue-200 hidden sm:block">{session?.user?.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded-lg transition"
          >
            Kilépés
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <nav className="hidden md:flex flex-col w-52 bg-white border-r border-gray-200 pt-4 gap-1 px-2 shrink-0">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname.startsWith(item.href)
                  ? "bg-blue-50 text-blue-800"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="w-56 bg-white shadow-xl flex flex-col pt-4 gap-1 px-2">
              <div className="px-3 py-2 font-bold text-blue-900 mb-2">Menü</div>
              {visibleNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    pathname.startsWith(item.href)
                      ? "bg-blue-50 text-blue-800"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex-1 bg-black/30" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-20">
        {visibleNav.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition ${
              pathname.startsWith(item.href) ? "text-blue-700" : "text-gray-500"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="md:hidden h-16" />
    </div>
  );
}
