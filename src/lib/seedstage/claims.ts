import type { Claim, Contradiction } from "./types.ts";

export function contradictionId(metricKey: string, period: string): string {
  return `x-${metricKey}-${period}`;
}

/** Conflicting accepted-or-pending numbers stay in conflict. Nothing is auto-selected. */
export function findContradictions(claims: Claim[]): Contradiction[] {
  const groups = new Map<string, Claim[]>();
  for (const claim of claims) {
    if (claim.status === "rejected") continue;
    if (!claim.metricKey || !claim.period || claim.value === null) continue;
    const key = `${claim.metricKey}::${claim.period}::${claim.currency ?? ""}`;
    const list = groups.get(key) ?? [];
    list.push(claim);
    groups.set(key, list);
  }
  const out: Contradiction[] = [];
  for (const [key, group] of groups) {
    const values = new Set(group.map((claim) => claim.value));
    if (values.size < 2) continue;
    const [metricKey, period] = key.split("::");
    out.push({
      id: contradictionId(metricKey, period),
      metricKey,
      period,
      claimIds: group.map((claim) => claim.id),
      note: "Two or more unrejected observations disagree. SeedStage does not pick the more attractive figure.",
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

export type ParsedClaim = {
  text: string;
  metricKey: string | null;
  period: string | null;
  value: number | null;
  unit: string | null;
  currency: string | null;
  kind: Claim["kind"];
  evidenceQuote: string;
};

export function parseStructuredClaims(source: string): { claims: ParsedClaim[]; note: string } {
  const blocks = source.split(/^--- claim ---\s*$/m).map((b) => b.trim()).filter(Boolean);
  const claims: ParsedClaim[] = [];
  if (!source.includes("--- claim ---")) {
    return { claims: [], note: "No structured claims found. Nothing was inferred from free text." };
  }
  for (const block of blocks) {
    const lines = Object.fromEntries(
      block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.includes(":"))
        .map((line) => {
          const idx = line.indexOf(":");
          return [line.slice(0, idx).trim().toLowerCase(), line.slice(idx + 1).trim()];
        }),
    );
    if (!lines.text) continue;
    const kind = lines.kind === "forecast" || lines.kind === "founder_statement" ? lines.kind : "historical";
    const value = lines.value ? Number(lines.value) : null;
    claims.push({
      text: lines.text,
      metricKey: lines.metric || null,
      period: lines.period || null,
      value: value !== null && Number.isFinite(value) ? value : null,
      unit: lines.unit || null,
      currency: lines.currency || null,
      kind,
      evidenceQuote: lines.text,
    });
  }
  return {
    claims,
    note: claims.length ? "Structured blocks parsed. They still need review." : "Claim markers were present but no text fields could be read.",
  };
}

export function quoteIsInSource(quote: string, source: string): boolean {
  const norm = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();
  const q = norm(quote);
  if (q.length < 12) return false;
  return norm(source).includes(q);
}
export function authorityFromUntrustedText(_text: string): { actions: []; mutate: false } {
  return { actions: [], mutate: false };
}
