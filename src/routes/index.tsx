import { Link, createFileRoute } from "@tanstack/react-router";
import { Frame } from "@/components/seedstage/shell";
import { Notice, Panel, Pill } from "@/components/seedstage/bits";
import { findContradictions } from "@/lib/seedstage/claims";
import { formatMoney } from "@/lib/seedstage/money";
import { projectPlan } from "@/lib/seedstage/cash";
import { modelPricedRound } from "@/lib/seedstage/round";
import { nextAction } from "@/lib/seedstage/review";
import { useSeedstage } from "@/lib/seedstage/store";

export const Route = createFileRoute("/")({ component: ReviewPage });

function ReviewPage() {
  const workspace = useSeedstage((state) => state.workspace);
  const markReviewed = useSeedstage((state) => state.markReviewed);
  const action = nextAction(workspace);
  const contradictions = findContradictions(workspace.claims);
  const plan = projectPlan(workspace.plan);
  const round = modelPricedRound(workspace.roundDraft);
  const changes = workspace.audit.filter((event) => !workspace.lastReviewedAt || event.at > workspace.lastReviewedAt);

  return (
    <Frame title="What to do next" lede="SeedStage keeps the funding case attached to evidence, calculations and an approval. It does not score your chance of raising.">
      <div className="flex flex-col gap-4">
        <Panel title={action.title} aside={<Pill tone="warn">Next</Pill>}>
          <p className="text-sm leading-relaxed text-muted">{action.detail}</p>
          <Link to={action.to} className="mt-4 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg">
            Open
          </Link>
        </Panel>
        <div className="grid gap-4 md:grid-cols-3">
          <Panel title="Evidence">
            <p className="num text-2xl">{contradictions.length}</p>
            <p className="mt-1 text-sm text-muted">Open contradiction{contradictions.length === 1 ? "" : "s"}.</p>
            <p className="mt-3 text-sm text-muted">{workspace.claims.filter((claim) => claim.status === "pending").length} claims waiting for a person.</p>
          </Panel>
          <Panel title="Cash">
            {plan.ok ? (
              <>
                <p className="num text-2xl">{plan.runwayMonths === null ? "Inside horizon" : `${plan.runwayMonths} mo`}</p>
                <p className="mt-1 text-sm text-muted">Months at or above the buffer. Not cash ÷ burn.</p>
                <p className="num mt-3 text-sm">Low point {formatMoney(plan.minClosingMinor, workspace.plan.currency)}</p>
              </>
            ) : (
              <Notice>{plan.reason}</Notice>
            )}
          </Panel>
          <Panel title="Round">
            {round.ok ? (
              <>
                <p className="num text-2xl">{formatMoney(round.input.investmentMinor, round.input.currency)}</p>
                <p className="mt-1 text-sm text-muted">New money on a {round.input.mechanic === "pre-money-pool" ? "pre-money pool" : "post-money pool"} scenario.</p>
                <p className="num mt-3 text-sm">Investor {round.investorBps / 100}%</p>
              </>
            ) : (
              <Notice>{round.reason}</Notice>
            )}
          </Panel>
        </div>
        <Panel title="Since the last review" aside={<button type="button" className="min-h-11 text-sm text-primary" onClick={markReviewed}>Mark reviewed</button>}>
          {changes.length === 0 ? <p className="text-sm text-muted">Nothing new since the bookmark.</p> : (
            <ul className="flex flex-col gap-3">
              {changes.slice(0, 6).map((event) => (
                <li key={event.id} className="text-sm">
                  <span className="text-muted">{event.at.slice(0, 10)} · {event.actor}</span>
                  <p>{event.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </Frame>
  );
}
