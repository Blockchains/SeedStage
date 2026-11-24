import type { PublicStartup } from "./startups.ts";
import type { Investor } from "./types.ts";

/** Screening rules, not a probability and not an official SEC stage. */
export const SEC_RULESET = "sec-screen-1";

export type StageLabel =
  | "likely_early_stage_candidate"
  | "possible_early_stage_candidate"
  | "insufficient_evidence"
  | "likely_other"
  | "fund_issuer";

export type SecView = "candidates" | "issuers" | "other" | "funds" | "thin";

export type AmountStatus = "numeric" | "zero" | "indefinite" | "unknown";

export type ParsedAmount = { status: AmountStatus; amount: number | null; text: string | null };

export type Curation = {
  label: StageLabel;
  display: string;
  industry: string | null;
  offering: ParsedAmount;
  sold: ParsedAmount;
  summary: string;
  facts: string;
  reasons: string[];
  missing: string[];
  contradictions: string[];
};

const DISPLAY: Record<StageLabel, string> = {
  likely_early_stage_candidate: "Early-stage candidate",
  possible_early_stage_candidate: "Possible early-stage",
  insufficient_evidence: "Insufficient evidence",
  likely_other: "Other issuer",
  fund_issuer: "Fund issuer",
};

const INDUSTRIES = [
  "Pooled Investment Fund",
  "Tourism and Travel Services",
  "Hospitals and Physicians",
  "Lodging and Conventions",
  "Environmental Services",
  "Other Health Care",
  "Other Real Estate",
  "Other Technology",
  "Commercial Banking",
  "Electric Utilities",
  "REITS and Finance",
  "Telecommunications",
  "Business Services",
  "Pharmaceuticals",
  "Biotechnology",
  "Oil and Gas",
  "Construction",
  "Manufacturing",
  "Residential",
  "Restaurants",
  "Computers",
  "Commercial",
  "Retailing",
  "Insurance",
  "Investing",
  "Aerospace",
  "Energy",
  "Other",
].sort((a, b) => b.length - a.length);

const TECH = new Set(["Other Technology", "Computers", "Telecommunications", "Biotechnology", "Pharmaceuticals", "Aerospace"]);
const REAL_ESTATE = new Set(["Other Real Estate", "Commercial", "Residential", "Construction", "REITS and Finance"]);
const SCREEN = 5_000_000;
const ESTABLISHED_REVENUE = /Over \$100,000,000|\$25,000,001/;

export function matchesView(label: StageLabel, view: SecView): boolean {
  if (view === "issuers") return true;
  if (view === "candidates") return label === "likely_early_stage_candidate" || label === "possible_early_stage_candidate";
  if (view === "other") return label === "likely_other";
  if (view === "funds") return label === "fund_issuer";
  return label === "insufficient_evidence";
}

function labeled(text: string, name: string): string | null {
  const match = text.match(new RegExp(`^${name}:\\s*(.+)$`, "m"));
  const value = match?.[1]?.trim();
  return value ? value : null;
}

function filesText(company: { files?: { text: string }[] }): string {
  return (company.files ?? []).map((file) => file.text).join("\n");
}

export function industryOf(summary: string, text: string): string | null {
  const reported = labeled(text, "Industry as reported");
  if (reported) return reported;
  for (const name of INDUSTRIES) {
    if (summary === name || summary.startsWith(`${name} `)) return name;
  }
  return null;
}

export function parseAmount(value: string | null): ParsedAmount {
  if (!value) return { status: "unknown", amount: null, text: null };
  const cleaned = value.trim();
  if (/indefinite/i.test(cleaned)) return { status: "indefinite", amount: null, text: "Indefinite" };
  const digits = cleaned.replace(/[^0-9]/g, "");
  if (!digits) return { status: "unknown", amount: null, text: null };
  const amount = Number(digits);
  if (!Number.isFinite(amount)) return { status: "unknown", amount: null, text: null };
  if (amount === 0) return { status: "zero", amount: 0, text: "$0" };
  return { status: "numeric", amount, text: `$${amount.toLocaleString("en-US")}` };
}

function offeringOf(company: PublicStartup, text: string): ParsedAmount {
  return parseAmount(labeled(text, "Offering amount") ?? company.round ?? company.summary.match(/Offering (\$[\d,]+|Indefinite)/)?.[1] ?? null);
}

