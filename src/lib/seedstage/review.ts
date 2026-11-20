import { findContradictions } from "./claims.ts";
import type { Workspace } from "./types.ts";

export function nextAction(workspace: Workspace): { to: string; title: string; detail: string } {
  const contradictions = findContradictions(workspace.claims);
  const pending = workspace.claims.filter((claim) => claim.status === "pending");
  if (contradictions.length > 0) {
    return {
      to: "/evidence",
      title: "Resolve the open contradiction",
      detail: "Two unrejected figures disagree. Accept one, reject one, or leave both visible. Do not average them.",
    };
  }
  if (pending.length > 0) {
    return {
      to: "/evidence",
      title: "Review claims that are still pending",
      detail: `${pending.length} claim(s) are not yet accepted or rejected. Briefs only use accepted claims.`,
    };
  }
  if (workspace.roundVersions.length === 0) {
    return {
      to: "/round",
      title: "Save a priced-round scenario",
      detail: "The draft is calculated live. Saving stores the inputs you are willing to compare later.",
    };
  }
  if (workspace.shortlist.length === 0) {
    return {
      to: "/investors",
      title: "Shortlist firms that survive the hard constraints",
      detail: "Disqualified mandates stay visible, with the reason. The sort aid is not a probability.",
    };
  }
  if (workspace.approvals.length === 0) {
    return {
      to: "/materials",
      title: "Draft from accepted evidence",
      detail: "Generate a brief or note, then approve the exact recipient, sender and body.",
    };
  }
  if (workspace.actions.length === 0) {
    return {
      to: "/approvals",
      title: "Release or hold the approved action",
      detail: "Release locks the payload. No email provider is connected, so nothing is sent.",
    };
  }
  return {
    to: "/settings",
    title: "Export the case",
    detail: "The review trail is in this browser. Export it before you clear the workspace.",
  };
}
