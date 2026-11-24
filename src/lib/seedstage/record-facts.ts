import { formatMoney } from "./money.ts";
import type { PublicStartup } from "./startups.ts";
import type { Investor } from "./types.ts";

export type Fact = { label: string; value: string };

const PAGE_LABELS: [string, string][] = [
  ["Industry as reported", "Industry"],
  ["Revenue range as reported", "Revenue"],
  ["Entity type", "Entity"],
  ["Jurisdiction", "Jurisdiction"],
  ["First sale", "First sale"],
  ["Amendment", "Amendment"],
  ["Securities as reported", "Securities"],
  ["Business combination", "Business combination"],
  ["Investors already invested (count only)", "Investors on the filing"],
  ["Minimum accepted on the filing", "Minimum accepted"],
  ["Federal exemptions", "Exemptions"],
  ["Fund type on the form", "Fund type"],
];

function labeledMap(text: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const line of text.split("\n")) {
    const match = /^([A-Za-z][^:]{1,70}):\s+(\S.*)$/.exec(line.trim());
    if (!match || found.has(match[1])) continue;
    found.set(match[1], match[2].trim());
  }
  return found;
}

function fileText(files: { text: string }[] | undefined): string {
  return (files ?? []).map((file) => file.text).join("\n");
}

function add(rows: Fact[], label: string, value: string | null | undefined) {
  const next = value?.replace(/\s+/g, " ").trim();
  if (!next || rows.some((row) => row.label === label)) return;
  rows.push({ label, value: next });
}

function host(url: string): string | null {
  if (!url || url.includes("sec.gov")) return null;
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function startupFacts(company: PublicStartup, scope: "card" | "page" = "page"): Fact[] {
  const labeled = labeledMap(fileText(company.files));
  const rows: Fact[] = [];
  add(rows, "Stage", company.stage);
  add(rows, "Industry", labeled.get("Industry as reported"));
  const offering = labeled.get("Offering amount");
  const round = company.round?.trim() ?? "";
  if (offering) add(rows, "Offering amount", offering);
  else if (/^\$[\d,]+$/.test(round)) add(rows, "Offering amount", round);
  else add(rows, "Round", round);
  add(rows, "Amount sold", labeled.get("Amount sold") ?? labeled.get("Amount sold on the filing"));
  const people = labeled.get("People named on the filing") ?? company.person;
  add(rows, people && people.includes(";") ? "People" : "Person", people);
  add(rows, "Phone", labeled.get("Phone"));
  add(rows, "Backer", company.funder);
  if (scope === "card") return rows;
  add(rows, "Amount remaining", labeled.get("Amount remaining"));
  const incorporated = [labeled.get("Incorporation year as reported"), labeled.get("Incorporation timing")].filter(Boolean).join(" · ");
  add(rows, "Incorporated", incorporated);
  for (const [from, to] of PAGE_LABELS) add(rows, to, labeled.get(from));
  add(rows, "Address", labeled.get("Issuer address") ?? labeled.get("Address"));
  add(rows, "Website", host(company.website));
  add(rows, "Source", company.source);
  return rows;
}

export function investorFacts(investor: Investor, scope: "card" | "page" = "page"): Fact[] {
  const labeled = labeledMap(fileText(investor.files));
  const rows: Fact[] = [];
  add(rows, "Fund", investor.fund && investor.fund !== investor.firm && !investor.fund.startsWith("Not named") ? investor.fund : null);
  add(rows, "Partner", investor.partner ?? labeled.get("People named on the filing")?.split(";")[0]?.trim());
  add(rows, "Stage", investor.stages.join(", "));
  add(rows, "Geography", investor.geos.slice(0, 4).join(", "));
  if (investor.chequeMaxMinor > 0) add(rows, "Cheque", `${formatMoney(investor.chequeMinMinor, investor.currency)}–${formatMoney(investor.chequeMaxMinor, investor.currency)}`);
  if (investor.participation !== "unstated") add(rows, "Role", investor.participation);
  add(rows, "Fund type", labeled.get("Fund type on the form") ?? (investor.source.includes("SEC") ? investor.themes[0] : null));
  add(rows, "Focus", investor.source.includes("SEC") ? null : investor.themes.join(" · "));
  add(rows, "Phone", labeled.get("Phone"));
  if (scope === "card") return rows;
  const names = investor.portfolio;
  add(rows, "Portfolio", names.length > 12 ? `${names.slice(0, 12).join(", ")} +${names.length - 12}` : names.join(", "));
  add(rows, "Address", labeled.get("Issuer address") ?? labeled.get("Address"));
  add(rows, "Activity", investor.activityDate);
  add(rows, "Source", investor.source);
  return rows;
}
