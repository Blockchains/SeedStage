import { createServerFn } from "@tanstack/react-start";
import type { SecInvestorCard, SecStartupCard } from "./sec-store.server.ts";
import type { PublicStartup } from "./startups.ts";
import type { Investor } from "./types.ts";

function page(input: { q?: string; offset?: number } | undefined): { q: string; offset: number; limit: number } {
  const q = String(input?.q ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  const offset = Math.max(0, Math.min(80_000, Math.floor(Number(input?.offset) || 0)));
  return { q, offset, limit: 40 };
}

function filingId(input: { id?: string } | undefined): string {
  const id = String(input?.id ?? "");
  return /^sec-\d{1,12}$/.test(id) ? id : "";
}

export const searchSecStartups = createServerFn({ method: "POST" })
  .validator(page)
  .handler(async ({ data }): Promise<{ total: number; rows: SecStartupCard[] }> => {
    const store = await import("./sec-store.server.ts");
    return store.searchStartups(data.q, data.offset, data.limit);
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
