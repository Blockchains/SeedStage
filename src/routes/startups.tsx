import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FirmLogo } from "@/components/seedstage/bits";
import { Frame } from "@/components/seedstage/shell";
import { publicStartups } from "@/lib/seedstage/startups";

export const Route = createFileRoute("/startups")({ component: StartupsPage });

function StartupsPage() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const rows = publicStartups.filter((company) => !needle || `${company.name} ${company.summary} ${company.stage} ${company.funder}`.toLowerCase().includes(needle));
  return (
    <Frame title="Startups">
      <div className="mb-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search companies"
          aria-label="Search companies"
          className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm md:max-w-xs"
        />
      </div>
      <ul className="flex flex-col gap-3">
        {rows.map((company) => (
          <li key={company.id} className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <a className="hit flex items-center gap-2 text-base font-medium" href={company.website} target="_blank" rel="noreferrer">
                <FirmLogo src={company.logo} name={company.name} />
                {company.name}
              </a>
              <span className="text-xs text-muted">{company.stage}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{company.summary}</p>
            {company.round ? <p className="mt-2 text-sm text-muted">{company.round}</p> : null}
            <div className="mt-2 flex flex-wrap gap-4">
              <Link to="/startups/$id" params={{ id: company.id }} className="hit inline-flex min-h-11 items-center text-sm font-medium text-primary">Data room</Link>
              <a className="hit inline-flex min-h-11 items-center text-sm font-medium text-primary" href={company.website} target="_blank" rel="noreferrer">Website</a>
            </div>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
