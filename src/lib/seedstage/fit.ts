import type { Investor } from "./types.ts";

export const FIT_VERSION = "fit-1";
const NEUTRAL = 0.5;
const LAMBDA = 10;
const FRESH_DAYS = 540;
const DAY = 86_400_000;

export const FIT_WEIGHTS = {
  H: 0.25,
  T: 0.15,
  E: 0.15,
  R: 0.15,
  U: 0.1,
  P: 0.1,
  B: 0.05,
  D: 0.05,
} as const;

export type FitBrief = {
  name: string;
  stage: string;
  geos: string[];
  sectors: string[];
  raiseMinor: number;
  currency: string;
  needLead: boolean;
  text: string;
  asOf: string;
};

export type GateStatus = "PASS" | "FAIL" | "UNKNOWN";

export type FitDimension = {
  id: keyof typeof FIT_WEIGHTS;
  label: string;
  weight: number;
  score: number | null;
  reliability: number;
  adjusted: number;
  note: string;
};

export type FitResult = {
  investorId: string;
  firm: string;
  eligibility: "EXCLUDED" | "VERIFY" | "ELIGIBLE";
  gates: { name: string; status: GateStatus; reason: string }[];
  dimensions: FitDimension[];
  fit: number | null;
  coverage: number;
  rankIndex: number | null;
  label: string;
  role: "lead" | "participant" | "unstated";
  reasons: string[];
  unknowns: string[];
  blockers: string[];
  access: string;
  next: string;
  version: typeof FIT_VERSION;
  asOf: string;
};

export type ComparableCompany = { name: string; summary: string; stage: string };

const LABELS: Record<keyof typeof FIT_WEIGHTS, string> = {
  H: "Historical comparables",
  T: "Thesis and customer",
  E: "Stage readiness",
  R: "Round construction",
  U: "Risk underwriting",
  P: "Partner",
  B: "Business model",
  D: "Deployment",
};

function norm(value: string): string {
  return value.trim().toLowerCase();
}

function tokens(value: string): Set<string> {
  return new Set(
    norm(value)
      .split(/[^a-z0-9+]+/)
      .filter((token) => token.length > 2),
  );
}

function overlaps(left: string[], right: string[]): boolean {
  const set = new Set(right.map(norm));
  return left.some((item) => set.has(norm(item)));
}

function stageHit(stated: string[], wanted: string): "exact" | "broad" | null {
  const target = norm(wanted);
  const list = stated.map(norm);
  if (list.includes(target)) return "exact";
  const broad = ["early-stage", "early stage", "early risers", "no stage is too early"];
  if ((target === "seed" || target === "pre-seed") && list.some((item) => broad.includes(item))) return "broad";
  return null;
}

function daysBetween(asOf: string, earlier: string): number | null {
  const a = Date.parse(asOf);
  const b = Date.parse(earlier);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((a - b) / DAY);
}

function dimension(id: keyof typeof FIT_WEIGHTS, score: number | null, reliability: number, note: string): FitDimension {
  const known = score !== null && reliability > 0;
  return {
    id,
    label: LABELS[id],
    weight: FIT_WEIGHTS[id],
    score: known ? score : null,
    reliability: known ? reliability : 0,
    adjusted: known ? reliability * score + (1 - reliability) * NEUTRAL : NEUTRAL,
    note,
  };
}

function jaccard(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / (left.size + right.size - shared);
}

