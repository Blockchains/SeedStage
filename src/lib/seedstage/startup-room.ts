import type { PublicStartup } from "./startups.ts";

export type StartupRoomLine = { label: string; value: string };

export type StartupRoomSection = {
  id: string;
  label: string;
  lines: StartupRoomLine[];
};

const CLOSED = ["Corporate records", "Financial statements", "Customers", "Product documents", "Intellectual property", "Security", "Risks", "Funding plan"] as const;

export function buildStartupRoom(company: PublicStartup): { sections: StartupRoomSection[]; missing: string[]; sourceUrl: string } {
  const sections: StartupRoomSection[] = [];
  const overview: StartupRoomLine[] = [];
  if (company.summary.trim()) overview.push({ label: "Public description", value: company.summary.trim() });
  if (company.website.trim()) overview.push({ label: "Website", value: company.website.trim() });
  if (company.source.trim()) overview.push({ label: "Source", value: company.source.trim() });
  if (overview.length > 0) sections.push({ id: "overview", label: "Company", lines: overview });

  if (company.person?.trim()) {
    sections.push({ id: "people", label: "People", lines: [{ label: "Named on the source", value: company.person.trim() }] });
  }

  const financing: StartupRoomLine[] = [];
  if (company.stage.trim()) financing.push({ label: "Stage on the source", value: company.stage.trim() });
  if (company.round?.trim()) financing.push({ label: "Round on the source", value: company.round.trim() });
  if (company.funder.trim()) financing.push({ label: "Named backer", value: company.funder.trim() });
  if (financing.length > 0) sections.push({ id: "financing", label: "Financing", lines: financing });

  for (const [index, file] of (company.files ?? []).entries()) {
    if (!file.text.trim()) continue;
    sections.push({ id: `file-${index}`, label: file.title, lines: [{ label: file.title, value: file.text.trim() }] });
  }

  const missing = [
    ...(sections.some((section) => section.id === "people") ? [] : ["People"]),
    ...(sections.some((section) => section.id === "financing") ? [] : ["Financing"]),
    ...CLOSED,
  ];
  return { sections, missing, sourceUrl: company.sourceUrl };
}
