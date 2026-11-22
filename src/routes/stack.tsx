import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Frame } from "@/components/seedstage/shell";
import { readLocalServices, type ServiceLive } from "@/lib/seedstage/services";
import { UPSTREAM, type UpstreamMode } from "@/lib/seedstage/upstream";

import { pageHead } from "@/lib/seedstage/seo";

export const Route = createFileRoute("/stack")({
  component: StackPage,
  head: () => pageHead("/stack", "Stack — SeedStage", "Services this workspace can reach, and the ones it cannot."),
});

const FILTERS = ["All", "wired", "forked", "not-adopted"] as const;

function StackPage() {
  const [mode, setMode] = useState<(typeof FILTERS)[number]>("All");
  const [live, setLive] = useState<ServiceLive[] | null>(null);
  const rows = UPSTREAM.filter((item) => mode === "All" || item.mode === mode);
  useEffect(() => {
    let current = true;
    readLocalServices()
      .then((items) => {
        if (current) setLive(items);
      })
      .catch(() => {
        if (current) setLive([]);
      });
    return () => {
      current = false;
    };
  }, []);
  return (
    <Frame title="Stack">
      <ul className="mb-4 overflow-hidden rounded-xl border border-border bg-surface">
        {(live ?? []).map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-3 border-t border-border px-4 py-3 first:border-t-0">
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{item.name}</span>
              <span className="block truncate text-xs text-muted">{item.detail}</span>
            </span>
            <span className="text-xs text-muted">{item.running ? "Up" : "Down"}</span>
          </li>
        ))}
        {live === null ? <li className="px-4 py-3 text-sm text-muted">Checking</li> : null}
      </ul>
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
            {item.fork ? <a className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-primary" href={item.fork} target="_blank" rel="noreferrer">Fork</a> : null}
            <p className="num mt-1 text-xs text-muted">{item.commit.slice(0, 12)}</p>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function label(mode: UpstreamMode): string {
  if (mode === "wired") return "Running";
  if (mode === "forked") return "Forked";
  return "Not adopted";
}
