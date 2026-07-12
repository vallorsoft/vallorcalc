import { grossToNet, grossToVat, toNet } from "./vat";

export interface CostItem {
  name: string;
  basisType: "km" | "time";
  intervalKm?: number | null;
  intervalMonths?: number | null;
  amountLei: number;
  isGross: boolean;
}

export interface CalcInput {
  tripKm: number;
  tripDays: number;
  annualKmTarget: number;
  workingWeeksPerYear: number;

  truckCosts: CostItem[];
  trailerCosts: CostItem[];
  driverCosts: { name: string; amountLei: number; isGross: boolean }[];

  fuelMethod: "per_liter" | "fixed";
  fuelLiterPer100km?: number;
  fuelPricePerLiterGross?: number;
  fuelTotalGross?: number;

  excisaApplied: boolean;
  excisaDiscountLei?: number | null;
  excisaDiscountType?: string | null;

  fuelDiscountApplied: boolean;
  fuelDiscountLei?: number | null;
  fuelDiscountType?: string | null;

  tolls: { amountLei: number }[];

  activeTrucksCount: number;
  companyCosts: CostItem[];

  freightRevenueLei?: number | null;

  bnrEurLei: number;
}

export interface CostLine {
  name: string;
  netLei: number;
  vatLei: number;
  grossLei: number;
}

export interface CalcResult {
  lines: CostLine[];
  fuelNet: number;
  fuelVat: number;
  fuelGross: number;
  discountNet: number;
  tollNet: number;
  totalNet: number;
  totalVat: number;
  totalGross: number;
  totalNetEur: number;
  freightNet?: number;
  profitNet?: number;
  profitEur?: number;
}

function prorateCost(item: CostItem, tripKm: number, annualKm: number, tripWeeks: number, annualWeeks: number): number {
  const net = toNet(item.amountLei, item.isGross);
  if (item.basisType === "km") {
    const intervalKm = item.intervalKm ?? annualKm;
    return (tripKm / intervalKm) * net;
  } else {
    const intervalMonths = item.intervalMonths ?? 12;
    const intervalWeeks = intervalMonths * (annualWeeks / 12);
    return (tripWeeks / intervalWeeks) * net;
  }
}

export function calculate(input: CalcInput): CalcResult {
  const tripWeeks = input.tripDays / 7;
  const lines: CostLine[] = [];

  const addLine = (name: string, netLei: number) => {
    const vatLei = netLei * 0.21;
    lines.push({ name, netLei, vatLei, grossLei: netLei + vatLei });
  };

  for (const item of input.truckCosts) {
    const net = prorateCost(item, input.tripKm, input.annualKmTarget, tripWeeks, input.workingWeeksPerYear);
    if (net > 0) addLine(`Vontató – ${item.name}`, net);
  }

  for (const item of input.trailerCosts) {
    const net = prorateCost(item, input.tripKm, input.annualKmTarget, tripWeeks, input.workingWeeksPerYear);
    if (net > 0) addLine(`Pótkocsi – ${item.name}`, net);
  }

  for (const d of input.driverCosts) {
    const net = toNet(d.amountLei, d.isGross);
    const perWeek = net / input.workingWeeksPerYear;
    addLine(`Sofőr – ${d.name}`, perWeek * tripWeeks);
  }

  const companyCostPerTruck = input.companyCosts.map((item) => {
    const net = prorateCost(item, input.tripKm, input.annualKmTarget, tripWeeks, input.workingWeeksPerYear);
    return { name: item.name, net: net / input.activeTrucksCount };
  });
  for (const c of companyCostPerTruck) {
    if (c.net > 0) addLine(`Céges – ${c.name}`, c.net);
  }

  // Fuel
  let fuelGross = 0;
  if (input.fuelMethod === "per_liter" && input.fuelLiterPer100km && input.fuelPricePerLiterGross) {
    const liters = (input.tripKm / 100) * input.fuelLiterPer100km;
    fuelGross = liters * input.fuelPricePerLiterGross;
  } else if (input.fuelTotalGross) {
    fuelGross = input.fuelTotalGross;
  }
  const fuelNet = grossToNet(fuelGross);
  const fuelVat = grossToVat(fuelGross);

  // Discounts (reduce cost = negative)
  let discountNet = 0;
  if (input.excisaApplied && input.excisaDiscountLei) {
    discountNet += toNet(input.excisaDiscountLei, input.excisaDiscountType === "gross");
  }
  if (input.fuelDiscountApplied && input.fuelDiscountLei) {
    discountNet += toNet(input.fuelDiscountLei, input.fuelDiscountType === "gross");
  }

  // Tolls
  const tollNet = input.tolls.reduce((sum, t) => sum + grossToNet(t.amountLei), 0);

  const vehicleAndDriverNet = lines.reduce((s, l) => s + l.netLei, 0);
  const vehicleVat = lines.reduce((s, l) => s + l.vatLei, 0);

  const totalNet = vehicleAndDriverNet + fuelNet - discountNet + tollNet;
  const totalVat = vehicleVat + fuelVat;
  const totalGross = totalNet + totalVat;
  const totalNetEur = totalNet / input.bnrEurLei;

  let freightNet: number | undefined;
  let profitNet: number | undefined;
  let profitEur: number | undefined;
  if (input.freightRevenueLei != null) {
    freightNet = grossToNet(input.freightRevenueLei);
    profitNet = freightNet - totalNet;
    profitEur = profitNet / input.bnrEurLei;
  }

  return {
    lines,
    fuelNet,
    fuelVat,
    fuelGross,
    discountNet,
    tollNet,
    totalNet,
    totalVat,
    totalGross,
    totalNetEur,
    freightNet,
    profitNet,
    profitEur,
  };
}
