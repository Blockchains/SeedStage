import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RelationshipGraph } from "@/components/seedstage/relationship-graph";
import { Frame } from "@/components/seedstage/shell";
import { companyEntities } from "@/lib/seedstage/entities";
import { publicStartups } from "@/lib/seedstage/startups";
import { useSeedstage } from "@/lib/seedstage/store";

export const Route = createFileRoute("/graph")({ component: GraphPage });

function GraphPage() {
  const investors = useSeedstage((state) => state.workspace.investors);
  const options = publicStartups.filter((company) => company.person || company.funder);
  const [id, setId] = useState(options[0]?.id ?? "");
  const company = options.find((item) => item.id === id) ?? options[0];
  const rows = company ? companyEntities(company, investors) : [];

  return (
    <Frame title="Relationships">
      <label className="mb-4 flex flex-col gap-1 text-sm">
        <span className="text-muted">Company</span>
        <select className="min-h-11 max-w-md rounded-md border border-border bg-surface px-3" value={company?.id ?? ""} onChange={(event) => setId(event.target.value)}>
          {options.slice(0, 80).map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
      {company ? <RelationshipGraph rows={rows} /> : null}
      {company ? (
        <Link to="/startups/$id" params={{ id: company.id }} className="hit mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary">
          Open data room
        </Link>
      ) : null}
    </Frame>
  );
}
