import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Frame } from "@/components/seedstage/shell";
import { FirmLogo, GhostButton, Notice, Panel, Pill } from "@/components/seedstage/bits";
import { assessInvestor } from "@/lib/seedstage/match";
import { formatMoney } from "@/lib/seedstage/money";
import { can } from "@/lib/seedstage/permissions";
import { SEC_INVESTOR_COUNT } from "@/lib/seedstage/sec-counts";
import { searchSecInvestors } from "@/lib/seedstage/sec-directory";
import { useSeedstage } from "@/lib/seedstage/store";
import type { MatchAssessment } from "@/lib/seedstage/match";

import { pageHead } from "@/lib/seedstage/seo";

export const Route = createFileRoute("/investors/")({
  component: InvestorsPage,
  head: () => pageHead("/investors", "Investors — SeedStage", "Seed investors and US Form D funds, each with its source."),
});

function InvestorsPage() {
  const workspace = useSeedstage((state) => state.workspace);
  const toggleShortlist = useSeedstage((state) => state.toggleShortlist);
  const addOpportunity = useSeedstage((state) => state.addOpportunity);
  const [filter, setFilter] = useState<"all" | MatchAssessment["category"]>("all");
  const [limit, setLimit] = useState(40);
  const [tab, setTab] = useState<"named" | "filing">("named");
  const [secQuery, setSecQuery] = useState("");
  const [secRows, setSecRows] = useState<{ id: string; firm: string; partner: string | null; geos: string[]; themes: string[]; excerpt: string; phone: string | null; sourceUrl: string }[]>([]);
  const [secTotal, setSecTotal] = useState(SEC_INVESTOR_COUNT);
  const [secOffset, setSecOffset] = useState(0);
  const [secState, setSecState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const locked = !can(workspace.role, "shortlist");
  const raise = workspace.roundDraft.investmentMinor;
  const matches = useMemo(() => {
    const profile = {
      stage: (workspace.company.stage.value ?? "seed").toLowerCase(),
      geos: workspace.company.geos.value ? [workspace.company.geos.value] : [],
      sectors: workspace.sectorTags,
      raiseMinor: raise,
      currency: workspace.roundDraft.currency,
      needLead: true,
      asOf: workspace.asOf,
    };
    return workspace.investors
      .map((investor) => ({ investor, match: assessInvestor(investor, profile) }))
      .sort((a, b) => rank(a.match) - rank(b.match) || (b.match.aid ?? -1) - (a.match.aid ?? -1));
  }, [workspace, raise]);
  const visible = matches.filter((item) => filter === "all" || item.match.category === filter);

  useEffect(() => {
    if (tab !== "filing") return;
    const handle = window.setTimeout(() => {
      setSecState("loading");
      searchSecInvestors({ data: { q: secQuery, offset: 0 } })
        .then((result) => {
          setSecRows(result.rows);
          setSecTotal(result.total);
          setSecOffset(result.rows.length);
          setSecState("ready");
        })
        .catch(() => setSecState("error"));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [tab, secQuery]);

  return (
    <Frame title="Investors">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <GhostButton onClick={() => setTab("named")} className={tab === "named" ? "border-primary text-primary" : ""}>Named {workspace.investors.length.toLocaleString("en-GB")}</GhostButton>
          <GhostButton onClick={() => setTab("filing")} className={tab === "filing" ? "border-primary text-primary" : ""}>Form D {SEC_INVESTOR_COUNT.toLocaleString("en-GB")}</GhostButton>
        </div>
        {tab === "filing" ? (
          <>
            <input value={secQuery} onChange={(event) => setSecQuery(event.target.value)} placeholder="Search Form D funds" aria-label="Search Form D funds" className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm md:max-w-xs" />
            <p className="text-sm text-muted">These are the fund’s own Form D filings. The offering target is not capital available to invest, and the filing is not scored as seed fit.</p>
            {secRows.map((investor) => (
              <Panel
                key={investor.id}
                title={
                  <Link to="/investors/$id" params={{ id: investor.id }} className="hit flex items-center gap-2">
                    <FirmLogo src="" name={investor.firm} />
                    {investor.firm}
                  </Link>
                }
              >
                <p className="text-sm leading-relaxed">{investor.excerpt}</p>
                <p className="mt-2 text-sm">{[investor.partner, investor.phone, investor.geos.slice(0, 2).join(", "), investor.themes[0]].filter(Boolean).join(" · ")}</p>
                <a className="hit mt-2 inline-flex min-h-11 items-center text-sm font-medium text-primary" href={investor.sourceUrl} target="_blank" rel="noreferrer">Filing</a>
              </Panel>
            ))}
            {secState === "loading" ? <p className="text-sm text-muted">Loading filings.</p> : null}
            {secState === "error" ? <p className="text-sm text-muted">The filing list did not load.</p> : null}
            {secState === "ready" && secRows.length === 0 ? <p className="text-sm text-muted">No fund matches that search.</p> : null}
            {secOffset < secTotal ? <GhostButton onClick={() => {
              setSecState("loading");
              searchSecInvestors({ data: { q: secQuery, offset: secOffset } })
                .then((result) => {
                  setSecRows((current) => [...current, ...result.rows]);
                  setSecTotal(result.total);
                  setSecOffset((value) => value + result.rows.length);
                  setSecState("ready");
                })
                .catch(() => setSecState("error"));
            }}>Show more</GhostButton> : null}
          </>
        ) : (
        <>
        <div className="flex flex-wrap gap-2">
          {(["all", "priority", "possible", "disqualified"] as const).map((item) => (
            <GhostButton key={item} onClick={() => { setFilter(item); setLimit(40); }} className={filter === item ? "border-primary text-primary" : ""}>
              {item}
            </GhostButton>
          ))}
        </div>
        {workspace.investors.length === 0 ? <Notice>No investor records. This build does not fetch a live directory.</Notice> : null}
        {visible.slice(0, limit).map(({ investor, match }) => (
          <Panel
            key={investor.id}
            title={
              <Link to="/investors/$id" params={{ id: investor.id }} className="hit flex items-center gap-2">
                <FirmLogo src={investor.logo} name={investor.firm} />
                {investor.firm}
              </Link>
            }
            aside={<Pill tone={match.category === "disqualified" ? "bad" : match.category === "priority" ? "ok" : "warn"}>{match.category}</Pill>}
          >
            {meta(investor) ? <p className="text-sm text-muted">{meta(investor)}</p> : null}
            <p className="mt-2 text-sm leading-relaxed">{investor.excerpt.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ")}</p>
            {investor.chequeMaxMinor > 0 ? (
              <p className="num mt-2 text-sm">
                {formatMoney(investor.chequeMinMinor, investor.currency)}–{formatMoney(investor.chequeMaxMinor, investor.currency)}
              </p>
            ) : null}
            {investor.stages.length > 0 || investor.geos.length > 0 || investor.themes.length > 0 ? (
              <p className="mt-2 text-xs text-muted">{[investor.stages.join(", "), investor.geos.slice(0, 3).join(", "), investor.themes.join(" · ")].filter(Boolean).join(" · ")}</p>
            ) : null}
            {investor.portfolio.length > 0 ? <p className="mt-2 text-sm">{investor.portfolio.join(", ")}</p> : null}
            <a className="hit mt-2 inline-flex min-h-11 items-center text-sm font-medium text-primary" href={investor.sourceUrl} target="_blank" rel="noreferrer">{investor.sourceUrl.includes("sec.gov") ? "Filing" : "Website"}</a>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Reasons title="For" items={shown(match.reasonsFor)} />
              <Reasons title="Against" items={shown(match.reasonsAgainst)} />
              <Reasons title="Disqualified" items={shown(match.disqualifiers)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <GhostButton disabled={locked} onClick={() => toggleShortlist(investor.id)}>
                {workspace.shortlist.includes(investor.id) ? "Remove from shortlist" : "Shortlist"}
              </GhostButton>
              <GhostButton disabled={!can(workspace.role, "edit_pipeline")} onClick={() => addOpportunity(investor.id)}>Add to pipeline</GhostButton>
            </div>
          </Panel>
        ))}
        {limit < visible.length ? <GhostButton onClick={() => setLimit((value) => value + 40)}>Show more</GhostButton> : null}
        </>
        )}
      </div>
    </Frame>
  );
}

function meta(investor: { firm: string; fund: string; partner: string | null; participation: string }): string {
  return [
    investor.fund && investor.fund !== investor.firm && !investor.fund.startsWith("Not named") ? investor.fund : null,
    investor.partner,
    investor.participation === "unstated" ? null : investor.participation,
  ].filter(Boolean).join(" · ");
}

function shown(items: string[]): string[] {
  return items.filter((item) => !/public page|available capital|contact route|not stated|not confirmed|no portfolio|no sourced|freshness is unknown|could not be read|mandate is blank/i.test(item));
}

function rank(match: MatchAssessment): number {
  if (match.category === "priority") return 0;
  if (match.category === "possible") return 1;
  return 2;
}

function Reasons({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm text-muted">{title}</h3>
      <ul className="mt-1 list-disc pl-4 text-sm">{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}
