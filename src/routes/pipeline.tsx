import { createFileRoute } from "@tanstack/react-router";
import { Frame } from "@/components/seedstage/shell";
import { FirmLogo, GhostButton, Notice, Panel, Pill } from "@/components/seedstage/bits";
import { can } from "@/lib/seedstage/permissions";
import { useSeedstage } from "@/lib/seedstage/store";
import type { PipelineStage } from "@/lib/seedstage/types";

import { pageHead } from "@/lib/seedstage/seo";

export const Route = createFileRoute("/pipeline")({
  component: PipelinePage,
  head: () => pageHead("/pipeline", "Pipeline — SeedStage", "Investors under review for this raise, and why each one is there."),
});

const STAGES: { id: PipelineStage; label: string }[] = [
  { id: "researching", label: "Researching" },
  { id: "ready_for_review", label: "Ready for review" },
  { id: "approved_for_approach", label: "Approved for approach" },
  { id: "contacted", label: "Contacted" },
  { id: "meeting_scheduled", label: "Meeting scheduled" },
  { id: "diligence", label: "Diligence" },
  { id: "terms", label: "Terms" },
  { id: "closed", label: "Closed" },
  { id: "declined", label: "Declined" },
  { id: "paused", label: "Paused" },
];

function PipelinePage() {
  const workspace = useSeedstage((state) => state.workspace);
  const setStage = useSeedstage((state) => state.setStage);
  const suggestStage = useSeedstage((state) => state.suggestStage);
  const locked = !can(workspace.role, "edit_pipeline");

  return (
    <Frame title="Pipeline" lede="A stage changes only when a person sets it. A suggestion stays beside the confirmed stage.">
      <div className="flex flex-col gap-4">
        {workspace.opportunities.length === 0 ? <Notice>No firms in the pipeline. Add one from Investors.</Notice> : null}
        {workspace.opportunities.map((opportunity) => {
          const investor = workspace.investors.find((item) => item.id === opportunity.investorId);
          const activity = workspace.activities.filter((item) => item.opportunityId === opportunity.id).slice(0, 4);
          return (
            <Panel
              key={opportunity.id}
              title={
                <span className="flex items-center gap-2">
                  <FirmLogo src={investor?.logo ?? ""} name={investor?.firm ?? "Firm"} />
                  {investor?.firm ?? "Removed firm"}
                </span>
              }
              aside={<Pill>{STAGES.find((stage) => stage.id === opportunity.stage)?.label}</Pill>}
            >
              {investor?.excerpt ? <p className="text-sm leading-relaxed">{investor.excerpt}</p> : null}
              <p className="mt-2 text-sm text-muted">Owner {opportunity.owner}. Next: {opportunity.nextAction}</p>
              <p className="mt-1 text-sm text-muted">Introduction: {opportunity.introSource}. Confirmed by a person on {opportunity.updatedAt.slice(0, 10)}.</p>
              {opportunity.suggestion ? <p className="mt-2 text-sm text-primary">Suggestion waiting: {opportunity.suggestion}. The confirmed stage was not overwritten.</p> : null}
              <label className="mt-4 flex flex-col gap-1 text-sm">
                <span className="text-muted">Set confirmed stage</span>
                <select
                  className="min-h-11 rounded-md border border-border bg-bg px-3"
                  disabled={locked}
                  value={opportunity.stage}
                  onChange={(event) => setStage(opportunity.id, event.target.value as PipelineStage)}
                >
                  {STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                </select>
              </label>
              <div className="mt-3">
                <GhostButton disabled={locked} onClick={() => suggestStage(opportunity.id, "ready_for_review")}>Suggest “ready for review”</GhostButton>
              </div>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
                {activity.map((item) => <li key={item.id}>{item.at.slice(0, 10)} · {item.kind} · {item.text}</li>)}
              </ul>
            </Panel>
          );
        })}
      </div>
    </Frame>
  );
}
