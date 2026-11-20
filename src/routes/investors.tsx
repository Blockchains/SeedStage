import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Frame } from "@/components/seedstage/shell";
import { GhostButton, Notice, Panel, Pill } from "@/components/seedstage/bits";
import { assessInvestor } from "@/lib/seedstage/match";
import { formatMoney } from "@/lib/seedstage/money";
import { can } from "@/lib/seedstage/permissions";
import { useSeedstage } from "@/lib/seedstage/store";
import type { MatchAssessment } from "@/lib/seedstage/match";

export const Route = createFileRoute("/investors")({ component: InvestorsPage });

function InvestorsPage() {
  const workspace = useSeedstage((state) => state.workspace);
  const toggleShortlist = useSeedstage((state) => state.toggleShortlist);
  const addOpportunity = useSeedstage((state) => state.addOpportunity);
  const [filter, setFilter] = useState<"all" | MatchAssessment["category"]>("all");
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

  return (
    <Frame title="Investors" lede="Hard constraints are separate from reasons for and against. Every record in the demonstration is synthetic. No address is guessed.">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {(["all", "priority", "possible", "disqualified"] as const).map((item) => (
            <GhostButton key={item} onClick={() => setFilter(item)} className={filter === item ? "border-primary text-primary" : ""}>
              {item}
            </GhostButton>
          ))}
        </div>
        {workspace.investors.length === 0 ? <Notice>No investor records. This build does not fetch a live directory.</Notice> : null}
        {visible.map(({ investor, match }) => (
          <Panel
            key={investor.id}
            title={investor.firm}
            aside={<Pill tone={match.category === "disqualified" ? "bad" : match.category === "priority" ? "ok" : "warn"}>{match.category}</Pill>}
          >
            <p className="text-sm text-muted">{investor.fund} · {investor.partner ?? "No partner on file"} · {investor.participation}</p>
            <p className="num mt-2 text-sm">
              Cheque {formatMoney(investor.chequeMinMinor, investor.currency)}–{formatMoney(investor.chequeMaxMinor, investor.currency)} · source {investor.sourceDate}
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Reasons title="For" items={match.reasonsFor} />
              <Reasons title="Against" items={match.reasonsAgainst} />
              <Reasons title="Disqualified because" items={match.disqualifiers} />
              <Reasons title="Unknown" items={match.unknowns} />
            </div>
            {match.aid !== null ? <p className="mt-3 text-xs text-muted">Sort aid {match.aid} · {match.aidVersion}. {match.aidNote}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <GhostButton disabled={locked} onClick={() => toggleShortlist(investor.id)}>
                {workspace.shortlist.includes(investor.id) ? "Remove from shortlist" : "Shortlist"}
              </GhostButton>
              <GhostButton disabled={!can(workspace.role, "edit_pipeline")} onClick={() => addOpportunity(investor.id)}>Add to pipeline</GhostButton>
            </div>
          </Panel>
        ))}
      </div>
    </Frame>
  );
}

function rank(match: MatchAssessment): number {
  if (match.category === "priority") return 0;
  if (match.category === "possible") return 1;
  return 2;
}

function Reasons({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm text-muted">{title}</h3>
      {items.length === 0 ? <p className="text-sm">None</p> : <ul className="mt-1 list-disc pl-4 text-sm">{items.map((item) => <li key={item}>{item}</li>)}</ul>}
    </div>
  );
}
