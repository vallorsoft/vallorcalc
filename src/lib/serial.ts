import { prisma } from "./prisma";
import { netToGross } from "./vat";

/**
 * Egyedi sorszám generálása dátum alapján + napi sorszám.
 * Formátum: YYYYMMDD-NNN (pl. 20260716-001)
 */
export async function generateSerialNo(date = new Date()): Promise<string> {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const datePart = `${y}${m}${d}`;

  // Retry a néhány párhuzamos mentés miatt (serialNo @unique).
  for (let attempt = 0; attempt < 25; attempt++) {
    const count = await prisma.calculation.count({
      where: { serialNo: { startsWith: `${datePart}-` } },
    });
    const candidate = `${datePart}-${String(count + 1 + attempt).padStart(3, "0")}`;
    const existing = await prisma.calculation.findUnique({ where: { serialNo: candidate } });
    if (!existing) return candidate;
  }
  // Végső fallback: időbélyeggel biztosan egyedi.
  return `${datePart}-${Date.now()}`;
}

/**
 * A megadott bevételi mezőkből kiszámolja a bruttó LEI és EUR értéket.
 * A bevétel lehet nettó vagy bruttó, LEI-ben vagy EUR-ban megadva.
 */
export function computeFreightRevenue(
  amount: number | null | undefined,
  currency: string | null | undefined,
  isGross: boolean,
  bnrEurLei: number
): { grossLei: number | null; grossEur: number | null } {
  if (amount == null || isNaN(amount)) return { grossLei: null, grossEur: null };
  const amountLei = currency === "eur" ? amount * bnrEurLei : amount;
  const grossLei = isGross ? amountLei : netToGross(amountLei);
  const grossEur = bnrEurLei ? grossLei / bnrEurLei : 0;
  return { grossLei, grossEur };
}
