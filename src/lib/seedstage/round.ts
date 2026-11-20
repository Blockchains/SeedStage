import { bpsOf, divRound, isSafeInt } from "./money.ts";

export const ROUND_ENGINE = "priced-equity-1";

export type PoolMechanic = "pre-money-pool" | "post-money-pool";

export type RoundInput = {
  name: string;
  currency: string;
  preMoneyMinor: number;
  investmentMinor: number;
  existingShares: number;
  unallocatedShares: number;
  targetPoolBps: number;
  mechanic: PoolMechanic;
};

export type RoundOk = {
  ok: true;
  engine: typeof ROUND_ENGINE;
  input: RoundInput;
  postMoneyMinor: number;
  totalShares: number;
  investorShares: number;
  poolTopUp: number;
  unallocatedAfter: number;
  holderShares: number;
  residualShares: number;
  proceedsMinor: number;
  proceedsDeltaMinor: number;
  investorBps: number;
  holderBps: number;
  poolBps: number;
  targetInvestorBps: number;
  priceNumerator: string;
  priceDenominator: string;
  trace: string[];
};

export type RoundResult = RoundOk | { ok: false; engine: typeof ROUND_ENGINE; reason: string };

export const GOLDEN_ROUND: RoundInput = {
  name: "Golden priced round",
  currency: "GBP",
  preMoneyMinor: 600_000_000,
  investmentMinor: 120_000_000,
  existingShares: 8_000_000,
  unallocatedShares: 500_000,
  targetPoolBps: 1000,
  mechanic: "pre-money-pool",
};

function fail(reason: string): RoundResult {
  return { ok: false, engine: ROUND_ENGINE, reason };
}

function assertInputs(input: RoundInput): string | null {
  const ints = [
    input.preMoneyMinor,
    input.investmentMinor,
    input.existingShares,
    input.unallocatedShares,
    input.targetPoolBps,
  ];
  if (ints.some((n) => !isSafeInt(n))) return "Every figure must be a whole number of minor units or shares.";
  if (!input.currency.trim()) return "Currency is required.";
  if (input.preMoneyMinor <= 0) return "Pre-money valuation must be positive.";
  if (input.investmentMinor < 0) return "Investment cannot be negative.";
  if (input.existingShares <= 0) return "Existing fully diluted shares must be positive.";
  if (input.unallocatedShares < 0) return "Unallocated pool cannot be negative.";
  if (input.unallocatedShares > input.existingShares) return "Unallocated pool cannot exceed existing shares.";
  if (input.targetPoolBps < 0 || input.targetPoolBps >= 10000) return "Target pool must be between 0% and 100%, exclusive of 100%.";
  if (input.mechanic !== "pre-money-pool" && input.mechanic !== "post-money-pool") {
    return "Unsupported instrument. Only priced equity with an explicit pool mechanic is enabled.";
  }
  return null;
}

