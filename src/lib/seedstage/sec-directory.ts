import { createServerFn } from "@tanstack/react-start";
import type { SecCounts, SecInvestorCard, SecStartupCard } from "./sec-store.server.ts";
import type { SecView } from "./sec-class.ts";
import type { PublicStartup } from "./startups.ts";
import type { Investor } from "./types.ts";

const VIEWS: readonly SecView[] = ["candidates", "issuers", "other", "funds", "thin"];

function page(input: { q?: string; offset?: number; view?: string } | undefined): { q: string; offset: number; limit: number; view: SecView } {
  const q = String(input?.q ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  const offset = Math.max(0, Math.min(80_000, Math.floor(Number(input?.offset) || 0)));
  const requested = String(input?.view ?? "candidates");
  const view = VIEWS.includes(requested as SecView) ? (requested as SecView) : "candidates";
  return { q, offset, limit: 40, view };
}

function filingId(input: { id?: string } | undefined): string {
  const id = String(input?.id ?? "");
  return /^sec-\d{1,12}$/.test(id) ? id : "";
}

export const searchSecStartups = createServerFn({ method: "POST" })
  .validator(page)
  .handler(async ({ data }): Promise<{ total: number; counts: SecCounts; rows: SecStartupCard[] }> => {
    const store = await import("./sec-store.server.ts");
    return store.searchStartups(data.q, data.offset, data.limit, data.view);
  });

export const searchSecInvestors = createServerFn({ method: "POST" })
  .validator(page)
  .handler(async ({ data }): Promise<{ total: number; rows: SecInvestorCard[] }> => {
    const store = await import("./sec-store.server.ts");
    return store.searchInvestors(data.q, data.offset, data.limit);
  });

export const readSecStartup = createServerFn({ method: "POST" })
  .validator(filingId)
  .handler(async ({ data }): Promise<PublicStartup | null> => {
    if (!data) return null;
    const store = await import("./sec-store.server.ts");
    return store.secStartup(data);
  });

export const readSecInvestor = createServerFn({ method: "POST" })
  .validator(filingId)
  .handler(async ({ data }): Promise<Investor | null> => {
    if (!data) return null;
    const store = await import("./sec-store.server.ts");
    return store.secInvestor(data);
  });
