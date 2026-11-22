import { createFileRoute } from "@tanstack/react-router";
import { Frame } from "@/components/seedstage/shell";
import { Notice, Panel, Pill } from "@/components/seedstage/bits";
import { can } from "@/lib/seedstage/permissions";
import { useSeedstage } from "@/lib/seedstage/store";

import { pageHead } from "@/lib/seedstage/seo";

export const Route = createFileRoute("/diligence")({
  component: DiligencePage,
  head: () => pageHead("/diligence", "Diligence — SeedStage", "Questions still open before a conversation with an investor."),
});

function DiligencePage() {
  const workspace = useSeedstage((state) => state.workspace);
  const setDiligence = useSeedstage((state) => state.setDiligence);
  const locked = !can(workspace.role, "edit_diligence");

  return (
    <Frame title="Diligence" lede="A request is linked only when a claim exists. Missing security evidence stays missing.">
      <div className="flex flex-col gap-3">
        {workspace.diligence.length === 0 ? <Notice>No requests on file.</Notice> : null}
        {workspace.diligence.map((item) => {
          const claim = workspace.claims.find((entry) => entry.id === item.claimId);
          return (
            <Panel key={item.id} title={item.request} aside={<Pill tone={item.status === "linked" ? "ok" : item.status === "missing" ? "warn" : "neutral"}>{item.status.replaceAll("_", " ")}</Pill>}>
              <p className="text-sm text-muted">{item.note || "No note."}</p>
              <p className="mt-2 text-sm">{claim ? `Linked claim: ${claim.text}` : "No claim linked."}</p>
              <label className="mt-3 flex flex-col gap-1 text-sm">
                <span className="text-muted">Status</span>
                <select
                  className="min-h-11 rounded-md border border-border bg-bg px-3"
                  disabled={locked}
                  value={item.status}
                  onChange={(event) => setDiligence(item.id, event.target.value as typeof item.status)}
                >
                  <option value="missing">Missing</option>
                  <option value="linked">Linked</option>
                  <option value="not_applicable">Not applicable</option>
                </select>
              </label>
            </Panel>
          );
        })}
      </div>
    </Frame>
  );
}
