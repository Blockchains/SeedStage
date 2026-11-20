import { createFileRoute } from "@tanstack/react-router";
import { Frame } from "@/components/seedstage/shell";
import { GhostButton, Notice, Panel, PrimaryButton } from "@/components/seedstage/bits";
import { can, ROLE_LABEL } from "@/lib/seedstage/permissions";
import { useSeedstage } from "@/lib/seedstage/store";
import type { Role } from "@/lib/seedstage/types";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const ROLES: Role[] = ["founder", "finance", "adviser", "board", "admin"];

const STATUS = [
  ["Workspace, evidence review, cash bridge, priced round, matching, pipeline, drafts, approvals", "Implemented and covered by unit tests where the result is exact"],
  ["Grok extraction and drafting", "Implemented. Calls only when you ask. Quotes that are not in the document are dropped."],
  ["Email delivery, malware scanning, bank verification, licensed investor data", "Not connected. The product says so in the flow."],
  ["Server-side accounts and tenant isolation", "Not in this build. Roles are a demonstration gate in the browser. Do not put secrets here."],
  ["SAFE, ASA and note conversion", "Blocked. No template version is loaded."],
];

function SettingsPage() {
  const workspace = useSeedstage((state) => state.workspace);
  const setRole = useSeedstage((state) => state.setRole);
  const restoreDemo = useSeedstage((state) => state.restoreDemo);
  const deleteWorkspace = useSeedstage((state) => state.deleteWorkspace);
  const manage = can(workspace.role, "manage_roles");
  const remove = can(workspace.role, "delete_workspace");

  return (
    <Frame title="Settings and audit" lede="Export is the copy you can take with you. Deletion clears this browser. It cannot reach a server that this build does not have.">
      <div className="flex flex-col gap-4">
        <Panel title="Demonstration role">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Who is using the workspace</span>
            <select
              className="min-h-11 rounded-md border border-border bg-bg px-3"
              disabled={!manage}
              value={workspace.role}
              onChange={(event) => setRole(event.target.value as Role)}
            >
              {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABEL[role]}</option>)}
            </select>
          </label>
          <p className="mt-3 text-sm text-muted">Board can read and export. Finance can edit numbers but cannot approve a send. Adviser can draft. Founder and admin can approve.</p>
        </Panel>
        <Panel title="Your information">
          <div className="flex flex-wrap gap-2">
            <PrimaryButton
              onClick={() => {
                const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "seedstage-workspace.json";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export JSON
            </PrimaryButton>
            <GhostButton disabled={!manage} onClick={restoreDemo}>Restore Northline demo</GhostButton>
            <GhostButton disabled={!remove} onClick={deleteWorkspace}>Delete this workspace</GhostButton>
          </div>
        </Panel>
        <Panel title="What this build is">
          <ul className="flex flex-col gap-3 text-sm">
            {STATUS.map(([item, state]) => (
              <li key={item}><p>{item}</p><p className="text-muted">{state}</p></li>
            ))}
          </ul>
          <div className="mt-4"><Notice>SeedStage does not arrange investments, hold client money, or tell you that a round will close. UK financial-promotion and introducing rules need counsel before a public launch.</Notice></div>
        </Panel>
        <Panel title="Audit">
          <ul className="flex flex-col gap-3 text-sm">
            {workspace.audit.map((event) => (
              <li key={event.id}>
                <p className="text-muted">{event.at.slice(0, 16).replace("T", " ")} · {event.actor} · {event.action}</p>
                <p>{event.detail}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Frame>
  );
}
