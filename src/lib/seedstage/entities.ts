import type { PublicStartup } from "./startups.ts";
import type { Investor } from "./types.ts";

export type EntityRow = {
  id: string;
  kind: "Company" | "Person" | "Investor";
  name: string;
  relation: string;
  source: string;
};

export function companyEntities(company: PublicStartup, investors: Investor[]): EntityRow[] {
  const rows: EntityRow[] = [
    { id: `${company.id}-co`, kind: "Company", name: company.name, relation: "Subject", source: company.sourceUrl },
  ];
  if (company.person?.trim()) {
    rows.push({ id: `${company.id}-person`, kind: "Person", name: company.person.trim(), relation: "Named on the source", source: company.sourceUrl });
  }
  const funder = company.funder.trim();
  if (funder) {
    const match = investors.find((investor) => investor.firm.toLowerCase() === funder.toLowerCase());
    rows.push({
      id: `${company.id}-backer`,
      kind: "Investor",
      name: match?.firm ?? funder,
      relation: "Named backer",
      source: match?.sourceUrl ?? company.sourceUrl,
    });
  }
  return rows;
}
