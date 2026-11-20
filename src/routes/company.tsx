import { createFileRoute } from "@tanstack/react-router";
import { Frame } from "@/components/seedstage/shell";
import { Gate, Notice, Panel, TextField } from "@/components/seedstage/bits";
import { can } from "@/lib/seedstage/permissions";
import { useSeedstage } from "@/lib/seedstage/store";
import type { Company } from "@/lib/seedstage/types";

export const Route = createFileRoute("/company")({ component: CompanyPage });

const FIELDS: { key: keyof Omit<Company, "team">; label: string }[] = [
  { key: "legalName", label: "Legal name" },
  { key: "tradingName", label: "Trading name" },
  { key: "jurisdiction", label: "Jurisdiction" },
  { key: "registrationId", label: "Registration identifier" },
  { key: "website", label: "Website" },
  { key: "product", label: "Product" },
  { key: "businessModel", label: "Business model" },
  { key: "customers", label: "Customers" },
  { key: "geos", label: "Operating geography" },
  { key: "stage", label: "Stage" },
  { key: "founded", label: "Founded" },
  { key: "objective", label: "Fundraising objective" },
];

function CompanyPage() {
  const workspace = useSeedstage((state) => state.workspace);
  const setCompany = useSeedstage((state) => state.setCompany);
  const locked = !can(workspace.role, "edit_company");

  return (
    <Frame title="Company" lede="Unknown stays unknown. Every filled field keeps a source, or it is labelled as typed by someone in this workspace.">
      <div className="flex flex-col gap-4">
        <Gate action="edit_company">
          <Notice>Edits are stored in this browser and written into the audit trail.</Notice>
        </Gate>
        <Panel title={workspace.company.tradingName.value ?? "Unnamed company"}>
          <div className="grid gap-4 md:grid-cols-2">
            {FIELDS.map((field) => {
              const entry = workspace.company[field.key];
              return (
                <div key={field.key} className="flex flex-col gap-2">
                  <TextField label={field.label} value={entry.value ?? ""} disabled={locked} onChange={(value) => setCompany(field.key, value)} />
                  <p className="text-xs text-muted">
                    {entry.provenance ? `${entry.provenance.method.replaceAll("_", " ")} · ${entry.provenance.source} · ${entry.provenance.at.slice(0, 10)}` : "Unknown"}
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Team">
          {workspace.company.team.length === 0 ? <p className="text-sm text-muted">No people on file.</p> : (
            <ul className="flex flex-col gap-3">
              {workspace.company.team.map((person) => (
                <li key={person.id} className="text-sm">
                  <p>{person.name}</p>
                  <p className="text-muted">{person.role} · {person.provenance.source}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </Frame>
  );
}
