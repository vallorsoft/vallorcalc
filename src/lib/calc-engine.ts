import { grossToNet, grossToVat, toNet } from "./vat";

export interface CostItem {
  name: string;
  basisType: "km" | "time";
  intervalKm?: number | null;
  intervalMonths?: number | null;
  amountLei: number; // mindig nettó érték
  vatApplicable: boolean; // rászámítunk-e 21% TVA-t
}

export type DriverBasisType = "monthly" | "yearly" | "per_day" | "per_km";

export interface DriverCost {
  name: string;
  /** Nettó összeg a `currency` pénznemben; EUR esetén a bnrEurLei árfolyammal váltjuk LEI-re. */
  amountLei: number;
  vatApplicable: boolean;
  basisType: DriverBasisType;
  currency?: "lei" | "eur";
}

export interface CalcInput {
  tripKm: number;
  tripDays: number;
  annualKmTarget: number;
  workingWeeksPerYear: number;
  /** Fő beállítás: hány héttel számoljuk egy hónapot (idő-alapú tételek arányosításához). */
  weeksPerMonth: number;
  /** Napidíj (per_day) tételek napjainak száma; ha nincs megadva, a tripDays-t használjuk. */
  perDiemDays?: number | null;

  truckCosts: CostItem[];
  trailerCosts: CostItem[];
  driverCosts: DriverCost[];

  fuelMethod: "per_liter" | "fixed";
  fuelLiterPer100km?: number;
  fuelPricePerLiterGross?: number;
  fuelTotalGross?: number;
  fuelLiters?: number | null; // fix módban megadható a tankolt liter a kedvezményhez

