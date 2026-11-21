import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Frame } from "@/components/seedstage/shell";
import { UPSTREAM, type UpstreamMode } from "@/lib/seedstage/upstream";

export const Route = createFileRoute("/stack")({ component: StackPage });

const FILTERS = ["All", "wired", "pinned", "not-adopted"] as const;

function StackPage() {
  const [mode, setMode] = useState<(typeof FILTERS)[number]>("All");
  const rows = UPSTREAM.filter((item) => mode === "All" || item.mode === mode);
  return (
    <Frame title="Stack">
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((item) => (
          <button key={item} type="button" className={`hit inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm ${mode === item ? "bg-canvas text-canvas-fg" : "border border-border bg-surface"}`} onClick={() => setMode(item)}>
            {item === "All" ? "All" : item}
          </button>
        ))}
      </div>
      <ul className="overflow-hidden rounded-xl border border-border bg-surface">
        {rows.map((item) => (
          <li key={item.id} className="border-t border-border px-4 py-4 first:border-t-0">
            <div className="flex items-baseline justify-between gap-3">
              <a className="text-sm font-semibold" href={item.repo} target="_blank" rel="noreferrer">{item.name}</a>
              <span className="text-xs text-muted">{label(item.mode)}</span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted">{item.role}</p>
            <p className="num mt-1 text-xs text-muted">{item.commit.slice(0, 12)}</p>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function label(mode: UpstreamMode): string {
  if (mode === "wired") return "In this app";
  if (mode === "pinned") return "Pinned";
  return "Not adopted";
}
