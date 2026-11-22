import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Frame } from "@/components/seedstage/shell";
import { FirmLogo, GhostButton, Notice, Panel, PrimaryButton } from "@/components/seedstage/bits";
import { draftWithGrok } from "@/lib/seedstage/grok";
import { fundingBrief, meetingBrief, outreachDraft } from "@/lib/seedstage/materials";
import { can } from "@/lib/seedstage/permissions";
import { useSeedstage } from "@/lib/seedstage/store";

import { pageHead } from "@/lib/seedstage/seo";

export const Route = createFileRoute("/materials")({
  component: MaterialsPage,
  head: () => pageHead("/materials", "Materials — SeedStage", "Documents prepared for this raise."),
});

function MaterialsPage() {
  const workspace = useSeedstage((state) => state.workspace);
  const setDraft = useSeedstage((state) => state.setDraft);
  const [investorId, setInvestorId] = useState(workspace.investors[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const investor = workspace.investors.find((item) => item.id === investorId) ?? null;
  const locked = !can(workspace.role, "draft");

  function show(nextSubject: string, nextBody: string) {
    setSubject(nextSubject);
    setBody(nextBody);
    setMessage(null);
  }

  return (
    <Frame title="Materials" lede="Drafts use accepted claims only. Pending numbers, including the disputed MRR, stay out until a person accepts them.">
      <div className="flex flex-col gap-4">
        <Panel title="Prepare">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Investor, if the piece needs one</span>
            <span className="flex items-center gap-2">
              {investor ? <FirmLogo src={investor.logo} name={investor.firm} /> : null}
              <select className="min-h-11 w-full rounded-md border border-border bg-bg px-3" value={investorId} onChange={(event) => setInvestorId(event.target.value)}>
              <option value="">None</option>
              {workspace.investors.map((item) => <option key={item.id} value={item.id}>{item.firm}</option>)}
            </select>
            </span>
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <GhostButton onClick={() => show("Funding brief", fundingBrief(workspace))}>Funding brief</GhostButton>
            <GhostButton
              disabled={!investor}
              onClick={() => {
                if (!investor) return;
                const draft = outreachDraft(workspace, investor);
                show(draft.subject, draft.body);
              }}
            >
              Outreach
            </GhostButton>
            <GhostButton disabled={!investor} onClick={() => investor && show(`Meeting — ${investor.firm}`, meetingBrief(workspace, investor))}>Meeting brief</GhostButton>
            <GhostButton
              disabled={busy || !body}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    const result = await draftWithGrok({ data: { facts: body, instruction: "Tighten the draft. Do not add facts." } });
                    if (!result.ok) {
                      setMessage(result.error);
                      return;
                    }
                    setBody(result.text);
                    setMessage(`Grok (${result.model}) rewrote the draft. It is still not evidence and not approved.`);
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : "Grok could not be reached.");
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              {busy ? "Asking Grok…" : "Tighten with Grok"}
            </GhostButton>
          </div>
        </Panel>
        <Panel title="Draft">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Subject</span>
            <input className="min-h-11 rounded-md border border-border bg-bg px-3" value={subject} onChange={(event) => setSubject(event.target.value)} />
          </label>
          <label className="mt-3 flex flex-col gap-1 text-sm">
            <span className="text-muted">Body</span>
            <textarea className="min-h-64 rounded-md border border-border bg-bg px-3 py-2 leading-relaxed" value={body} onChange={(event) => setBody(event.target.value)} />
          </label>
          <div className="mt-4">
            <PrimaryButton
              disabled={locked || !body}
              onClick={() => {
                const id = setDraft({ kind: investor ? "outreach" : "funding_brief", investorId: investor?.id ?? null, subject, body, origin: message?.startsWith("Grok") ? "grok" : "deterministic" });
                setMessage(id ? "Draft saved. Approve the exact text under Approvals." : "This role cannot save a draft.");
              }}
            >
              Save draft
            </PrimaryButton>
          </div>
          {message ? <div className="mt-3"><Notice>{message}</Notice></div> : null}
        </Panel>
      </div>
    </Frame>
  );
}
