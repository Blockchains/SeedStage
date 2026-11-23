import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Frame } from "@/components/seedstage/shell";
import { FirmLogo } from "@/components/seedstage/bits";
import { parseBrief, rankInvestors, type FitResult } from "@/lib/seedstage/fit";
import { publicStartups } from "@/lib/seedstage/startups";
import { useSeedstage } from "@/lib/seedstage/store";
import { pageHead } from "@/lib/seedstage/seo";

export const Route = createFileRoute("/match")({
  component: MatchPage,
  head: () => pageHead("/match", "Match — SeedStage", "Upload a startup description and rank seed investors by fit and evidence, not by a chance of funding."),
});

const AS_OF = "2026-11-23";

function MatchPage() {
  const investors = useSeedstage((state) => state.workspace.investors);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [stage, setStage] = useState("seed");
  const [geos, setGeos] = useState("");
  const [sectors, setSectors] = useState("");
  const [raise, setRaise] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [needLead, setNeedLead] = useState(true);
  const [ran, setRan] = useState(false);
  const [show, setShow] = useState<"ELIGIBLE" | "VERIFY" | "EXCLUDED">("ELIGIBLE");

  const comparables = useMemo(() => publicStartups.map((company) => ({ name: company.name, summary: company.summary, stage: company.stage })), []);

  const brief = useMemo(() => {
    if (!ran) return null;
    const parsed = parseBrief(text, AS_OF);
    const raiseMinor = raise.trim() ? Math.round(Number(raise.replace(/,/g, "")) * 100) : parsed.raiseMinor;
    return {
      ...parsed,
      name: name.trim() || parsed.name,
      stage,
      geos: split(geos).length > 0 ? split(geos) : parsed.geos,
      sectors: split(sectors).length > 0 ? split(sectors) : parsed.sectors,
      raiseMinor: Number.isFinite(raiseMinor) ? raiseMinor : 0,
      currency,
      needLead,
    };
  }, [ran, text, name, stage, geos, sectors, raise, currency, needLead]);

  const ranked = useMemo(() => (brief ? rankInvestors(investors, brief, comparables) : []), [brief, investors, comparables]);
  const visible = ranked.filter((item) => item.eligibility === show).slice(0, 20);
  const counts = {
    ELIGIBLE: ranked.filter((item) => item.eligibility === "ELIGIBLE").length,
    VERIFY: ranked.filter((item) => item.eligibility === "VERIFY").length,
    EXCLUDED: ranked.filter((item) => item.eligibility === "EXCLUDED").length,
  };

  return (
    <Frame title="Match" lede="Upload the startup. The score is investment fit, not a chance of getting funded.">
      <form
        className="grid min-w-0 gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setRan(true);
          setShow("ELIGIBLE");
        }}
      >
        <label className="grid gap-1 text-sm">
          Description
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={6} placeholder="What the company does, where it is, and the round." className="min-h-32 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
        </label>
        <label className="text-sm">
          Or upload a text file
          <input
            type="file"
            accept=".txt,.md,text/plain"
            className="mt-1 block w-full text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void file.text().then((value) => setText(value.slice(0, 6000)));
            }}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Company" value={name} onChange={setName} />
          <label className="grid gap-1 text-sm">
            Stage
            <select value={stage} onChange={(event) => setStage(event.target.value)} className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm">
              <option value="pre-seed">Pre-seed</option>
              <option value="seed">Seed</option>
              <option value="series a">Series A</option>
            </select>
          </label>
          <Field label="Geography" value={geos} onChange={setGeos} placeholder="United Kingdom" />
          <Field label="Sectors" value={sectors} onChange={setSectors} placeholder="fintech, B2B software" />
          <Field label="Round amount" value={raise} onChange={setRaise} placeholder="1500000" />
          <label className="grid gap-1 text-sm">
            Currency
            <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm">
              <option>GBP</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </label>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={needLead} onChange={(event) => setNeedLead(event.target.checked)} />
          A lead is required
        </label>
        <button type="submit" className="hit inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-fg sm:w-fit">Rank investors</button>
      </form>

      {brief ? (
        <section className="mt-8 min-w-0">
          <p className="text-sm text-muted">{brief.name} · {brief.stage} · {brief.geos.join(", ") || "Geography not stated"} · {brief.sectors.join(", ") || "No sector extracted"}</p>
          <div className="mt-3 flex gap-2 overflow-x-auto">
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
          <Link to="/investors/$id" params={{ id: item.investorId }} className="text-base font-semibold tracking-display break-words">{item.firm}</Link>
          <p className="mt-1 text-sm">{item.label} · {item.eligibility === "EXCLUDED" ? "No fit score" : `Fit ${item.fit}`} · Evidence {item.coverage}</p>
          <p className="text-xs text-muted">{item.role === "lead" ? "Can be considered for lead" : item.role === "participant" ? "Participant, not lead" : "Lead or follow not stated"} · {item.version} · {item.asOf}</p>
        </div>
      </div>
      {item.blockers.length > 0 ? <p className="mt-3 text-sm">{item.blockers.join(" ")}</p> : null}
      <ul className="mt-3 flex flex-col gap-1 text-sm text-muted">
        {item.reasons.slice(0, 3).map((reason) => <li key={reason} className="break-words">{reason}</li>)}
        {item.unknowns.slice(0, 2).map((reason) => <li key={reason} className="break-words">{reason}</li>)}
      </ul>
      <p className="mt-3 text-sm">{item.next}</p>
      <p className="mt-1 text-xs text-muted">{item.access}</p>
    </li>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm" />
    </label>
  );
}

function split(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
