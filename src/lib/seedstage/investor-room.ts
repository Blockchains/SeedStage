import { formatMoney } from "./money.ts";
import type { PublicStartup } from "./startups.ts";
import type { Investor } from "./types.ts";

export type InvestorRoomLine = { label: string; value: string };

export type InvestorRoomSection = {
  id: string;
  label: string;
  lines: InvestorRoomLine[];
};

export function buildInvestorRoom(investor: Investor): { sections: InvestorRoomSection[]; missing: string[]; sourceUrl: string } {
  const sections: InvestorRoomSection[] = [];
  if (investor.excerpt.trim()) {
    sections.push({ id: "profile", label: "Firm", lines: [{ label: "From the firm site", value: investor.excerpt.trim() }] });
  }
  if (investor.geos.length > 0) {
    sections.push({ id: "geography", label: "Geography", lines: [{ label: "Places named", value: investor.geos.join(", ") }] });
  }
  if (investor.stages.length > 0) {
    sections.push({ id: "stage", label: "Stage", lines: [{ label: "Stage on the site", value: investor.stages.join(", ") }] });
  }
  if (investor.chequeMaxMinor > 0) {
    sections.push({
      id: "cheque",
      label: "Cheque",
      lines: [{ label: "Range on the site", value: `${formatMoney(investor.chequeMinMinor, investor.currency)}–${formatMoney(investor.chequeMaxMinor, investor.currency)}` }],
    });
  }
  if (investor.themes.length > 0) {
    sections.push({ id: "themes", label: "Themes", lines: [{ label: "Named on the site", value: investor.themes.join(" · ") }] });
  }
  if (investor.partner) {
    sections.push({ id: "people", label: "People", lines: [{ label: "Named", value: investor.partner }] });
  }
  if (investor.portfolio.length > 0) {
    sections.push({ id: "portfolio", label: "Portfolio", lines: [{ label: "Named on the site", value: investor.portfolio.join(", ") }] });
  }
  for (const [index, file] of (investor.files ?? []).entries()) {
    if (!file.text.trim()) continue;
    sections.push({ id: `file-${index}`, label: file.title, lines: [{ label: file.title, value: file.text.trim() }] });
  }
  const have = new Set(sections.map((section) => section.id));
  const missing = [
    ["geography", "Geography"],
    ["stage", "Stage"],
    ["cheque", "Cheque"],
    ["themes", "Themes"],
    ["people", "People"],
    ["portfolio", "Portfolio"],
  ].filter(([id]) => !have.has(id)).map(([, label]) => label);
  return { sections, missing, sourceUrl: investor.sourceUrl };
}

export function linkedPortfolio(investor: Investor, startups: PublicStartup[]): PublicStartup[] {
  const names = new Set(investor.portfolio.map((name) => name.trim().toLowerCase()));
  return startups.filter((startup) => names.has(startup.name.trim().toLowerCase()));
}
