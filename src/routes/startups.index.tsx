import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FirmLogo } from "@/components/seedstage/bits";
import { Frame } from "@/components/seedstage/shell";
import { publicStartups } from "@/lib/seedstage/startups";
import { startupDocuments } from "@/lib/seedstage/public-docs";

export const Route = createFileRoute("/startups/")({ component: StartupsPage });

function StartupsPage() {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(40);
  const needle = query.trim().toLowerCase();
  const rows = publicStartups.filter((company) => !needle || `${company.name} ${company.summary} ${company.stage} ${company.funder}`.toLowerCase().includes(needle));
  const visible = rows.slice(0, shown);
  return (
    <Frame title="Startups">
      <div className="mb-4">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setShown(40);
          }}
          placeholder="Search companies"
          aria-label="Search companies"
          className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm md:max-w-xs"
        />
      </div>
      <ul className="flex flex-col gap-3">
        {visible.map((company) => (
          <li key={company.id}>
            <Link to="/startups/$id" params={{ id: company.id }} className="hit flex items-start gap-3 rounded-md border border-border bg-surface p-4">
              <FirmLogo src={company.logo} name={company.name} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-base font-medium">{company.name}</span>
                  <span className="shrink-0 text-xs text-muted">{startupDocuments(company).length} files</span>
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-muted">{company.summary.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ")}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {shown < rows.length ? (
        <button type="button" className="hit mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary" onClick={() => setShown((count) => count + 40)}>
          Show more ({rows.length - shown})
        </button>
      ) : null}
    </Frame>
  );
}
