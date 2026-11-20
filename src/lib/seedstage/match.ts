export const MATCH_AID_VERSION = "match-aid-1";

export type Investor = {
  id: string;
  firm: string;
  fund: string;
  partner: string | null;
  stages: string[];
  geos: string[];
  geoExclusions: string[];
  sectors: string[];
  sectorExclusions: string[];
  sectorExclusive: boolean;
  chequeMinMinor: number;
  chequeMaxMinor: number;
  participation: "lead" | "follow" | "either";
  themes: string[];
  portfolio: string[];
  activityDate: string | null;
  source: string;
  sourceDate: string;
  synthetic: true;
  confirmed: false;
  currency: string;
};

export type MatchProfile = {
  stage: string;
  geos: string[];
  sectors: string[];
  raiseMinor: number;
  currency: string;
  needLead: boolean;
  asOf: string;
};

export type MatchAssessment = {
  investorId: string;
  category: "disqualified" | "possible" | "priority";
  disqualifiers: string[];
  reasonsFor: string[];
  reasonsAgainst: string[];
  unknowns: string[];
  aid: number | null;
  aidVersion: typeof MATCH_AID_VERSION | null;
  aidNote: string;
};

const DAY = 86_400_000;
const FRESH_DAYS = 540;

function daysBetween(asOf: string, earlier: string): number | null {
  const a = Date.parse(asOf);
  const b = Date.parse(earlier);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((a - b) / DAY);
}

function overlaps(left: string[], right: string[]): boolean {
  const set = new Set(right.map((s) => s.toLowerCase()));
  return left.some((s) => set.has(s.toLowerCase()));
}

export function assessInvestor(investor: Investor, profile: MatchProfile): MatchAssessment {
  const disqualifiers: string[] = [];
  const reasonsFor: string[] = [];
  const reasonsAgainst: string[] = [];
  const unknowns: string[] = [];

  if (!investor.synthetic) unknowns.push("Record is not flagged synthetic, but this build has no licensed feed.");
  unknowns.push("Available capital is unknown. A mandate card is not deployable capital.");
  unknowns.push("Contact route is unknown. No email address is inferred.");

  const geoExcluded = profile.geos.some((geo) =>
    investor.geoExclusions.some((ex) => ex.toLowerCase() === geo.toLowerCase()),
  );
  if (geoExcluded) disqualifiers.push("Company geography is on this mandate's exclusion list.");
  else if (investor.geos.length > 0 && !overlaps(profile.geos, investor.geos)) {
    disqualifiers.push("Company geography is outside the stated geography.");
  } else if (investor.geos.length === 0) unknowns.push("Geography mandate is blank.");
  else reasonsFor.push("Stated geography covers the company.");

  if (!investor.stages.map((s) => s.toLowerCase()).includes(profile.stage.toLowerCase())) {
    disqualifiers.push(`Stated stages (${investor.stages.join(", ") || "none"}) do not include ${profile.stage}.`);
  } else reasonsFor.push(`Stage ${profile.stage} is inside the stated mandate.`);

  const sectorExcluded = profile.sectors.some((sector) =>
    investor.sectorExclusions.some((ex) => sector.toLowerCase().includes(ex.toLowerCase()) || ex.toLowerCase().includes(sector.toLowerCase())),
  );
  if (sectorExcluded) disqualifiers.push("A company sector matches an explicit exclusion.");
  else if (investor.sectorExclusive && investor.sectors.length > 0 && !overlaps(profile.sectors, investor.sectors)) {
    disqualifiers.push("Mandate is sector-exclusive and there is no overlap.");
  } else if (overlaps(profile.sectors, investor.sectors)) reasonsFor.push("Sector overlap with the stated mandate.");
  else if (investor.sectors.length === 0) reasonsFor.push("No sector restriction is stated.");
  else reasonsAgainst.push("No direct sector overlap. Not treated as a hard exclusion.");

  if (investor.currency !== profile.currency) {
    unknowns.push(`Cheque currency is ${investor.currency}. No conversion into ${profile.currency} is applied, so the range is not tested.`);
    reasonsAgainst.push("Cheque fit is unknown until both amounts share a currency.");
  } else if (investor.chequeMinMinor > profile.raiseMinor) {
    disqualifiers.push("Smallest stated cheque is larger than the whole round.");
  } else if (profile.raiseMinor > investor.chequeMaxMinor) {
    reasonsAgainst.push("Round is larger than their largest stated cheque. They could only take part of it.");
  } else reasonsFor.push("Round size sits inside the stated cheque range.");

  if (profile.needLead && investor.participation === "follow") {
    reasonsAgainst.push("Profile says a lead is required, and this firm is marked follow-only.");
  } else if (investor.participation === "lead" || investor.participation === "either") {
    reasonsFor.push("Participation includes leading.");
  }

  const themeHit = investor.themes.some((theme) =>
    profile.sectors.some((sector) => theme.toLowerCase().includes(sector.toLowerCase()) || sector.toLowerCase().includes(theme.toLowerCase())),
  );
  if (themeHit) reasonsFor.push("A stated theme lines up with the company sector.");
  if (investor.portfolio.length > 0) reasonsFor.push(`Portfolio names on file: ${investor.portfolio.join(", ")}. Overlap is illustrative, not a reference.`);
  else unknowns.push("No portfolio companies on file.");

  let fresh = false;
  if (!investor.activityDate) {
    unknowns.push("No sourced activity date.");
    reasonsAgainst.push("Activity freshness is unknown.");
  } else {
    const age = daysBetween(profile.asOf, investor.activityDate);
    if (age === null) unknowns.push("Activity date could not be read.");
    else if (age > FRESH_DAYS) reasonsAgainst.push(`Latest sourced activity is ${age} days before the review date.`);
    else {
      fresh = true;
      reasonsFor.push(`Sourced activity is ${age} days before the review date.`);
    }
  }

  const category: MatchAssessment["category"] =
    disqualifiers.length > 0
      ? "disqualified"
      : reasonsFor.some((r) => r.startsWith("Sector")) &&
          fresh &&
          !(profile.needLead && investor.participation === "follow")
        ? "priority"
        : "possible";

  let aid: number | null = null;
  if (category !== "disqualified") {
    aid = 0;
    if (reasonsFor.some((r) => r.startsWith("Sector"))) aid += 2;
    if (investor.participation !== "follow" || !profile.needLead) aid += 2;
    if (themeHit) aid += 1;
    if (fresh) aid += 1;
    if (!investor.activityDate) aid -= 1;
  }

  return {
    investorId: investor.id,
    category,
    disqualifiers,
    reasonsFor,
    reasonsAgainst,
    unknowns,
    aid: category === "disqualified" ? null : aid,
    aidVersion: category === "disqualified" ? null : MATCH_AID_VERSION,
    aidNote:
      "The aid is a disclosed weighting for sorting only: sector +2, lead fit +2, theme +1, fresh activity +1, missing activity −1. Missing data is not treated as a match. This is not a probability of investment.",
  };
}
