export const VAT_RATE = 0.21;

export function grossToNet(gross: number): number {
  return gross * 100 / 121;
}

export function grossToVat(gross: number): number {
  return gross * 21 / 121;
}

export function netToGross(net: number): number {
  return net * 1.21;
}

export function netToVat(net: number): number {
  return net * VAT_RATE;
}

export function toNet(amount: number, isGross: boolean): number {
  return isGross ? grossToNet(amount) : amount;
}

export function toGross(amount: number, isGross: boolean): number {
  return isGross ? amount : netToGross(amount);
}
