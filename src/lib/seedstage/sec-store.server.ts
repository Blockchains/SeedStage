import { classifyStartup, matchesView, presentInvestor, presentStartup, type SecView } from "./sec-class.ts";
import type { PublicStartup } from "./startups.ts";
import type { Investor } from "./types.ts";

type Wave = { startups: PublicStartup[]; investors: Investor[] };

export type SecStartupCard = {
  id: string;
  name: string;
  stage: string;
  summary: string;
  industry: string | null;
  offering: string | null;
  sold: string | null;
  person: string | null;
  phone: string | null;
  sourceUrl: string;
};

export type SecCounts = Record<SecView, number>;

export type SecInvestorCard = {
  id: string;
  firm: string;
  partner: string | null;
  geos: string[];
  themes: string[];
  excerpt: string;
  phone: string | null;
  sourceUrl: string;
  activityDate: string | null;
};

let wave: Wave | null = null;
let startupById: Map<string, PublicStartup> | null = null;
let investorById: Map<string, Investor> | null = null;
let screens: ReturnType<typeof classifyStartup>[] | null = null;
let counts: SecCounts | null = null;

async function load(): Promise<Wave> {
  if (wave && startupById && investorById && screens && counts) return wave;
  const raw = (await import("./sec-wave.json?raw")).default;
  const data = JSON.parse(raw) as Wave;
  const nextCounts: SecCounts = { candidates: 0, issuers: data.startups.length, other: 0, funds: 0, thin: 0 };
  const nextScreens = data.startups.map((company) => {
    const screen = classifyStartup(company, false);
    if (screen.label === "likely_early_stage_candidate" || screen.label === "possible_early_stage_candidate") nextCounts.candidates += 1;
    else if (screen.label === "likely_other") nextCounts.other += 1;
    else if (screen.label === "fund_issuer") nextCounts.funds += 1;
    else nextCounts.thin += 1;
    return screen;
  });
  wave = data;
  screens = nextScreens;
  counts = nextCounts;
  startupById = new Map(data.startups.map((company) => [company.id, company]));
  investorById = new Map(data.investors.map((firm) => [firm.id, firm]));
  return data;
}

function phoneOf(files: { text: string }[] | undefined): string | null {
  const text = (files ?? []).map((file) => file.text).join("\n");
  const match = text.match(/Phone:\s*([0-9][0-9().\- ]{6,20})/);
  return match?.[1]?.trim() ?? null;
}

export async function secStartup(id: string): Promise<PublicStartup | null> {
  const data = await load();
  const company = startupById?.get(id) ?? data.startups.find((item) => item.id === id);
  return company ? presentStartup(company) : null;
}

export async function secInvestor(id: string): Promise<Investor | null> {
  const data = await load();
  const firm = investorById?.get(id) ?? data.investors.find((item) => item.id === id);
  return firm ? presentInvestor(firm) : null;
}

export async function searchStartups(query: string, offset: number, limit: number, view: SecView): Promise<{ total: number; counts: SecCounts; rows: SecStartupCard[] }> {
  const data = await load();
  const needle = query.trim().toLowerCase();
  const matched: number[] = [];
  for (let index = 0; index < data.startups.length; index += 1) {
    const screen = screens![index];
    if (!matchesView(screen.label, view)) continue;
    if (needle) {
      const company = data.startups[index];
      const hay = `${company.name} ${company.summary} ${company.person ?? ""} ${screen.industry ?? ""}`.toLowerCase();
      if (!hay.includes(needle)) continue;
    }
    matched.push(index);
  }
  return {
    total: matched.length,
    counts: counts!,
    rows: matched.slice(offset, offset + limit).map((index) => {
      const company = data.startups[index];
      const screen = screens![index];
      return {
        id: company.id,
        name: company.name,
        stage: screen.display,
        summary: screen.summary,
        industry: screen.industry,
        offering: screen.offering.text,
        sold: screen.sold.text,
        person: company.person,
        phone: phoneOf(company.files),
        sourceUrl: company.sourceUrl,
      };
    }),
  };
}

export async function searchInvestors(query: string, offset: number, limit: number): Promise<{ total: number; rows: SecInvestorCard[] }> {
  const data = await load();
  const needle = query.trim().toLowerCase();
  const rows = needle
    ? data.investors.filter((firm) => `${firm.firm} ${firm.excerpt} ${firm.partner ?? ""} ${firm.geos.join(" ")} ${firm.themes.join(" ")}`.toLowerCase().includes(needle))
    : data.investors;
  return {
    total: rows.length,
    rows: rows.slice(offset, offset + limit).map((firm) => ({
      id: firm.id,
      firm: firm.firm,
      partner: firm.partner,
      geos: firm.geos.slice(0, 3),
      themes: firm.themes.slice(0, 2),
      excerpt: firm.excerpt,
      phone: phoneOf(firm.files),
      sourceUrl: firm.sourceUrl,
      activityDate: firm.activityDate,
    })),
  };
}
