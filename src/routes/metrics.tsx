import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Frame } from "@/components/seedstage/shell";
import { exploreMetrics } from "@/lib/seedstage/metrics";
import { publicStartups } from "@/lib/seedstage/startups";
import { useSeedstage } from "@/lib/seedstage/store";

export const Route = createFileRoute("/metrics")({ component: MetricsPage });

const GROUPS = ["All", "Round", "Cash", "Directory", "Not on file"] as const;

function MetricsPage() {
  const workspace = useSeedstage((state) => state.workspace);
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("All");
  const [query, setQuery] = useState("");
  const rows = exploreMetrics({
    investors: workspace.investors,
    startups: publicStartups,
    claims: workspace.claims,
    round: workspace.roundDraft,
    plan: workspace.plan,
  }).filter((row) => (group === "All" || row.group === group) && (!query.trim() || `${row.name} ${row.group}`.toLowerCase().includes(query.trim().toLowerCase())));

  return (
    <Frame title="Metrics">
      <div className="mb-4 flex flex-col gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search metrics"
          aria-label="Search metrics"
          className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm md:max-w-xs"
        />
        <div className="flex gap-2 overflow-x-auto">
          {GROUPS.map((item) => (
            <button key={item} type="button" className={`hit inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm ${group === item ? "bg-canvas text-canvas-fg" : "border border-border bg-surface"}`} onClick={() => setGroup(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <ul className="overflow-hidden rounded-xl border border-border bg-surface">
        {rows.map((row) => (
          <li key={row.id} className="flex min-h-14 items-center justify-between gap-3 border-t border-border px-4 first:border-t-0">
            <span className="min-w-0">
              <span className="block text-sm font-medium">{row.name}</span>
              <span className="block text-xs text-muted">{row.group}</span>
            </span>
            <span className="num shrink-0 text-sm">{row.value ?? "—"}</span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