function soldOf(text: string): ParsedAmount {
  return parseAmount(labeled(text, "Amount sold") ?? text.match(/Amount sold on the filing:\s*(\$[\d,]+|Indefinite)/)?.[1] ?? null);
}

function moneyWords(amount: ParsedAmount, missing: string): string {
  if (amount.status === "numeric" || amount.status === "zero" || amount.status === "indefinite") return amount.text ?? missing;
  return missing;
}

export function classifyStartup(company: PublicStartup, withFacts = true): Curation {
  const text = filesText(company);
  const industry = industryOf(company.summary, text);
  const offering = offeringOf(company, text);
  const sold = soldOf(text);
  const revenue = labeled(text, "Revenue range as reported");
  const amendment = labeled(text, "Amendment");
  const firstSale = labeled(text, "First sale");
  const securities = labeled(text, "Securities as reported");
  const combination = labeled(text, "Business combination");
  const incorporated = labeled(text, "Incorporation year as reported");
  const reasons: string[] = [];
  const missing: string[] = [];
  const contradictions: string[] = [];

  if (!industry) missing.push("Industry was not read from the filing.");
  if (offering.status === "unknown") missing.push("Offering amount was not read. A missing amount is not zero.");
  if (sold.status === "unknown") missing.push("Amount sold was not read. A missing amount is not zero and is not added to another filing.");
  if (!revenue) missing.push("Revenue range was not read. Decline-to-disclose is not treated as zero when it is present.");
  if (!incorporated) missing.push("Incorporation year was not read.");
  if (!company.person) missing.push("No related person was read. A missing person is not an investor.");
  if (revenue && /decline to disclose/i.test(revenue)) missing.push("Revenue was declined to disclose, so it is not evidence of no revenue.");

  const name = company.name.toLowerCase();
  const realEstateName = /\b(real estate|reit|properties|apartments|self storage|realty)\b/.test(name);
  const fundName = /\b(hedge fund|private equity fund|venture capital fund|investment fund|pooled investment)\b/.test(name)
    || (/\b(fund|partners)\b/.test(name) && !/\b(inc|corp|corporation|ltd|plc)\b/.test(name));
  const pooledSecurity = /pooled investment fund/i.test(securities ?? "");

  let label: StageLabel = "insufficient_evidence";

  if (industry === "Pooled Investment Fund" || pooledSecurity || (!industry && fundName)) {
    label = "fund_issuer";
    reasons.push(industry === "Pooled Investment Fund" || pooledSecurity
      ? "The filing identifies a pooled investment fund. That is not a portfolio-company seed round."
      : "The name reads as a fund and the filing did not give an operating industry.");
  } else if (combination && /^yes/i.test(combination)) {
    label = "likely_other";
    reasons.push("The filing says this is a business combination, not an operating startup round.");
  } else if ((industry && REAL_ESTATE.has(industry)) || (!industry && realEstateName)) {
    label = "likely_other";
    reasons.push(industry ? `Industry as reported is ${industry}, a real-estate group.` : "The issuer name reads as real estate, and no operating industry was reported.");
  } else if (revenue && ESTABLISHED_REVENUE.test(revenue)) {
    label = "likely_other";
    reasons.push(`Revenue range as reported is ${revenue}, above the early-stage screen.`);
  } else if (industry && TECH.has(industry)) {
    const smallOffering = offering.status === "unknown" || offering.status === "indefinite" || (offering.amount !== null && offering.amount <= SCREEN);
    const smallSold = sold.status !== "numeric" || (sold.amount !== null && sold.amount <= SCREEN);
    if (smallOffering && smallSold && !realEstateName) {
      label = "likely_early_stage_candidate";
      reasons.push(`${industry} is a technology or life-science group as reported.`);
      reasons.push(offering.status === "numeric"
        ? `Offering amount is at or below the $${SCREEN.toLocaleString("en-US")} screen. The screen is not a definition of seed.`
        : "Offering amount is missing or indefinite, so the issuer stays a candidate instead of being dropped.");
    } else {
      label = "possible_early_stage_candidate";
      reasons.push(`${industry} can be an early round, but the amount is above the $${SCREEN.toLocaleString("en-US")} screen or the name conflicts.`);
      if (realEstateName) contradictions.push("Industry is technology, while the name reads as real estate.");
    }
  } else if (industry === "Other Health Care") {
    label = offering.amount !== null && offering.amount > SCREEN ? "likely_other" : "possible_early_stage_candidate";
    reasons.push(label === "likely_other"
      ? "Other Health Care with an offering above the screen is not treated as a startup seed round."
      : "Other Health Care is only a possible candidate. Clinics and practices are not assumed to be startups.");
  } else if (industry && offering.amount !== null && offering.amount <= SCREEN) {
    label = "possible_early_stage_candidate";
    reasons.push(`${industry} with an offering at or below the screen is only a possible candidate.`);
  } else if (industry) {
    label = "likely_other";
    reasons.push(`${industry} is not a technology group, and the offering is missing or above the screen.`);
  } else if (fundName) {
    label = "fund_issuer";
    reasons.push("No industry was read, and the name reads as a fund.");
  } else {
    label = "insufficient_evidence";
    reasons.push("Industry and a usable offering amount are both missing, so this is not called seed.");
  }

  if (incorporated && /over five years/i.test(text) && (label === "likely_early_stage_candidate" || label === "possible_early_stage_candidate")) {
    reasons.push("Incorporation is older than five years as reported. That does not by itself remove an early-stage candidate.");
  }
  if (amendment) reasons.push(amendment.toLowerCase() === "yes" ? "This observation is an amendment. It is not counted as a second round." : "This observation is not marked as an amendment.");
  if (firstSale) reasons.push(`First sale, as reported: ${firstSale}. That is not a close date.`);

  const summary = [
    "Filed an offering notice.",
    industry ? `Industry as reported: ${industry}.` : "Industry was not read.",
    `Offering amount ${moneyWords(offering, "was not read")}.`,
    `Amount sold ${moneyWords(sold, "was not read")}.`,
    "This is not labelled a seed round.",
  ].join(" ");

  const facts = withFacts
    ? [
        `Ruleset: ${SEC_RULESET}`,
        `Label: ${label}`,
        "The label is inferred. Form D has no seed-stage field.",
        summary,
        company.person ? `Related person named on the filing: ${company.person}. A related person is not recorded as an investor.` : "No related person was read.",
        securities ? `Securities as reported: ${securities}. A broad category is not rewritten as a SAFE unless the filing says so.` : "Security types were not read.",
        revenue ? `Revenue range as reported: ${revenue}.` : "Revenue range was not read.",
        "Offering amount is the target on the notice. Amount sold is the figure on this filing. They are not added together.",
        "One record is kept per CIK, so an amendment does not become another round and its amount is not summed with an earlier filing.",
        "Investor identities are not on this record unless a separate source says so.",
        reasons.length ? `Reasons: ${reasons.join(" ")}` : "",
        missing.length ? `Missing: ${missing.join(" ")}` : "",
        contradictions.length ? `Contradictions: ${contradictions.join(" ")}` : "",
      ].filter(Boolean).join("\n")
    : "";

  return { label, display: DISPLAY[label], industry, offering, sold, summary, facts, reasons, missing, contradictions };
}

export function presentStartup(company: PublicStartup): PublicStartup {
  if (company.files?.some((file) => file.title === "Filing facts")) return company;
  const curation = classifyStartup(company);
  const files = (company.files ?? []).filter((file) => file.title !== "Filing facts");
  return {
    ...company,
    stage: curation.display,
    summary: curation.summary,
    files: [{ title: "Filing facts", text: curation.facts }, ...files],
  };
}

export function presentInvestor(firm: Investor): Investor {
  const files = firm.files ?? [];
  if (files.some((file) => file.title === "What this filing is")) return firm;
  return {
    ...firm,
    files: [{
      title: "What this filing is",
      text: [
        "This Form D is the fund's own offering notice.",
        "It is not a portfolio-company investment and it is not evidence of a cheque into a startup.",
        "The offering target is not capital available to invest.",
        "Related persons and sales-compensation recipients are not treated as startup investors.",
        "No email is added, because Form D has no email field.",
        firm.themes[0] ? `Fund type as reported: ${firm.themes[0]}.` : "Fund type was not read.",
      ].join(" "),
    }, ...files],
  };
}