function historical(investor: Investor, brief: FitBrief, comparables: ComparableCompany[]): FitDimension {
  const briefTokens = tokens(`${brief.sectors.join(" ")} ${brief.text}`);
  const ranked = comparables
    .map((company) => {
      const similarity = jaccard(briefTokens, tokens(`${company.summary} ${company.stage}`));
      const coverage = company.summary.trim().length > 80 ? 1 : 0.35;
      const stage = stageHit([company.stage], brief.stage) ? 1 : 0.5;
      return { company, similarity, weight: coverage * 0.6 * stage };
    })
    .filter((item) => item.similarity > 0 && item.weight > 0)
    .sort((a, b) => b.weight * b.similarity - a.weight * a.similarity)
    .slice(0, 3);
  if (ranked.length === 0) {
    const named = investor.portfolio.length > 0 ? ` Portfolio names on file: ${investor.portfolio.slice(0, 4).join(", ")}.` : "";
    return dimension("H", null, 0, `No comparable company snapshot is on file.${named}`);
  }
  const weight = ranked.reduce((sum, item) => sum + item.weight, 0);
  const score = ranked.reduce((sum, item) => sum + item.weight * item.similarity, 0) / weight;
  const reliability = Math.min(0.55, ranked.reduce((sum, item) => sum + item.weight, 0) / ranked.length);
  return dimension("H", round3(score), round3(reliability), `Compared with ${ranked.map((item) => item.company.name).join(", ")}.`);
}

function thesis(investor: Investor, brief: FitBrief): FitDimension {
  const sector = overlaps(brief.sectors, investor.sectors);
  const theme = investor.themes.some((theme) => brief.sectors.some((sector) => norm(theme).includes(norm(sector)) || norm(sector).includes(norm(theme))) || tokens(brief.text).has(norm(theme)));
  const excerpt = brief.sectors.some((sector) => tokens(investor.excerpt).has(norm(sector)));
  if (sector) return dimension("T", 1, 0.7, "A stated sector overlaps the company.");
  if (theme) return dimension("T", 0.75, 0.55, "A stated theme overlaps the company. The buyer is not separately evidenced.");
  if (excerpt) return dimension("T", 0.5, 0.4, "The firm page shares a sector word. That is partial alignment.");
  if (investor.sectors.length > 0 || investor.themes.length > 0) return dimension("T", 0.25, 0.6, "Stated sectors or themes do not overlap.");
  return dimension("T", null, 0, "No thesis or sector is stated.");
}

function readiness(investor: Investor, brief: FitBrief): FitDimension {
  const hit = stageHit(investor.stages, brief.stage);
  if (hit === "exact") return dimension("E", 1, 0.75, `${brief.stage} is inside the stated stages.`);
  if (hit === "broad") return dimension("E", 0.75, 0.55, `Stage language (${investor.stages.join(", ")}) is treated as covering ${brief.stage}.`);
  return dimension("E", null, 0, "Stage mandate is blank.");
}

function roundFit(investor: Investor, brief: FitBrief): FitDimension {
  const parts: { score: number; reliability: number; weight: number }[] = [];
  const notes: string[] = [];
  if (brief.raiseMinor <= 0 || investor.chequeMaxMinor <= 0) notes.push("Cheque range or round size is not stated.");
  else if (investor.currency !== brief.currency) notes.push(`Cheque is in ${investor.currency}. No conversion is applied.`);
  else if (investor.chequeMinMinor <= brief.raiseMinor && brief.raiseMinor <= investor.chequeMaxMinor) {
    parts.push({ score: 1, reliability: 0.8, weight: 0.4 });
    notes.push("Round size sits inside the stated cheque range.");
  } else if (investor.chequeMinMinor <= brief.raiseMinor) {
    parts.push({ score: 0.5, reliability: 0.7, weight: 0.4 });
    notes.push("The round is larger than the largest stated cheque.");
  }
  if (investor.participation === "lead" || investor.participation === "either") {
    parts.push({ score: brief.needLead ? 1 : 0.75, reliability: 0.7, weight: 0.25 });
    notes.push("Participation includes leading.");
  } else if (investor.participation === "follow") {
    parts.push({ score: brief.needLead ? 0.25 : 0.75, reliability: 0.7, weight: 0.25 });
    notes.push(brief.needLead ? "Marked follow-only, so not a lead." : "Marked follow-only.");
  } else notes.push("Lead or follow is not stated.");
  notes.push("Ownership target and instrument are not on file.");
  if (parts.length === 0) return dimension("R", null, 0, notes.join(" "));
  const weight = parts.reduce((sum, part) => sum + part.weight, 0);
  const score = parts.reduce((sum, part) => sum + part.weight * part.score, 0) / weight;
  const reliability = parts.reduce((sum, part) => sum + part.weight * part.reliability, 0) / weight;
  return dimension("R", round3(score), round3(reliability), notes.join(" "));
}