  // A kedvezmények literenkénti értékek (LEI/liter), a felhasznált literrel szorozva
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

export interface CategoryTotal {
  net: number;
  vat: number;
}

export interface CalcResult {
  lines: CostLine[];
  categoryTotals: {
    truck: CategoryTotal;
    trailer: CategoryTotal;
    driver: CategoryTotal;
    company: CategoryTotal;
  };
  fuelNet: number;
  fuelVat: number;
  fuelGross: number;
  liters: number;
  excisaDiscountNet: number;
  fuelDiscountNet: number;
  discountNet: number;
  tollNet: number;
  totalNet: number;
  totalVat: number;
  totalGross: number;
  totalNetEur: number;
  totalGrossEur: number;
  freightNet?: number;
  profitNet?: number;
  profitEur?: number;
}

// Az amountLei mindig nettó; itt csak arányosítunk
function prorateCost(item: CostItem, tripKm: number, annualKm: number, tripWeeks: number, weeksPerMonth: number): number {
  const net = item.amountLei;
  if (item.basisType === "km") {
    const intervalKm = item.intervalKm ?? annualKm;
    return (tripKm / intervalKm) * net;
  } else {
    // Idő-alapú: az összeg intervalMonths hónapra vonatkozik; egy hónap = weeksPerMonth hét.
    const intervalMonths = item.intervalMonths ?? 12;
    const intervalWeeks = intervalMonths * weeksPerMonth;
    return (tripWeeks / intervalWeeks) * net;
  }
}

export function calculate(input: CalcInput): CalcResult {
  const tripWeeks = input.tripDays / 7;
  const lines: CostLine[] = [];

  // Kategória-összesítők (nettó + TVA)
  const cat = {
    truck: { net: 0, vat: 0 },
    trailer: { net: 0, vat: 0 },
    driver: { net: 0, vat: 0 },
    company: { net: 0, vat: 0 },
  };

  // TVA csak akkor, ha a tétel TVA-köteles; különben 0
  const addLine = (name: string, netLei: number, vatApplicable: boolean, category: keyof typeof cat) => {
    const vatLei = vatApplicable ? netLei * 0.21 : 0;
    lines.push({ name, netLei, vatLei, grossLei: netLei + vatLei });
    cat[category].net += netLei;
    cat[category].vat += vatLei;
  };

  for (const item of input.truckCosts) {
    const net = prorateCost(item, input.tripKm, input.annualKmTarget, tripWeeks, input.weeksPerMonth);
    if (net > 0) addLine(`Vontató – ${item.name}`, net, item.vatApplicable, "truck");
  }

  for (const item of input.trailerCosts) {
    const net = prorateCost(item, input.tripKm, input.annualKmTarget, tripWeeks, input.weeksPerMonth);
    if (net > 0) addLine(`Pótkocsi – ${item.name}`, net, item.vatApplicable, "trailer");
  }

  const perDiemDays = input.perDiemDays != null && input.perDiemDays > 0 ? input.perDiemDays : input.tripDays;
  for (const d of input.driverCosts) {
    // EUR-ban megadott (nettó) tétel átváltása LEI-re a kalkuláció árfolyamával
    const net = d.currency === "eur" ? d.amountLei * input.bnrEurLei : d.amountLei;
    let lineNet: number;
    if (d.basisType === "per_day") {
      // Napidíj: a megadott napok számával szorozzuk
      lineNet = net * perDiemDays;
    } else if (d.basisType === "per_km") {
      // Kilométer díjazás: a kalkulált kilométerek számával szorozzuk
      lineNet = net * input.tripKm;
    } else if (d.basisType === "yearly") {
      // Éves fizetés: 12 hónap = 12 * weeksPerMonth hét
      lineNet = (net / (12 * input.weeksPerMonth)) * tripWeeks;
    } else {
      // Havi fizetés: egy hónap = weeksPerMonth hét
      lineNet = (net / input.weeksPerMonth) * tripWeeks;
    }
    addLine(`Sofőr – ${d.name}`, lineNet, d.vatApplicable, "driver");
  }

  const companyCostPerTruck = input.companyCosts.map((item) => {
    const net = prorateCost(item, input.tripKm, input.annualKmTarget, tripWeeks, input.weeksPerMonth);
    return { name: item.name, net: net / input.activeTrucksCount, vatApplicable: item.vatApplicable };
  });
  for (const c of companyCostPerTruck) {
    if (c.net > 0) addLine(`Céges – ${c.name}`, c.net, c.vatApplicable, "company");
  }

  // Fuel + a felhasznált liter (a literenkénti kedvezményekhez)
  let fuelGross = 0;
  let liters = 0;
  if (input.fuelMethod === "per_liter" && input.fuelLiterPer100km && input.fuelPricePerLiterGross) {
    liters = (input.tripKm / 100) * input.fuelLiterPer100km;
    fuelGross = liters * input.fuelPricePerLiterGross;
  } else if (input.fuelTotalGross) {
    fuelGross = input.fuelTotalGross;
    // Fix módban: ha megadták a tankolt litert, azt használjuk; különben a diesel árból számoljuk
    if (input.fuelLiters && input.fuelLiters > 0) {
      liters = input.fuelLiters;
    } else if (input.fuelPricePerLiterGross && input.fuelPricePerLiterGross > 0) {
      liters = fuelGross / input.fuelPricePerLiterGross;
    }
  }
  const fuelNet = grossToNet(fuelGross);
  const fuelVat = grossToVat(fuelGross);

  // Kedvezmények: literenkénti érték (LEI/liter) × felhasznált liter (költséget csökkent)
  let excisaDiscountNet = 0;
  let fuelDiscountNet = 0;
  if (input.excisaApplied && input.excisaDiscountLei && liters > 0) {
    const amount = input.excisaDiscountLei * liters;
    excisaDiscountNet = toNet(amount, input.excisaDiscountType === "gross");
  }
  if (input.fuelDiscountApplied && input.fuelDiscountLei && liters > 0) {
    const amount = input.fuelDiscountLei * liters;
    fuelDiscountNet = toNet(amount, input.fuelDiscountType === "gross");
  }
  const discountNet = excisaDiscountNet + fuelDiscountNet;

  // Tolls
  const tollNet = input.tolls.reduce((sum, t) => sum + grossToNet(t.amountLei), 0);

  const vehicleAndDriverNet = lines.reduce((s, l) => s + l.netLei, 0);
  const vehicleVat = lines.reduce((s, l) => s + l.vatLei, 0);

  const totalNet = vehicleAndDriverNet + fuelNet - discountNet + tollNet;
  const totalVat = vehicleVat + fuelVat;
  const totalGross = totalNet + totalVat;
  const totalNetEur = totalNet / input.bnrEurLei;
  const totalGrossEur = totalGross / input.bnrEurLei;

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
    categoryTotals: cat,
    fuelNet,
    fuelVat,
    fuelGross,
    liters,
    excisaDiscountNet,
    fuelDiscountNet,
    discountNet,
    tollNet,
    totalNet,
    totalVat,
    totalGross,
    totalNetEur,
    totalGrossEur,
    freightNet,
    profitNet,
    profitEur,
  };
}
