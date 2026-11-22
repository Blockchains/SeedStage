import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Frame } from "@/components/seedstage/shell";
import { GhostButton, MoneyField, Notice, NumberField, Panel } from "@/components/seedstage/bits";
import { projectPlan, suggestedRaise, type PlanAssumptions } from "@/lib/seedstage/cash";
import { formatMoney } from "@/lib/seedstage/money";
import { can } from "@/lib/seedstage/permissions";
import { useSeedstage } from "@/lib/seedstage/store";

import { pageHead } from "@/lib/seedstage/seo";

export const Route = createFileRoute("/plan")({
  component: PlanPage,
  head: () => pageHead("/plan", "Funding plan — SeedStage", "The capital a company needs before the next milestone."),
});

type Lens = "base" | "downside" | "hiring-delay";

function lensOf(plan: PlanAssumptions, lens: Lens): PlanAssumptions {
  if (lens === "downside") return { ...plan, receiptGrowthBps: Math.max(0, Math.floor(plan.receiptGrowthBps / 2)), receiptDelayMonths: plan.receiptDelayMonths + 2 };
  if (lens === "hiring-delay") return { ...plan, hiringDelayMonths: plan.hiringDelayMonths + 3 };
  return plan;
}

function PlanPage() {
  const plan = useSeedstage((state) => state.workspace.plan);
  const setPlan = useSeedstage((state) => state.setPlan);
  const role = useSeedstage((state) => state.workspace.role);
  const locked = !can(role, "edit_plan");
  const [lens, setLens] = useState<Lens>("base");
  const [chart, setChart] = useState(false);
  useEffect(() => setChart(true), []);
  const viewed = lensOf(plan, lens);
  const result = projectPlan(viewed);
  const raise = suggestedRaise(viewed, 0);
  const currency = plan.currency;

  return (
    <Frame title="Funding plan" lede="Runway is the first month the closing balance falls through the buffer. Confirmed receipts and assumptions are not mixed into one burn rate.">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {([["base", "Base"], ["downside", "Receipts slip"], ["hiring-delay", "Hiring slips"]] as const).map(([id, label]) => (
            <GhostButton key={id} onClick={() => setLens(id)} className={lens === id ? "border-primary text-primary" : ""}>{label}</GhostButton>
          ))}
        </div>
        {result.ok ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Panel title="Buffer runway">
                <p className="num text-2xl">{result.runwayMonths === null ? "Not breached" : `${result.runwayMonths} months`}</p>
                <p className="mt-2 text-sm text-muted">{result.runwayNote}</p>
              </Panel>
              <Panel title="Lowest close">
                <p className="num text-2xl">{formatMoney(result.minClosingMinor, currency)}</p>
                <p className="mt-2 text-sm text-muted">{result.minClosingMinor < 0 ? "Negative cash is shown, not hidden." : "Still above zero at the low point."}</p>
              </Panel>
              <Panel title="Cash that clears month 1 close">
                <p className="num text-2xl">{raise.amountMinor === null ? "No amount" : formatMoney(raise.amountMinor, currency)}</p>
                <p className="mt-2 text-sm text-muted">{raise.note}</p>
              </Panel>
            </div>
            <Panel title="Monthly close">
              <div className="h-56">
                {chart ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.rows.map((row) => ({ label: row.label, close: row.closingMinor / 100 }))}>
                      <XAxis dataKey="label" stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip
                        formatter={(value) => formatMoney(Math.round(Number(value) * 100), currency)}
                        contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                      />
                      <Bar dataKey="close" fill="var(--color-primary)" radius={2} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-md border border-border bg-bg" />
                )}
              </div>
            </Panel>
            <Panel title="Bridge">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="text-muted">
                    <tr>
                      <th className="py-2 font-medium">Month</th>
                      <th className="py-2 font-medium">Confirmed</th>
                      <th className="py-2 font-medium">Assumed</th>
                      <th className="py-2 font-medium">Out</th>
                      <th className="py-2 font-medium">Close</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => (
                      <tr key={row.index} className="border-t border-border">
                        <td className="py-2">{row.label}</td>
                        <td className="num py-2">{formatMoney(row.receiptsConfirmedMinor, currency)}</td>
                        <td className="num py-2">{formatMoney(row.receiptsAssumedMinor, currency)}</td>
                        <td className="num py-2">{formatMoney(row.payrollMinor + row.opexMinor, currency)}</td>
                        <td className={row.negative ? "num py-2 text-danger" : "num py-2"}>{formatMoney(row.closingMinor, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        ) : (
          <Notice>{result.reason}</Notice>
        )}
        <Panel title="Assumptions">
          <div className="grid gap-4 md:grid-cols-2">
            <MoneyField label="Opening cash" minor={plan.openingCashMinor} disabled={locked} onChange={(openingCashMinor) => setPlan({ openingCashMinor })} />
            <MoneyField label="Minimum buffer" minor={plan.bufferMinor} disabled={locked} onChange={(bufferMinor) => setPlan({ bufferMinor })} />
            <MoneyField label="Starting monthly receipts" minor={plan.startingReceiptsMinor} disabled={locked} onChange={(startingReceiptsMinor) => setPlan({ startingReceiptsMinor })} />
            <NumberField label="Receipt growth, basis points / month" value={plan.receiptGrowthBps} disabled={locked} onChange={(receiptGrowthBps) => setPlan({ receiptGrowthBps })} />
            <NumberField label="Months of receipts treated as confirmed" value={plan.confirmedThroughMonth} disabled={locked} onChange={(confirmedThroughMonth) => setPlan({ confirmedThroughMonth })} />
            <NumberField label="Receipt delay, months" value={plan.receiptDelayMonths} disabled={locked} onChange={(receiptDelayMonths) => setPlan({ receiptDelayMonths })} />
            <MoneyField label="Monthly payroll" minor={plan.payrollMinor} disabled={locked} onChange={(payrollMinor) => setPlan({ payrollMinor })} />
            <MoneyField label="Monthly operating costs" minor={plan.opexMinor} disabled={locked} onChange={(opexMinor) => setPlan({ opexMinor })} />
            <NumberField label="Hiring starts in month index" value={plan.hiringStartMonth} disabled={locked} onChange={(hiringStartMonth) => setPlan({ hiringStartMonth })} />
            <MoneyField label="Extra monthly payroll" minor={plan.hiringExtraMinor} disabled={locked} onChange={(hiringExtraMinor) => setPlan({ hiringExtraMinor })} />
            <NumberField label="Hiring delay, months" value={plan.hiringDelayMonths} disabled={locked} onChange={(hiringDelayMonths) => setPlan({ hiringDelayMonths })} />
            <NumberField label="Horizon, months" value={plan.horizonMonths} disabled={locked} onChange={(horizonMonths) => setPlan({ horizonMonths })} />
          </div>
          <p className="mt-4 text-xs text-muted">300 basis points is 3% a month. Growth compounds in integer minor units. Financing is not included until you model a round separately.</p>
        </Panel>
      </div>
    </Frame>
  );
}