function risk(investor: Investor, brief: FitBrief): FitDimension {
  const words = ["regulat", "compliance", "clinical", "hardware", "defence", "defense", "deep tech"];
  const briefText = norm(brief.text);
  const firmText = norm(`${investor.themes.join(" ")} ${investor.sectors.join(" ")} ${investor.excerpt}`);
  const hit = words.find((word) => briefText.includes(word) && firmText.includes(word));
  if (!hit) return dimension("U", null, 0, "No underwriting position is on file.");
  return dimension("U", 0.75, 0.4, `Both the company text and the firm page mention ${hit}. That is not a written underwriting policy.`);
}

function partner(investor: Investor, brief: FitBrief): FitDimension {
  if (!investor.partner) return dimension("P", null, 0, "No partner is named.");
  const aligned = overlaps(brief.sectors, investor.sectors) || investor.themes.length > 0;
  if (!aligned) return dimension("P", null, 0, `${investor.partner} is named. Category responsibility is not on file.`);
  return dimension("P", 0.75, 0.45, `${investor.partner} is named. Their role on this category is not verified.`);
}

function model(investor: Investor, brief: FitBrief): FitDimension {
  const words = ["saas", "marketplace", "subscription", "usage", "transaction"];
  const shared = words.find((word) => norm(brief.text).includes(word) && norm(investor.excerpt).includes(word));
  if (!shared) return dimension("B", null, 0, "Revenue model is not compared. The firm page does not state one.");
  return dimension("B", 0.75, 0.35, `Both texts mention ${shared}. Operating economics are not on file.`);
}

