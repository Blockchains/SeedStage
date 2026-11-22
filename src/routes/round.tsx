import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Frame } from "@/components/seedstage/shell";
import { MoneyField, Notice, NumberField, Panel, PrimaryButton, TextField } from "@/components/seedstage/bits";
import { formatBps, formatMoney, formatShares } from "@/lib/seedstage/money";
import { can } from "@/lib/seedstage/permissions";
import { modelPricedRound, unsupportedInstrument } from "@/lib/seedstage/round";
import { useSeedstage } from "@/lib/seedstage/store";
import { cn } from "@/lib/utils";

import { pageHead } from "@/lib/seedstage/seo";

export const Route = createFileRoute("/round")({
  component: RoundPage,
  head: () => pageHead("/round", "Round — SeedStage", "Price a seed round and see the ownership that follows."),
});

function RoundPage() {
  const draft = useSeedstage((state) => state.workspace.roundDraft);
  const versions = useSeedstage((state) => state.workspace.roundVersions);
  const setRound = useSeedstage((state) => state.setRound);
  const saveRound = useSeedstage((state) => state.saveRound);
  const role = useSeedstage((state) => state.workspace.role);
  const locked = !can(role, "edit_round");
  const [blocked, setBlocked] = useState(false);
  const result = modelPricedRound(draft);
  const safeBlock = unsupportedInstrument("SAFE");
  const previous = versions[0] ? modelPricedRound(versions[0].input) : null;

  return (
    <Frame title="Round modeller" lede="Priced equity only. The pool mechanic is named because it changes who is diluted. SAFEs and notes are refused until a template version is loaded.">
      <div className="flex flex-col gap-4">
        <Panel title={draft.name || "Scenario"}>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Scenario name" value={draft.name} disabled={locked} onChange={(name) => setRound({ name })} />
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Mechanic</span>
              <select
                className="min-h-11 rounded-md border border-border bg-bg px-3"
                disabled={locked}
                value={draft.mechanic}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "safe") {
                    setBlocked(true);
                    return;
                  }
                  setBlocked(false);
                  if (value === "pre-money-pool" || value === "post-money-pool") setRound({ mechanic: value });
                }}
              >
                <option value="pre-money-pool">Priced equity — pool inside the pre-money</option>
                <option value="post-money-pool">Priced equity — pool created after the money</option>
                <option value="safe">SAFE or convertible note</option>
              </select>
            </label>
            <MoneyField label="Pre-money" minor={draft.preMoneyMinor} disabled={locked} onChange={(preMoneyMinor) => setRound({ preMoneyMinor })} />
            <MoneyField label="Investment" minor={draft.investmentMinor} disabled={locked} onChange={(investmentMinor) => setRound({ investmentMinor })} />
            <NumberField label="Existing fully diluted shares" value={draft.existingShares} disabled={locked} onChange={(existingShares) => setRound({ existingShares })} />
            <NumberField label="Unallocated pool, shares" value={draft.unallocatedShares} disabled={locked} onChange={(unallocatedShares) => setRound({ unallocatedShares })} />
            <NumberField label="Target unallocated pool, basis points of post-money" value={draft.targetPoolBps} disabled={locked} onChange={(targetPoolBps) => setRound({ targetPoolBps })} />
          </div>
          <div className="mt-4">
            <PrimaryButton disabled={locked} onClick={saveRound}>Save this version</PrimaryButton>
          </div>
        </Panel>
        {blocked && !safeBlock.ok ? <Notice>{safeBlock.reason}</Notice> : null}
        {result.ok ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Panel title="Post-money"><p className="num text-2xl">{formatMoney(result.postMoneyMinor, draft.currency)}</p></Panel>
              <Panel title="New investor">
                <p className="num text-2xl">{formatBps(result.investorBps)}</p>
                <p className="mt-1 text-sm text-muted">{formatShares(result.investorShares)} shares. Headline target {formatBps(result.targetInvestorBps)}.</p>
              </Panel>
              <Panel title="Holders after">
                <p className="num text-2xl">{formatBps(result.holderBps)}</p>
                <p className="mt-1 text-sm text-muted">Pool {formatBps(result.poolBps)} · top-up {formatShares(result.poolTopUp)} shares</p>
              </Panel>
            </div>
            <Panel title="Ownership">
              <Ownership label="Existing holders" bps={result.holderBps} />
              <Ownership label="Unallocated pool" bps={result.poolBps} />
              <Ownership label="New investor" bps={result.investorBps} />
              <p className="mt-3 text-xs text-muted">Share price {result.priceNumerator}/{result.priceDenominator} minor units per share. Proceeds delta {formatMoney(result.proceedsDeltaMinor, draft.currency)}.</p>
            </Panel>
            <Panel title="Trace">
              <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-muted">
                {result.trace.map((line) => <li key={line}>{line}</li>)}
              </ol>
            </Panel>
          </>
        ) : (
          <Notice>{result.reason}</Notice>
        )}
        {previous?.ok && result.ok ? (
          <Panel title="Against the last saved version">
            <p className="text-sm text-muted">Investor ownership {formatBps(previous.investorBps)} saved, {formatBps(result.investorBps)} in the draft. Engine {result.engine}.</p>
          </Panel>
        ) : (
          <Notice>No saved version yet. The live result above is not stored until you save it.</Notice>
        )}
      </div>
    </Frame>
  );
}

function Ownership({ label, bps }: { label: string; bps: number }) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="num">{formatBps(bps)}</span>
      </div>
      <div className="h-2 rounded-md bg-bg">
        <div className={cn("h-2 rounded-md bg-primary")} style={{ width: `${Math.min(100, Math.max(0, bps / 100))}%` }} />
      </div>
    </div>
  );
}
