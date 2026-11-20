import { projectPlan, type PlanAssumptions } from "./cash.ts";
import { formatBps, formatMoney } from "./money.ts";
import { modelPricedRound, type RoundInput } from "./round.ts";
import type { PublicStartup } from "./startups.ts";
import type { Claim, Investor } from "./types.ts";

export type MetricRow = {
  id: string;
  group: "Round" | "Cash" | "Directory" | "Not on file";
  name: string;
  value: string | null;
};

function accepted(claims: Claim[], key: string): Claim | null {
  const hits = claims.filter((claim) => claim.metricKey === key && claim.status === "accepted" && claim.value !== null);
  if (hits.length !== 1) return null;
  return hits[0];
}

export function exploreMetrics(input: {
  investors: Investor[];
  startups: PublicStartup[];
  claims: Claim[];
  round: RoundInput;
  plan: PlanAssumptions;
}): MetricRow[] {
  const rows: MetricRow[] = [];
  const round = modelPricedRound(input.round);
  if (round.ok) {
    const price = Number(round.priceNumerator) / Number(round.priceDenominator);
    rows.push(
      { id: "pre", group: "Round", name: "Pre-money", value: formatMoney(round.input.preMoneyMinor, round.input.currency) },
      { id: "post", group: "Round", name: "Post-money", value: formatMoney(round.postMoneyMinor, round.input.currency) },
      { id: "new", group: "Round", name: "New money", value: formatMoney(round.input.investmentMinor, round.input.currency) },
      { id: "own", group: "Round", name: "New investor", value: formatBps(round.investorBps) },
      { id: "pool", group: "Round", name: "Option pool", value: formatBps(round.poolBps) },
      { id: "price", group: "Round", name: "Price per share", value: formatMoney(Math.round(price), round.input.currency) },
    );
  }

  const plan = projectPlan(input.plan);
  if (plan.ok) {
    rows.push({
      id: "runway",
      group: "Cash",
      name: "Runway",
      value: plan.runwayMonths === null ? "Beyond the horizon" : `${plan.runwayMonths} months`,
    });
    rows.push({ id: "low", group: "Cash", name: "Lowest close", value: formatMoney(plan.minClosingMinor, input.plan.currency) });
  }
  const cash = accepted(input.claims, "cash_at_bank");
  if (cash?.value != null) rows.push({ id: "cash", group: "Cash", name: "Cash at bank", value: formatMoney(cash.value, cash.currency ?? "GBP") });
  const customers = accepted(input.claims, "paying_customers");
  if (customers?.value != null) rows.push({ id: "customers", group: "Cash", name: "Paying customers", value: String(customers.value) });

  const stated = input.investors.filter((investor) => investor.chequeMaxMinor > 0);
  const byCurrency = new Map<string, Investor[]>();
  for (const investor of stated) {
    const list = byCurrency.get(investor.currency) ?? [];
    list.push(investor);
    byCurrency.set(investor.currency, list);
  }
  rows.push({ id: "firms", group: "Directory", name: "Firms on file", value: String(input.investors.length) });
  rows.push({ id: "companies", group: "Directory", name: "Companies on file", value: String(input.startups.length) });
  rows.push({ id: "cheques", group: "Directory", name: "Firms with a stated cheque", value: String(stated.length) });
  for (const [currency, firms] of byCurrency) {
    const low = Math.min(...firms.map((firm) => firm.chequeMinMinor));
    const high = Math.max(...firms.map((firm) => firm.chequeMaxMinor));
    rows.push({
      id: `range-${currency}`,
      group: "Directory",
      name: `${currency} stated range`,
      value: `${formatMoney(low, currency)}–${formatMoney(high, currency)}`,
    });
  }
  const stage = new Map<string, number>();
  for (const investor of input.investors) {
    for (const name of investor.stages) stage.set(name, (stage.get(name) ?? 0) + 1);
  }
  for (const [name, count] of [...stage.entries()].sort((a, b) => b[1] - a[1])) {
    rows.push({ id: `stage-${name}`, group: "Directory", name: `Firms · ${name}`, value: String(count) });
  }

  const names = new Set(["mrr", "arr", "burn", "burn-multiple", "rule-40", "margin", "cac", "ltv", "tvpi", "dpi", "irr"]);
  const labels: Record<string, string> = {
    mrr: "MRR",
    arr: "ARR",
    burn: "Net burn",
    "burn-multiple": "Burn multiple",
    "rule-40": "Rule of 40",
    margin: "Gross margin",
    cac: "CAC",
    ltv: "LTV",
    tvpi: "TVPI",
    dpi: "DPI",
    irr: "IRR",
  };
  for (const id of names) {
    const claim = accepted(input.claims, id);
    rows.push({ id, group: claim ? "Cash" : "Not on file", name: labels[id], value: claim?.value != null ? String(claim.value) : null });
  }
  return rows;
}
