/** Integer minor units. Never use binary floats for money or ownership. */

export function isSafeInt(value: number): boolean {
  return Number.isSafeInteger(value);
}

export function divRound(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error("Division by zero");
  const negative = (numerator < 0n) !== (denominator < 0n);
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const rounded = (n + d / 2n) / d;
  return negative ? -rounded : rounded;
}

export function bpsOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Number(divRound(BigInt(part) * 10000n, BigInt(whole)));
}

export function applyGrowth(baseMinor: number, growthBps: number, months: number): number {
  if (months <= 0) return baseMinor;
  let value = BigInt(baseMinor);
  const factor = 10000n + BigInt(growthBps);
  for (let i = 0; i < months; i += 1) value = (value * factor) / 10000n;
  return Number(value);
}

export function formatMoney(minor: number, currency = "GBP"): string {
  const sign = minor < 0 ? "−" : "";
  const abs = Math.abs(minor);
  const major = Math.trunc(abs / 100);
  const cents = (abs % 100).toString().padStart(2, "0");
  const body = major.toLocaleString("en-GB");
  const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency === "USD" ? "$" : `${currency} `;
  return `${sign}${symbol}${body}.${cents}`;
}

export function formatShares(value: number): string {
  return value.toLocaleString("en-GB");
}

export function formatBps(bps: number): string {
  const sign = bps < 0 ? "−" : "";
  const abs = Math.abs(bps);
  const whole = Math.trunc(abs / 100);
  const frac = (abs % 100).toString().padStart(2, "0");
  return `${sign}${whole}.${frac}%`;
}

export function poundsToMinor(pounds: number): number | null {
  if (!Number.isFinite(pounds)) return null;
  const minor = Math.round(pounds * 100);
  return Number.isSafeInteger(minor) ? minor : null;
}
