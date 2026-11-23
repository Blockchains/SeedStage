import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Frame } from "@/components/seedstage/shell";
import { FirmLogo } from "@/components/seedstage/bits";
import { readDeck } from "@/lib/seedstage/deck";
import { parseBrief, rankInvestors, type FitResult } from "@/lib/seedstage/fit";
import { publicStartups } from "@/lib/seedstage/startups";
import { useSeedstage } from "@/lib/seedstage/store";
import { pageHead } from "@/lib/seedstage/seo";

export const Route = createFileRoute("/match")({
  component: MatchPage,
  head: () => pageHead("/match", "Match — SeedStage", "Drop a seed deck. Ranked by investor fit and evidence, not by a chance of funding."),
});

const AS_OF = "2026-11-23";

function MatchPage() {
  const investors = useSeedstage((state) => state.workspace.investors);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [adjust, setAdjust] = useState(false);
  const [stage, setStage] = useState("");
  const [geos, setGeos] = useState("");
  const [sectors, setSectors] = useState("");
  const [show, setShow] = useState<"ELIGIBLE" | "VERIFY" | "EXCLUDED">("ELIGIBLE");

  const comparables = useMemo(() => publicStartups.map((company) => ({ name: company.name, summary: company.summary, stage: company.stage })), []);
  const brief = useMemo(() => {
    if (!text.trim()) return null;
    const parsed = parseBrief(text, AS_OF);
    return {
      ...parsed,
      stage: stage || parsed.stage,
      geos: split(geos).length > 0 ? split(geos) : parsed.geos,
      sectors: split(sectors).length > 0 ? split(sectors) : parsed.sectors,
      needLead: true,
    };
  }, [text, stage, geos, sectors]);
  const ranked = useMemo(() => (brief ? rankInvestors(investors, brief, comparables) : []), [brief, investors, comparables]);
  const visible = ranked.filter((item) => item.eligibility === show).slice(0, 12);
  const counts = {
    ELIGIBLE: ranked.filter((item) => item.eligibility === "ELIGIBLE").length,
    VERIFY: ranked.filter((item) => item.eligibility === "VERIFY").length,
    EXCLUDED: ranked.filter((item) => item.eligibility === "EXCLUDED").length,
  };

  async function takeFile(file: File) {
    setError("");
    setReading(true);
    setFileName(file.name);
    try {
      if (file.size > 6_000_000) throw new Error("Use a deck under 6 MB.");
      if (/\.(txt|md|csv)$/i.test(file.name) || file.type.startsWith("text/")) {
        setText((await file.text()).slice(0, 12000));
        return;
      }
      const data = await file.arrayBuffer();
      const result = await readDeck({ data: { name: file.name, data: bytesToBase64(new Uint8Array(data)) } });
      setText(result.text);
    } catch (cause) {
      setText("");
      setError(cause instanceof Error ? cause.message : "That deck could not be read.");
    } finally {
      setReading(false);
    }
  }

  return (
    <Frame title="Match" lede="Drop a deck. The list is investment fit, not a chance of funding.">
      <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-5 py-8 text-center">
        <input
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx,.odt,.odp,.txt,.md,application/pdf"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void takeFile(file);
          }}
        />
        <span className="text-lg font-semibold tracking-display">{reading ? "Reading" : fileName || "Drop a deck"}</span>
        <span className="mt-1 text-sm text-muted">PDF, PowerPoint, Word, or text</span>
      </label>
      {error ? <p className="mt-3 text-sm">{error}</p> : null}
      {brief ? (
        <section className="mt-6 min-w-0">
          <p className="text-sm text-muted">{brief.name} · {brief.stage} · {brief.geos.join(", ") || "Place not stated"} · {brief.sectors.join(", ") || "Sector not stated"}</p>
          <button type="button" className="hit mt-1 inline-flex min-h-11 items-center text-sm font-medium text-primary" onClick={() => setAdjust((value) => !value)}>
            {adjust ? "Hide" : "Adjust"}
          </button>
          {adjust ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <select value={stage || brief.stage} onChange={(event) => setStage(event.target.value)} aria-label="Stage" className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm">
                <option value="pre-seed">Pre-seed</option>
                <option value="seed">Seed</option>
                <option value="series a">Series A</option>
              </select>
              <input value={geos} placeholder="Geography" aria-label="Geography" onChange={(event) => setGeos(event.target.value)} className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm" />
              <input value={sectors} placeholder="Sectors" aria-label="Sectors" onChange={(event) => setSectors(event.target.value)} className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm" />
            </div>
          ) : null}
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {(["ELIGIBLE", "VERIFY", "EXCLUDED"] as const).map((item) => (
              <button key={item} type="button" className={`hit inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm ${show === item ? "bg-canvas text-canvas-fg" : "border border-border bg-surface"}`} onClick={() => setShow(item)}>
                {item === "ELIGIBLE" ? "Eligible" : item === "VERIFY" ? "Verify" : "Excluded"} {counts[item]}
              </button>
            ))}
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {visible.map((item) => <Card key={item.investorId} item={item} />)}
            {visible.length === 0 ? <li className="text-sm text-muted">Nothing in this group.</li> : null}
          </ul>
        </section>
      ) : null}
    </Frame>
  );
}

function Card({ item }: { item: FitResult }) {
  const investor = useSeedstage((state) => state.workspace.investors.find((firm) => firm.id === item.investorId));
  return (
    <li className="min-w-0 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <FirmLogo src={investor?.logo ?? ""} name={item.firm} className="size-10" />
        <div className="min-w-0 flex-1">
          <Link to="/investors/$id" params={{ id: item.investorId }} className="break-words text-base font-semibold tracking-display">{item.firm}</Link>
          <p className="mt-1 text-sm">{item.eligibility === "EXCLUDED" ? "Excluded" : `${item.label} · Fit ${item.fit}`}</p>
        </div>
      </div>
      <p className="mt-3 break-words text-sm text-muted">{item.blockers[0] ?? item.reasons[0] ?? item.unknowns[0]}</p>
      <p className="mt-2 text-sm">{item.next}</p>
    </li>
  );
}

function split(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}
