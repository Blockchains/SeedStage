import type { RoomCategory } from "./room.ts";
import type { PublicStartup } from "./startups.ts";
import type { Investor } from "./types.ts";
import { formatMoney } from "./money.ts";

export type HeldDocument = {
  id: string;
  title: string;
  category: string;
  text: string;
};

function fileCategory(title: string): RoomCategory {
  const name = title.toLowerCase();
  if (/security|privacy|trust/.test(name)) return "09 Security and privacy";
  if (/customer|commercial|case/.test(name)) return "05 Commercial evidence";
  if (/product|platform|technology/.test(name)) return "06 Product and technology";
  if (/patent|intellectual/.test(name)) return "07 Intellectual property";
  if (/team|people|founder/.test(name)) return "08 People and agreements";
  if (/financ|account|revenue/.test(name)) return "04 Financial information";
  if (/risk|dispute/.test(name)) return "10 Material risks and disputes";
  if (/fund|round|raise/.test(name)) return "11 Funding plan";
  if (/corporate|legal|articles/.test(name)) return "02 Corporate records";
  return "01 Company overview";
}

export function startupDocuments(company: PublicStartup): HeldDocument[] {
  const documents: HeldDocument[] = [];
  const overview = [company.summary.trim(), company.website.trim() ? `Website: ${company.website.trim()}` : "", company.source.trim() ? `Source: ${company.source.trim()}` : ""]
    .filter(Boolean)
    .join("\n\n");
  if (overview) documents.push({ id: "overview", title: "Public description", category: "01 Company overview", text: overview });
  if (company.person?.trim()) documents.push({ id: "people", title: company.person.trim(), category: "08 People and agreements", text: company.person.trim() });
  const financing = [company.stage.trim() ? `Stage: ${company.stage.trim()}` : "", company.round?.trim() ?? "", company.funder.trim() ? `Named backer: ${company.funder.trim()}` : ""]
    .filter(Boolean)
    .join("\n");
  if (financing) documents.push({ id: "financing", title: "Named financing", category: "03 Ownership and financing", text: financing });
  for (const [index, file] of (company.files ?? []).entries()) {
    if (!file.text.trim()) continue;
    documents.push({ id: `file-${index}`, title: file.title, category: fileCategory(file.title), text: file.text.trim() });
  }
  return documents;
}

export function investorDocuments(investor: Investor): HeldDocument[] {
  const documents: HeldDocument[] = [];
  if (investor.excerpt.trim()) documents.push({ id: "profile", title: "Firm", category: "Firm", text: investor.excerpt.trim() });
  if (investor.geos.length > 0) documents.push({ id: "geography", title: "Geography", category: "Geography", text: investor.geos.join(", ") });
  if (investor.stages.length > 0) documents.push({ id: "stage", title: "Stage", category: "Stage", text: investor.stages.join(", ") });
  if (investor.chequeMaxMinor > 0) {
    documents.push({
      id: "cheque",
      title: "Cheque",
      category: "Cheque",
      text: `${formatMoney(investor.chequeMinMinor, investor.currency)}–${formatMoney(investor.chequeMaxMinor, investor.currency)}`,
    });
  }
  if (investor.themes.length > 0) documents.push({ id: "themes", title: "Themes", category: "Themes", text: investor.themes.join(" · ") });
  if (investor.partner) documents.push({ id: "people", title: "People", category: "People", text: investor.partner });
  if (investor.portfolio.length > 0) documents.push({ id: "portfolio", title: "Portfolio", category: "Portfolio", text: investor.portfolio.join(", ") });
  for (const [index, file] of (investor.files ?? []).entries()) {
    if (!file.text.trim()) continue;
    documents.push({ id: `file-${index}`, title: file.title, category: file.title, text: file.text.trim() });
  }
  return documents;
}

export const STARTUP_FOLDERS = [
  "01 Company overview",
  "02 Corporate records",
  "03 Ownership and financing",
  "04 Financial information",
  "05 Commercial evidence",
  "06 Product and technology",
  "07 Intellectual property",
  "08 People and agreements",
  "09 Security and privacy",
  "10 Material risks and disputes",
  "11 Funding plan",
] as const;