export function modelPricedRound(input: RoundInput): RoundResult {
  const problem = assertInputs(input);
  if (problem) return fail(problem);

  const pre = BigInt(input.preMoneyMinor);
  const inv = BigInt(input.investmentMinor);
  const existing = BigInt(input.existingShares);
  const unallocated = BigInt(input.unallocatedShares);
  const holders = existing - unallocated;
  const bps = BigInt(input.targetPoolBps);
  const post = pre + inv;
  const trace: string[] = [
    `Engine ${ROUND_ENGINE}. Currency ${input.currency}. Mechanic ${input.mechanic}.`,
    "This is scenario modelling, not a price opinion or a term-sheet generator.",
    `Pre-money ${input.preMoneyMinor} minor + investment ${input.investmentMinor} minor = post-money ${post.toString()} minor.`,
    `Existing fully diluted ${existing.toString()}, of which unallocated pool ${unallocated.toString()} and holders ${holders.toString()}.`,
  ];

  if (inv === 0n) {
    trace.push("Zero investment: no new shares are issued and the pool is left unchanged.");
    return pack(input, {
      post,
      total: existing,
      investor: 0n,
      topUp: 0n,
      unallocated,
      holders,
      residual: 0n,
      proceeds: 0n,
      priceNum: pre,
      priceDen: existing,
      trace,
    });
  }

  if (input.mechanic === "pre-money-pool") {
    const poolSlice = divRound(post * bps, 10000n);
    const available = post - inv - poolSlice;
    trace.push(
      `Pre-money pool: target unallocated pool is ${input.targetPoolBps} bps of post-money. Pool slice of post-money value is ${poolSlice.toString()} minor.`,
    );
    if (available <= 0n) {
      return fail("The investment plus the target pool consume the entire post-money. Reduce one of them.");
    }
    let total = divRound(holders * post, available);
    let investor = divRound(total * inv, post);
    let poolAfter = divRound(total * bps, 10000n);
    let topUp = poolAfter - unallocated;
    if (topUp < 0n) {
      trace.push("Existing unallocated pool already exceeds the target. It is not shrunk.");
      topUp = 0n;
      poolAfter = unallocated;
      total = divRound(existing * post, post - inv);
      investor = divRound(total * inv, post);
    }
    const residual = total - holders - poolAfter - investor;
    const priceDen = existing + topUp;
    trace.push(
      `New pool shares ${topUp.toString()}. Price is pre-money / (existing shares + pool top-up), so existing holders bear the pool increase.`,
    );
    trace.push(`Target investor fraction is investment / post-money, before share rounding.`);
    const proceeds = priceDen === 0n ? 0n : divRound(investor * pre, priceDen);
    return pack(input, {
      post,
      total,
      investor,
      topUp,
      unallocated: poolAfter,
      holders,
      residual,
      proceeds,
      priceNum: pre,
      priceDen,
      trace,
    });
  }

  const investor = divRound(inv * existing, pre);
  const base = existing + investor;
  let topUp = divRound(bps * base - unallocated * 10000n, 10000n - bps);
  trace.push("Post-money pool: price is pre-money / existing shares. The pool top-up is created after the investment and dilutes everyone, including the new investor.");
  if (topUp < 0n) {
    trace.push("Existing unallocated pool already exceeds the target. It is not shrunk.");
    topUp = 0n;
  }
  const poolAfter = unallocated + topUp;
  const total = existing + investor + topUp;
  const residual = total - holders - poolAfter - investor;
  const proceeds = divRound(investor * pre, existing);
  trace.push("Investor ownership will be below investment / post-money whenever new pool shares are created.");
  return pack(input, {
    post,
    total,
    investor,
    topUp,
    unallocated: poolAfter,
    holders,
    residual,
    proceeds,
    priceNum: pre,
    priceDen: existing,
    trace,
  });
}

function pack(
  input: RoundInput,
  parts: {
    post: bigint;
    total: bigint;
    investor: bigint;
    topUp: bigint;
    unallocated: bigint;
    holders: bigint;
    residual: bigint;
    proceeds: bigint;
    priceNum: bigint;
    priceDen: bigint;
    trace: string[];
  },
): RoundResult {
  let holders = parts.holders;
  let residual = parts.residual;
  const trace = [...parts.trace];
  if (residual !== 0n) {
    holders += residual;
    trace.push(
      `Rounding residual of ${residual.toString()} share(s) assigned to existing holders so the share buckets add up to total shares. This does not change the investment amount.`,
    );
    residual = 0n;
  }
  const total = parts.total;
  const investor = parts.investor;
  const pool = parts.unallocated;
  if (holders < 0n || investor < 0n || pool < 0n || parts.topUp < 0n || total < 0n) {
    return fail("Share counts went negative. The scenario was rejected.");
  }
  if (holders + investor + pool !== total) {
    return fail("Ownership did not reconcile after rounding.");
  }
  const proceedsDelta = parts.proceeds - BigInt(input.investmentMinor);
  trace.push(
    `Rounded proceeds ${parts.proceeds.toString()} minor versus investment ${input.investmentMinor}. Delta ${proceedsDelta.toString()} minor (within one share of value is the release tolerance).`,
  );
  const targetInvestorBps =
    input.investmentMinor === 0 ? 0 : Number(divRound(BigInt(input.investmentMinor) * 10000n, parts.post));
  return {
    ok: true,
    engine: ROUND_ENGINE,
    input,
    postMoneyMinor: Number(parts.post),
    totalShares: Number(total),
    investorShares: Number(investor),
    poolTopUp: Number(parts.topUp),
    unallocatedAfter: Number(pool),
    holderShares: Number(holders),
    residualShares: Number(residual),
    proceedsMinor: Number(parts.proceeds),
    proceedsDeltaMinor: Number(proceedsDelta),
    investorBps: bpsOf(Number(investor), Number(total)),
    holderBps: bpsOf(Number(holders), Number(total)),
    poolBps: bpsOf(Number(pool), Number(total)),
    targetInvestorBps,
    priceNumerator: parts.priceNum.toString(),
    priceDenominator: parts.priceDen.toString(),
    trace,
  };
}

export function unsupportedInstrument(kind: string): RoundResult {
  return fail(
    `${kind} is not enabled. No template version is loaded, so SeedStage will not apply a generic conversion formula. Use a priced-equity scenario or send the instrument for expert review.`,
  );
}
