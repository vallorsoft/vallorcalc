import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VállorCalc – Kamion Kalkulátor",
  description: "Belső fuvarköltség-kalkulátor",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "VállorCalc" },
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" className="h-full">
      <body className={`${geist.className} h-full bg-gray-50`}>
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
