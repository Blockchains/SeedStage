import { applyGrowth, isSafeInt } from "./money.ts";

export const CASH_ENGINE = "cash-bridge-1";

export type PlanAssumptions = {
  currency: string;
  horizonMonths: number;
  openingCashMinor: number;
  bufferMinor: number;
  startingReceiptsMinor: number;
  receiptGrowthBps: number;
  confirmedThroughMonth: number;
  receiptDelayMonths: number;
  payrollMinor: number;
  opexMinor: number;
  hiringStartMonth: number;
  hiringExtraMinor: number;
  hiringDelayMonths: number;
  financingMonth: number | null;
  financingAmountMinor: number;
};

export type BridgeRow = {
  index: number;
  label: string;
  openingMinor: number;
  receiptsConfirmedMinor: number;
  receiptsAssumedMinor: number;
  financingMinor: number;
  payrollMinor: number;
  opexMinor: number;
  closingMinor: number;
  belowBuffer: boolean;
  negative: boolean;
};

export type PlanOutput = {
  ok: true;
  engine: typeof CASH_ENGINE;
  rows: BridgeRow[];
  runwayMonths: number | null;
  runwayNote: string;
  minClosingMinor: number;
  firstShortfallIndex: number | null;
  usesAverageBurn: false;
  notes: string[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function labelFor(index: number): string {
  return `M${index + 1} ${MONTHS[index % 12]}`;
}

export function projectPlan(input: PlanAssumptions): PlanOutput | { ok: false; reason: string } {
  const numbers = [
    input.horizonMonths,
    input.openingCashMinor,
    input.bufferMinor,
    input.startingReceiptsMinor,
    input.receiptGrowthBps,
    input.confirmedThroughMonth,
    input.receiptDelayMonths,
    input.payrollMinor,
    input.opexMinor,
    input.hiringStartMonth,
    input.hiringExtraMinor,
    input.hiringDelayMonths,
    input.financingAmountMinor,
  ];
  if (numbers.some((n) => !isSafeInt(n))) return { ok: false, reason: "Assumptions must be whole numbers." };
  if (input.horizonMonths < 0 || input.horizonMonths > 60) return { ok: false, reason: "Horizon must be 0–60 months." };
  if (input.receiptDelayMonths < 0 || input.hiringDelayMonths < 0) return { ok: false, reason: "Delays cannot be negative." };

  const notes = [
    `${CASH_ENGINE}. Runway walks the monthly bridge. It is not cash divided by average burn.`,
    "Confirmed receipts and assumed receipts are kept in separate columns.",
  ];
  if (input.horizonMonths === 0) {
    return {
      ok: true,
      engine: CASH_ENGINE,
      rows: [],
      runwayMonths: null,
      runwayNote: "No months were modelled.",
      minClosingMinor: input.openingCashMinor,
      firstShortfallIndex: null,
      usesAverageBurn: false,
      notes,
    };
  }

  const rows: BridgeRow[] = [];
  let opening = input.openingCashMinor;
  let minClosing = opening;
  let firstShortfall: number | null = null;
  const hireFrom = input.hiringStartMonth + input.hiringDelayMonths;

  for (let i = 0; i < input.horizonMonths; i += 1) {
    const sourceMonth = i - input.receiptDelayMonths;
    const grown = sourceMonth < 0 ? 0 : applyGrowth(input.startingReceiptsMinor, input.receiptGrowthBps, sourceMonth);
    const confirmed = sourceMonth >= 0 && sourceMonth < input.confirmedThroughMonth ? grown : 0;
    const assumed = sourceMonth >= input.confirmedThroughMonth ? grown : 0;
    const payroll = input.payrollMinor + (i >= hireFrom ? input.hiringExtraMinor : 0);
    const financing = input.financingMonth === i ? input.financingAmountMinor : 0;
    const closing = opening + confirmed + assumed + financing - payroll - input.opexMinor;
    const below = closing < input.bufferMinor;
    if (below && firstShortfall === null) firstShortfall = i;
    if (closing < minClosing) minClosing = closing;
    rows.push({
      index: i,
      label: labelFor(i),
      openingMinor: opening,
      receiptsConfirmedMinor: confirmed,
      receiptsAssumedMinor: assumed,
      financingMinor: financing,
      payrollMinor: payroll,
      opexMinor: input.opexMinor,
      closingMinor: closing,
      belowBuffer: below,
      negative: closing < 0,
    });
    opening = closing;
  }

  const runwayMonths = firstShortfall;
  const runwayNote =
    firstShortfall === null
      ? "Closing cash stays at or above the buffer for every modelled month. That is not a statement about months beyond the horizon."
      : firstShortfall === 0
        ? "Closing cash is already under the buffer in the first month."
        : `Closing cash stays at or above the buffer for ${firstShortfall} month(s), then falls short.`;

  return {
    ok: true,
    engine: CASH_ENGINE,
    rows,
    runwayMonths,
    runwayNote,
    minClosingMinor: minClosing,
    firstShortfallIndex: firstShortfall,
    usesAverageBurn: false,
    notes,
  };
}

/** Smallest financing, landed in `closeMonth`, that keeps every closing balance at or above the buffer. */
export function suggestedRaise(input: PlanAssumptions, closeMonth: number): { amountMinor: number | null; note: string } {
  if (closeMonth < 0 || closeMonth >= input.horizonMonths) {
    return { amountMinor: null, note: "Choose a closing month inside the horizon." };
  }
  const cap = 2_000_000_000;
  const trial = (amount: number) =>
    projectPlan({ ...input, financingMonth: closeMonth, financingAmountMinor: amount });
  const baseline = trial(0);
  if (!baseline.ok) return { amountMinor: null, note: baseline.reason };
  if (baseline.firstShortfallIndex === null) {
    return { amountMinor: 0, note: "Under these assumptions the buffer is never breached. Suggested new cash is zero." };
  }
  let low = 0;
  let high = cap;
  let best: number | null = null;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const result = trial(mid);
    if (!result.ok) return { amountMinor: null, note: result.reason };
    if (result.firstShortfallIndex === null) {
      best = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  if (best === null) {
    return { amountMinor: null, note: "No raise up to £20,000,000 keeps cash above the buffer. Change the plan, not just the round size." };
  }
  return {
    amountMinor: best,
    note: "Smallest whole minor-unit amount, landed in the chosen month, that keeps every modelled closing balance at or above the buffer. Receipts after the confirmed window are assumptions.",
  };
}
