export async function getBnrRate(): Promise<number> {
  try {
    const res = await fetch(
      "https://www.bnr.ro/nbrfxrates.xml",
      { next: { revalidate: 3600 } }
    );
    const text = await res.text();
    const match = text.match(/<Rate currency="EUR">([\d.]+)<\/Rate>/);
    if (match) return parseFloat(match[1]);
  } catch {
    // fall through to default
  }
  return 5.1;
}
