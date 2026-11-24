import { useState, type ReactNode } from "react";
import type { Fact } from "@/lib/seedstage/record-facts";

export function FactGrid({ facts }: { facts: Fact[] }) {
  if (facts.length === 0) return null;
  return (
    <dl className="grid overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.label} className="min-w-0 bg-surface px-4 py-3">
          <dt className="text-xs text-muted">{fact.label}</dt>
          <dd className="mt-1 text-sm font-medium leading-snug break-words">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FactList({ facts }: { facts: Fact[] }) {
  if (facts.length === 0) return null;
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
      {facts.map((fact) => (
        <div key={fact.label} className="min-w-0">
          <dt className="text-xs text-muted">{fact.label}</dt>
          <dd className="mt-0.5 text-sm leading-snug break-words">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MoreDisclosure({ children }: { children: ReactNode }) {
  return (
    <details className="group mt-1">
      <summary className="hit flex min-h-11 cursor-pointer list-none items-center text-sm font-medium text-primary [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">More</span>
        <span className="hidden group-open:inline">Less</span>
      </summary>
      <div className="pb-1">{children}</div>
    </details>
  );
}

export function MorePanel({ count, children }: { count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  if (count <= 0) return null;
  return (
    <section className="mt-4">
      <button type="button" className="hit inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? "Less" : "More"}
        <span className="text-xs font-normal text-muted">{count.toLocaleString("en-GB")} {count === 1 ? "file" : "files"}</span>
      </button>
      {open ? <div className="mt-2">{children}</div> : null}
    </section>
  );
}
