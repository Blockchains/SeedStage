import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Frame } from "@/components/seedstage/shell";
import { GhostButton, Notice, Panel, Pill, PrimaryButton, TextField } from "@/components/seedstage/bits";
import { can } from "@/lib/seedstage/permissions";
import { useSeedstage } from "@/lib/seedstage/store";

export const Route = createFileRoute("/approvals")({ component: ApprovalsPage });

function ApprovalsPage() {
  const workspace = useSeedstage((state) => state.workspace);
  const approveDraft = useSeedstage((state) => state.approveDraft);
  const release = useSeedstage((state) => state.release);
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("amina@northline.example");
  const [message, setMessage] = useState<string | null>(null);
  const canApprove = can(workspace.role, "approve");
  const canRelease = can(workspace.role, "release_action");

  return (
    <Frame title="Approvals" lede="An approval binds the recipient, sender, subject, body and expiry. Change any of them and the release is refused. Nothing is emailed.">
      <div className="flex flex-col gap-4">
        <Panel title="Drafts waiting">
          {workspace.drafts.length === 0 ? <Notice>No drafts. Write one under Materials.</Notice> : null}
          <div className="flex flex-col gap-4">
            {workspace.drafts.map((draft) => (
              <article key={draft.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base">{draft.subject || "Untitled"}</h3>
                  <Pill>{draft.origin}</Pill>
                </div>
                <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{draft.body}</pre>
              </article>
            ))}
          </div>
          {workspace.drafts.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <TextField label="Exact recipient" value={recipient} onChange={setRecipient} disabled={!canApprove} />
              <TextField label="Exact sender" value={sender} onChange={setSender} disabled={!canApprove} />
              <PrimaryButton
                disabled={!canApprove}
                onClick={() => {
                  const latest = workspace.drafts[0];
                  const error = approveDraft(latest.id, recipient, sender);
                  setMessage(error ?? `Approved draft “${latest.subject}”. Re-approve if you edit it.`);
                }}
              >
                Approve latest draft
              </PrimaryButton>
            </div>
          ) : null}
        </Panel>
        <Panel title="Approved actions">
          {workspace.approvals.length === 0 ? <Notice>Nothing is approved.</Notice> : null}
          <ul className="flex flex-col gap-4">
            {workspace.approvals.map((approval) => {
              const released = workspace.actions.some((action) => action.approvalId === approval.id);
              return (
                <li key={approval.id} className="text-sm">
                  <p>{approval.subject}</p>
                  <p className="text-muted">To {approval.recipient} from {approval.sender}. Expires {approval.expiresAt.slice(0, 10)}. Hash {approval.hash}.</p>
                  <pre className="mt-2 whitespace-pre-wrap text-muted">{approval.body}</pre>
                  <div className="mt-2">
                    <GhostButton
                      disabled={!canRelease}
                      onClick={() => setMessage(release(approval.id))}
                    >
                      {released ? "Try again (should not duplicate)" : "Release — provider not connected"}
                    </GhostButton>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="Locked actions">
          {workspace.actions.length === 0 ? <p className="text-sm text-muted">None.</p> : (
            <ul className="flex flex-col gap-2 text-sm">
              {workspace.actions.map((action) => (
                <li key={action.id}>{action.at.slice(0, 16).replace("T", " ")} · {action.outcome.replaceAll("_", " ")} · {action.delivery.replaceAll("_", " ")}</li>
              ))}
            </ul>
          )}
        </Panel>
        {message ? <Notice>{message}</Notice> : null}
      </div>
    </Frame>
  );
}
