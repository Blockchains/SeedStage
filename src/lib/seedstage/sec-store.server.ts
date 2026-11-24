import type { PublicStartup } from "./startups.ts";
import type { Investor } from "./types.ts";

type Wave = { startups: PublicStartup[]; investors: Investor[] };

export type SecStartupCard = {
  id: string;
  name: string;
  stage: string;
  summary: string;
  person: string | null;
  round: string | null;
  phone: string | null;
  sourceUrl: string;
};

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

async function load(): Promise<Wave> {
  if (wave && startupById && investorById) return wave;
  const raw = (await import("./sec-wave.json?raw")).default;
  wave = JSON.parse(raw) as Wave;
  startupById = new Map(wave.startups.map((company) => [company.id, company]));
  investorById = new Map(wave.investors.map((firm) => [firm.id, firm]));
  return wave;
}

function phoneOf(files: { text: string }[] | undefined): string | null {
  const text = (files ?? []).map((file) => file.text).join("\n");
  const match = text.match(/Phone:\s*([0-9][0-9().\- ]{6,20})/);
  return match?.[1]?.trim() ?? null;
}

export async function secStartup(id: string): Promise<PublicStartup | null> {
  const data = await load();
  return startupById?.get(id) ?? data.startups.find((company) => company.id === id) ?? null;
}

export async function secInvestor(id: string): Promise<Investor | null> {
  const data = await load();
  return investorById?.get(id) ?? data.investors.find((firm) => firm.id === id) ?? null;
}

export async function searchStartups(query: string, offset: number, limit: number): Promise<{ total: number; rows: SecStartupCard[] }> {
  const data = await load();
  const needle = query.trim().toLowerCase();
  const rows = needle
    ? data.startups.filter((company) => `${company.name} ${company.summary} ${company.person ?? ""}`.toLowerCase().includes(needle))
    : data.startups;
  return {
    total: rows.length,
    rows: rows.slice(offset, offset + limit).map((company) => ({
      id: company.id,
      name: company.name,
      stage: company.stage,
      summary: company.summary,
      person: company.person,
      round: company.round,
      phone: phoneOf(company.files),
      sourceUrl: company.sourceUrl,
    })),
  };
}

export async function searchInvestors(query: string, offset: number, limit: number): Promise<{ total: number; rows: SecInvestorCard[] }> {
  const data = await load();
  const needle = query.trim().toLowerCase();
  const rows = needle
    ? data.investors.filter((firm) => `${firm.firm} ${firm.excerpt} ${firm.partner ?? ""} ${firm.geos.join(" ")}`.toLowerCase().includes(needle))
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
