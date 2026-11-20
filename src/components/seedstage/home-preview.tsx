import { useMemo, useState } from "react";
import { FirmLogo } from "@/components/seedstage/bits";
import { copy } from "@/lib/seedstage/copy";
import { findContradictions } from "@/lib/seedstage/claims";
import { assessInvestor, type MatchAssessment } from "@/lib/seedstage/match";
import { modelPricedRound } from "@/lib/seedstage/round";
import { can } from "@/lib/seedstage/permissions";
import { useSeedstage } from "@/lib/seedstage/store";
import { cn } from "@/lib/utils";

export type PreviewTab = "investors" | "round" | "evidence";

const PRESETS = [80_000_000, 120_000_000, 200_000_000];

export function HomePreview({ tab, onTab, onUseful, onSave, onComplete }: { tab: PreviewTab; onTab: (tab: PreviewTab) => void; onUseful: () => void; onSave: () => void; onComplete: () => void }) {
  const workspace = useSeedstage((state) => state.workspace);
  const reviewClaim = useSeedstage((state) => state.reviewClaim);
  const toggleShortlist = useSeedstage((state) => state.toggleShortlist);
  const [raise, setRaise] = useState<number | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const draft = workspace.roundDraft;
  const investment = raise ?? draft.investmentMinor;
  const round = modelPricedRound({ ...draft, investmentMinor: investment });
  const contradictions = findContradictions(workspace.claims);
  const mrr = workspace.claims.filter((claim) => claim.metricKey === "mrr" && claim.status !== "rejected");
  const profile = useMemo(
    () => ({
      stage: (workspace.company.stage.value ?? "seed").toLowerCase(),
      geos: workspace.company.geos.value ? [workspace.company.geos.value] : [],
      sectors: workspace.sectorTags,
      raiseMinor: investment,
      currency: draft.currency,
      needLead: true,
      asOf: workspace.asOf,
    }),
    [workspace, investment, draft.currency],
  );
  const rows = useMemo(
    () =>
      workspace.investors
        .map((investor) => ({ investor, match: assessInvestor(investor, profile) }))
        .sort((a, b) => rank(a.match) - rank(b.match))
        .slice(0, 8),
    [workspace.investors, profile],
  );

  return (
    <div id="preview" className="scroll-mt-16 overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex border-b border-border">
        {(
          [
            ["investors", "Investor fit"],
            ["round", "Round"],
            ["evidence", "Evidence"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={cn("hit min-h-11 flex-1 text-sm", tab === id ? "bg-surface font-medium text-fg" : "bg-surface-2 text-muted")}
            onClick={() => onTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tab === "investors" ? (
          <div>
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1">
              {PRESETS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  aria-pressed={amount === investment}
                  className={cn("hit min-h-11 rounded-full text-sm", amount === investment ? "bg-surface font-medium" : "text-muted")}
                  onClick={() => {
                    setRaise(amount);
                    onUseful();
                  }}
                >
                  {compactMoney(amount, draft.currency)}
                </button>
              ))}
            </div>
            <ul className="mt-3">
              {rows.map(({ investor, match }) => (
                <li key={investor.id} className="border-t border-border">
                  <button type="button" className="hit flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left" onClick={() => { const next = openId === investor.id ? null : investor.id; setOpenId(next); if (next) onComplete(); }}>
                    <span className="flex items-center gap-2">
                      <FirmLogo src={investor.logo} name={investor.firm} />
                      <span>
                        <span className="block text-sm font-medium">{investor.firm}</span>
                        <span className="block text-xs text-muted">{investor.fund}</span>
                      </span>
                    </span>
                    <Fit match={match} />
                  </button>
                  {openId === investor.id ? (
                    <div className="pb-3 text-sm">
                      <p>{match.disqualifiers[0] ?? match.reasonsFor[0] ?? "No stated reason."}</p>
                      <p className="mt-1 text-xs text-muted">{investor.excerpt}</p>
                      <p className="mt-1 text-xs text-muted">{investor.source} · {investor.sourceDate}</p>
                      <a className="hit mt-1 inline-flex min-h-11 items-center text-sm font-medium text-primary" href={investor.sourceUrl} target="_blank" rel="noreferrer">Website</a>
                      <button
                        type="button"
                        disabled={!can(workspace.role, "shortlist")}
                        className="hit mt-2 min-h-11 text-sm font-medium text-primary disabled:opacity-40"
                        onClick={() => {
                          toggleShortlist(investor.id);
                          onSave();
                        }}
                      >
                        {workspace.shortlist.includes(investor.id) ? "Remove from shortlist" : "Shortlist"}
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {tab === "round" && round.ok ? (
          <div>
            <p className="text-xs text-muted">{copy.roundScope}</p>
            <dl className="num mt-4 grid grid-cols-3 gap-3 text-sm">
              <Fact label="Raise" value={compactMoney(round.input.investmentMinor, round.input.currency)} />
              <Fact label="Pre" value={compactMoney(round.input.preMoneyMinor, round.input.currency)} />
              <Fact label="Post" value={compactMoney(round.postMoneyMinor, round.input.currency)} />
              <Fact label="Investor" value={percent(round.investorBps)} />
              <Fact label="Existing" value={percent(round.holderBps)} />
              <Fact label="Pool" value={percent(round.poolBps)} />
            </dl>
            <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div className="bar bg-fg" style={{ width: `${round.holderBps / 100}%` }} />
              <div className="bar bg-primary" style={{ width: `${round.investorBps / 100}%` }} />
              <div className="bar bg-border" style={{ width: `${round.poolBps / 100}%` }} />
            </div>
          </div>
        ) : null}
        {tab === "round" && !round.ok ? <p className="text-sm text-muted">This scenario cannot be calculated.</p> : null}
        {tab === "evidence" ? (
          <div>
            {contradictions.length === 0 ? <p className="text-sm text-muted">No open contradictions.</p> : null}
            <ul className="flex flex-col gap-3">
              {mrr.map((claim) => (
                <li key={claim.id} className="rounded-md border border-border p-3">
                  <p className="text-sm">{claim.text}</p>
                  <p className="mt-1 text-xs text-muted">{claim.status}</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="hit min-h-11 rounded-full bg-fg px-3 text-sm text-surface" onClick={() => { reviewClaim(claim.id, "accepted"); onUseful(); }}>Accept</button>
                    <button type="button" className="hit min-h-11 rounded-full border border-border px-3 text-sm" onClick={() => { reviewClaim(claim.id, "rejected"); onUseful(); }}>Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Fit({ match }: { match: MatchAssessment }) {
  const label = match.category === "priority" ? "Priority" : match.category === "possible" ? "Possible" : "Excluded";
  return (
    <span className={cn("shrink-0 text-xs font-medium", match.category === "priority" && "text-ok", match.category === "possible" && "text-primary", match.category === "disqualified" && "text-danger")}>
      {label}
    </span>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function rank(match: MatchAssessment) {
  if (match.category === "priority") return 0;
  if (match.category === "possible") return 1;
  return 2;
}

function percent(bps: number) {
  return `${(bps / 100).toFixed(2)}%`;
}

function compactMoney(minor: number, currency: string) {
  const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency === "USD" ? "$" : "";
  const major = Math.abs(minor) / 100;
  const rounded = major >= 1_000_000 ? Math.round((major / 1_000_000) * 10) / 10 : major >= 1_000 ? Math.round(major / 1_000) : Math.round(major);
  const suffix = major >= 1_000_000 ? "m" : major >= 1_000 ? "k" : "";
  const body = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${minor < 0 ? "−" : ""}${symbol}${body}${suffix}`;
}