function deployment(investor: Investor, brief: FitBrief): FitDimension {
  if (!investor.activityDate) return dimension("D", null, 0, "No sourced activity date.");
  const age = daysBetween(brief.asOf, investor.activityDate);
  if (age === null) return dimension("D", null, 0, "Activity date could not be read.");
  if (age > FRESH_DAYS) return dimension("D", 0.25, 0.5, `Latest sourced activity is ${age} days before the review date.`);
  return dimension("D", 0.75, 0.5, `Sourced activity is ${age} days before the review date. That is not proof the fund is open.`);
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function assessFit(investor: Investor, brief: FitBrief, comparables: ComparableCompany[]): FitResult {
  const gates: FitResult["gates"] = [];
  const blockers: string[] = [];
  const geoExcluded = brief.geos.some((geo) => investor.geoExclusions.some((item) => norm(item) === norm(geo)));
  if (geoExcluded) gates.push({ name: "Geography", status: "FAIL", reason: "Company geography is on an exclusion list." });
  else if (investor.geos.length === 0) gates.push({ name: "Geography", status: "UNKNOWN", reason: "Geography mandate is blank." });
  else if (brief.geos.length === 0) gates.push({ name: "Geography", status: "UNKNOWN", reason: "Company geography was not in the upload." });
  else if (!overlaps(brief.geos, investor.geos)) gates.push({ name: "Geography", status: "FAIL", reason: "Company geography is outside the stated geography." });
  else gates.push({ name: "Geography", status: "PASS", reason: "Stated geography covers the company." });

  const stage = stageHit(investor.stages, brief.stage);
  if (investor.stages.length === 0) gates.push({ name: "Stage", status: "UNKNOWN", reason: "Stage mandate is blank." });
  else if (!stage) gates.push({ name: "Stage", status: "FAIL", reason: `Stated stages do not include ${brief.stage}.` });
  else gates.push({ name: "Stage", status: "PASS", reason: stage === "exact" ? "Stage matches." : "Broad stage language covers this round." });

  const sectorExcluded = brief.sectors.some((sector) => investor.sectorExclusions.some((item) => norm(sector).includes(norm(item)) || norm(item).includes(norm(sector))));
  if (sectorExcluded) gates.push({ name: "Exclusion", status: "FAIL", reason: "A company sector matches an explicit exclusion." });
  else if (investor.sectorExclusive && investor.sectors.length > 0 && !overlaps(brief.sectors, investor.sectors)) gates.push({ name: "Exclusion", status: "FAIL", reason: "Mandate is sector-exclusive and there is no overlap." });
  else gates.push({ name: "Exclusion", status: "PASS", reason: "No binding sector exclusion is on file." });

  if (brief.raiseMinor > 0 && investor.chequeMaxMinor > 0 && investor.currency === brief.currency && investor.chequeMinMinor > brief.raiseMinor) {
    gates.push({ name: "Cheque", status: "FAIL", reason: "Smallest stated cheque is larger than the round." });
  } else if (brief.raiseMinor <= 0 || investor.chequeMaxMinor <= 0 || investor.currency !== brief.currency) {
    gates.push({ name: "Cheque", status: "UNKNOWN", reason: "Cheque and round cannot both be tested." });
  } else gates.push({ name: "Cheque", status: "PASS", reason: "Cheque range can meet some or all of the round." });

  gates.push({ name: "Conflict", status: "UNKNOWN", reason: "No conflict policy is on file." });
  gates.push({ name: "Deployment", status: "UNKNOWN", reason: "The page does not say whether the strategy is open." });

  const failed = gates.some((gate) => gate.status === "FAIL");
  const criticalUnknown = gates.some((gate) => (gate.name === "Geography" || gate.name === "Stage") && gate.status === "UNKNOWN");
  const eligibility: FitResult["eligibility"] = failed ? "EXCLUDED" : criticalUnknown ? "VERIFY" : "ELIGIBLE";

  let role: FitResult["role"] = "unstated";
  if (investor.participation === "follow") {
    role = "participant";
    if (brief.needLead) blockers.push("Follow-only. Kept off the lead shortlist.");
  } else if (investor.participation === "lead" || investor.participation === "either") role = "lead";

  const dimensions = [
    historical(investor, brief, comparables),
    thesis(investor, brief),
    readiness(investor, brief),
    roundFit(investor, brief),
    risk(investor, brief),
    partner(investor, brief),
    model(investor, brief),
    deployment(investor, brief),
  ];
  const coverage = round3(dimensions.reduce((sum, item) => sum + item.weight * item.reliability, 0));
  const fit = round1(100 * dimensions.reduce((sum, item) => sum + item.weight * item.adjusted, 0));
  const reasons = dimensions.filter((item) => item.score !== null && item.score >= 0.75).map((item) => item.note);
  const unknowns = [
    ...dimensions.filter((item) => item.score === null).map((item) => item.note),
    "This is not a probability of investment.",
    "Contact route is unknown. No email address is inferred.",
  ];
  const label = fit >= 72 && coverage >= 0.4 ? "Strong candidate" : fit >= 58 ? "Conditional" : "Thin evidence";
  const next =
    eligibility === "EXCLUDED"
      ? "Do not prioritise. The exclusion reason is on the card."
      : eligibility === "VERIFY"
        ? "Verify the blank mandate before approaching."
        : blockers.length > 0
          ? "Use only if a participant is useful. Confirm the lead policy first."
          : coverage < 0.4
            ? "Verify the missing mandate fields before approaching."
            : "Read the cited page, then decide whether to request an introduction.";

  return {
    investorId: investor.id,
    firm: investor.firm,
    eligibility,
    gates,
    dimensions,
    fit: eligibility === "EXCLUDED" ? null : fit,
    coverage,
    rankIndex: eligibility === "EXCLUDED" ? null : round1(fit - LAMBDA * (1 - coverage)),
    label: eligibility === "EXCLUDED" ? "Excluded" : label,
    role,
    reasons,
    unknowns,
    blockers,
    access: "No verified introduction is on file.",
    next,
    version: FIT_VERSION,
    asOf: brief.asOf,
  };
}

export function rankInvestors(investors: Investor[], brief: FitBrief, startups: ComparableCompany[] = []): FitResult[] {
  const byName = new Map(startups.map((company) => [norm(company.name), company]));
  return investors
    .map((investor) => {
      const comparables = investor.portfolio.map((name) => byName.get(norm(name))).filter((company): company is ComparableCompany => Boolean(company));
      return assessFit(investor, brief, comparables);
    })
    .sort((a, b) => {
      const order = { ELIGIBLE: 0, VERIFY: 1, EXCLUDED: 2 };
      if (order[a.eligibility] !== order[b.eligibility]) return order[a.eligibility] - order[b.eligibility];
      return (b.rankIndex ?? -1) - (a.rankIndex ?? -1);
    });
}

const GEO_PATTERNS: [RegExp, string][] = [
  [/\bunited kingdom\b|\bu\.k\.\b|\buk\b|\blondon\b/i, "United Kingdom"],
  [/\bunited states\b|\bu\.s\.\b|\busa\b|\bsan francisco\b|\bnew york\b/i, "United States"],
  [/\beurope\b|\beu\b/i, "Europe"],
  [/\bindia\b/i, "India"],
  [/\bsingapore\b/i, "Singapore"],
];

const SECTOR_PATTERNS: [RegExp, string][] = [
  [/\bfintech\b|\bpayments?\b|\bbanking\b/i, "fintech"],
  [/\bhealth(?:care|tech)?\b|\bclinical\b/i, "health"],
  [/\bclimate\b|\benergy\b/i, "climate"],
  [/\bsecurity\b|\bcyber\b/i, "security"],
  [/\binfrastructure\b|\bdevtools\b|\bdeveloper tools\b/i, "infrastructure"],
  [/\bmarketplace\b/i, "marketplace"],
  [/\bartificial intelligence\b|\bai\b|\bmachine learning\b/i, "AI"],
  [/\bb2b\b|\benterprise\b|\bsaas\b/i, "B2B software"],
];

export function parseBrief(text: string, asOf: string): FitBrief {
  const stage = /\bpre-seed\b/i.test(text) ? "pre-seed" : /\bseries a\b/i.test(text) ? "series a" : /\bseed\b/i.test(text) ? "seed" : "seed";
  const money = text.match(/(£|\$|€|gbp|usd|eur)\s*([\d,.]+)\s*(m|million|k|thousand)?/i);
  let raiseMinor = 0;
  let currency = "GBP";
  if (money) {
    const symbol = money[1].toLowerCase();
    currency = symbol === "$" || symbol === "usd" ? "USD" : symbol === "€" || symbol === "eur" ? "EUR" : "GBP";
    const unit = (money[3] ?? "").toLowerCase();
    const major = Number(money[2].replace(/,/g, ""));
    const scale = unit.startsWith("m") ? 1_000_000 : unit.startsWith("k") || unit.startsWith("t") ? 1_000 : major < 1000 ? 1_000_000 : 1;
    if (Number.isFinite(major)) raiseMinor = Math.round(major * scale * 100);
  }
  const geos = GEO_PATTERNS.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
  const sectors = SECTOR_PATTERNS.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
  const name = text.split("\n").map((line) => line.trim()).find((line) => line.length > 1 && line.length < 80) ?? "Uploaded startup";
  return {
    name,
    stage,
    geos,
    sectors,
    raiseMinor,
    currency,
    needLead: /\blead\b/i.test(text),
    text: text.slice(0, 6000),
    asOf,
  };
}
