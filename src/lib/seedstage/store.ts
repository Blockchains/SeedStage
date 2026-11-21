import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { releaseAction, approvalHash, type ApprovalPayload } from "./approvals.ts";
import { authorityFromUntrustedText, parseStructuredClaims, quoteIsInSource } from "./claims.ts";
import { can } from "./permissions.ts";
import { grantAllows, roomFile, type RoomCategory, type RoomShare } from "./room.ts";
import { demoWorkspace, emptyWorkspace } from "./seed.ts";
import type { Claim, Company, PipelineStage, PlanAssumptions, Role, RoundInput, Workspace } from "./types.ts";

type MemoryStorage = {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
};

const memory: MemoryStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

type Store = {
  workspace: Workspace;
  setRole: (role: Role) => void;
  setCompany: (key: keyof Omit<Company, "team">, value: string) => void;
  reviewClaim: (claimId: string, status: Claim["status"]) => void;
  addDocument: (name: string, text: string) => string | null;
  parseDocument: (documentId: string) => string;
  addGroundedClaims: (documentId: string, drafts: Omit<Claim, "id" | "status" | "sourceId" | "extraction" | "updatedAt" | "history" | "observed" | "confidenceNote">[]) => number;
  setPlan: (patch: Partial<PlanAssumptions>) => void;
  setRound: (patch: Partial<RoundInput>) => void;
  saveRound: () => void;
  toggleShortlist: (investorId: string) => void;
  setStage: (opportunityId: string, stage: PipelineStage) => void;
  suggestStage: (opportunityId: string, stage: PipelineStage) => void;
  addOpportunity: (investorId: string) => void;
  setDraft: (draft: { id?: string; kind: Workspace["drafts"][number]["kind"]; investorId: string | null; subject: string; body: string; origin: "deterministic" | "grok" }) => string | null;
  approveDraft: (draftId: string, recipient: string, sender: string) => string | null;
  release: (approvalId: string) => string;
  setDiligence: (itemId: string, status: Workspace["diligence"][number]["status"]) => void;
  setRoomShare: (documentId: string, share: RoomShare) => void;
  setRoomCategory: (documentId: string, category: RoomCategory) => void;
  toggleRoomGrant: (investorId: string, documentId: string) => void;
  markReviewed: () => void;
  restoreDemo: () => void;
  deleteWorkspace: () => void;
};

function audit(workspace: Workspace, action: string, detail: string): Workspace {
  return {
    ...workspace,
    audit: [{ id: id(), at: now(), actor: workspace.role, action, detail }, ...workspace.audit].slice(0, 200),
  };
}

export const useSeedstage = create<Store>()(
  persist(
    (set, get) => ({
      workspace: demoWorkspace(),
      setRole: (role) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "manage_roles")) return;
        set({ workspace: audit({ ...workspace, role }, "role_changed", `Demonstration role is now ${role}. This is not a signed-in identity.`) });
      },
      setCompany: (key, value) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "edit_company")) return;
        const next = value.trim() ? value.trim() : null;
        set({
          workspace: audit(
            {
              ...workspace,
              company: {
                ...workspace.company,
                [key]: {
                  value: next,
                  provenance: next ? { source: "Typed in the workspace", method: "user_entered" as const, at: now() } : null,
                },
              },
            },
            "company_updated",
            `${key} ${next ? "updated" : "cleared"}.`,
          ),
        });
      },
      reviewClaim: (claimId, status) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "review_claims")) return;
        set({
          workspace: audit(
            {
              ...workspace,
              claims: workspace.claims.map((claim) =>
                claim.id === claimId
                  ? { ...claim, status, updatedAt: now(), history: [...claim.history, { at: now(), status, note: "Reviewed in workspace" }] }
                  : claim,
              ),
            },
            "claim_reviewed",
            `${claimId} marked ${status}.`,
          ),
        });
      },
      addDocument: (name, text) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "review_claims")) return null;
        authorityFromUntrustedText(text);
        const documentId = id();
        set({
          workspace: audit(
            {
              ...workspace,
              documents: [
                {
                  id: documentId,
                  name: name.trim() || "Pasted document",
                  mediaType: "text/plain",
                  text,
                  uploadedAt: now(),
                  method: "user_paste",
                  quarantine: "user_supplied_unscanned",
                  scan: "not_connected",
                  note: "No malware scanner is connected. Text is untrusted.",
                },
                ...workspace.documents,
              ],
              roomFiles: [{ documentId, category: "01 Company overview", share: "held" }, ...workspace.roomFiles],
            },
            "document_added",
            "Paste stored. Instructions inside it were not applied.",
          ),
        });
        return documentId;
      },
      parseDocument: (documentId) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "review_claims")) return "You cannot add claims in this role.";
        const document = workspace.documents.find((item) => item.id === documentId);
        if (!document) return "Document not found.";
        authorityFromUntrustedText(document.text);
        const parsed = parseStructuredClaims(document.text);
        if (parsed.claims.length === 0) return parsed.note;
        const claims: Claim[] = parsed.claims.map((item) => ({
          ...item,
          id: id(),
          observed: "observed",
          status: "pending",
          sourceId: document.id,
          extraction: "structured_parse",
          confidenceNote: "Parsed from a structured block. Not yet reviewed.",
          updatedAt: now(),
          history: [],
        }));
        set({
          workspace: audit({ ...workspace, claims: [...claims, ...workspace.claims] }, "claims_parsed", parsed.note),
        });
        return parsed.note;
      },
      addGroundedClaims: (documentId, drafts) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "review_claims")) return 0;
        const document = workspace.documents.find((item) => item.id === documentId);
        if (!document) return 0;
        const grounded = drafts.filter((draft) => quoteIsInSource(draft.evidenceQuote, document.text));
        const claims: Claim[] = grounded.map((draft) => ({
          ...draft,
          id: id(),
          observed: "inferred",
          status: "pending",
          sourceId: document.id,
          extraction: "grok",
          confidenceNote: "Grok candidate. Quote checked against the source. Still needs a person.",
          updatedAt: now(),
          history: [],
        }));
        if (claims.length === 0) return 0;
        set({
          workspace: audit(
            { ...workspace, claims: [...claims, ...workspace.claims] },
            "grok_claims_proposed",
            `${claims.length} grounded candidate(s) added as pending. Ungrounded lines were dropped.`,
          ),
        });
        return claims.length;
      },
      setPlan: (patch) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "edit_plan")) return;
        set({ workspace: audit({ ...workspace, plan: { ...workspace.plan, ...patch } }, "plan_updated", "Funding-plan assumptions changed.") });
      },
      setRound: (patch) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "edit_round")) return;
        set({ workspace: audit({ ...workspace, roundDraft: { ...workspace.roundDraft, ...patch } }, "round_updated", "Round inputs changed.") });
      },
      saveRound: () => {
        const workspace = get().workspace;
        if (!can(workspace.role, "edit_round")) return;
        set({
          workspace: audit(
            {
              ...workspace,
              roundVersions: [
                { id: id(), savedAt: now(), input: workspace.roundDraft, engine: "priced-equity-1" },
                ...workspace.roundVersions,
              ].slice(0, 12),
            },
            "round_saved",
            `Saved “${workspace.roundDraft.name}”.`,
          ),
        });
      },
      toggleShortlist: (investorId) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "shortlist")) return;
        const has = workspace.shortlist.includes(investorId);
        set({
          workspace: audit(
            { ...workspace, shortlist: has ? workspace.shortlist.filter((item) => item !== investorId) : [...workspace.shortlist, investorId] },
            "shortlist_changed",
            has ? "Removed from shortlist." : "Saved to shortlist.",
          ),
        });
      },
      setStage: (opportunityId, stage) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "edit_pipeline")) return;
        set({
          workspace: audit(
            {
              ...workspace,
              opportunities: workspace.opportunities.map((item) =>
                item.id === opportunityId ? { ...item, stage, stageSource: "user", suggestion: null, updatedAt: now() } : item,
              ),
              activities: [
                { id: id(), opportunityId, at: now(), kind: "stage", text: `Stage set to ${stage} by a person.` },
                ...workspace.activities,
              ],
            },
            "stage_set",
            `${opportunityId} is now ${stage}.`,
          ),
        });
      },
      suggestStage: (opportunityId, stage) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "edit_pipeline")) return;
        set({
          workspace: {
            ...workspace,
            opportunities: workspace.opportunities.map((item) => (item.id === opportunityId ? { ...item, suggestion: stage } : item)),
            activities: [
              { id: id(), opportunityId, at: now(), kind: "suggestion", text: `Suggested ${stage}. The confirmed stage was left unchanged.` },
              ...workspace.activities,
            ],
          },
        });
      },
      addOpportunity: (investorId) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "edit_pipeline")) return;
        if (workspace.opportunities.some((item) => item.investorId === investorId)) return;
        const opportunityId = id();
        set({
          workspace: audit(
            {
              ...workspace,
              opportunities: [
                {
                  id: opportunityId,
                  investorId,
                  stage: "researching",
                  stageSource: "user",
                  suggestion: null,
                  owner: "Unassigned",
                  nextAction: "Decide whether this firm is worth a conversation.",
                  nextDate: null,
                  introSource: "None recorded",
                  declineReason: null,
                  notes: "",
                  updatedAt: now(),
                },
                ...workspace.opportunities,
              ],
            },
            "opportunity_added",
            investorId,
          ),
        });
      },
      setDraft: (draft) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "draft")) return null;
        const draftId = draft.id ?? id();
        const next = {
          id: draftId,
          kind: draft.kind,
          investorId: draft.investorId,
          subject: draft.subject,
          body: draft.body,
          origin: draft.origin,
          updatedAt: now(),
        };
        const exists = workspace.drafts.some((item) => item.id === draftId);
        set({
          workspace: audit(
            {
              ...workspace,
              drafts: exists ? workspace.drafts.map((item) => (item.id === draftId ? next : item)) : [next, ...workspace.drafts],
            },
            "draft_saved",
            `${next.origin} draft saved. It is not approved.`,
          ),
        });
        return draftId;
      },
      approveDraft: (draftId, recipient, sender) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "approve")) return "This role cannot approve an external action.";
        const draft = workspace.drafts.find((item) => item.id === draftId);
        if (!draft) return "Draft not found.";
        if (!recipient.trim() || !sender.trim()) return "Enter the exact recipient and sender.";
        const payload: ApprovalPayload = {
          action: "release_outreach",
          recipient: recipient.trim(),
          sender: sender.trim(),
          subject: draft.subject,
          body: draft.body,
          attachmentIds: [],
          idempotencyKey: id(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        const record = {
          id: id(),
          draftId,
          ...payload,
          hash: approvalHash(payload),
          approvedAt: now(),
          approvedBy: workspace.role,
        };
        set({ workspace: audit({ ...workspace, approvals: [record, ...workspace.approvals] }, "approved", `Approved ${record.id} for ${payload.recipient}.`) });
        return null;
      },
      release: (approvalId) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "release_action")) return "This role cannot release an action.";
        const approval = workspace.approvals.find((item) => item.id === approvalId);
        if (!approval) return "Approval not found.";
        const payload: ApprovalPayload = {
          action: approval.action,
          recipient: approval.recipient,
          sender: approval.sender,
          subject: approval.subject,
          body: approval.body,
          attachmentIds: approval.attachmentIds,
          idempotencyKey: approval.idempotencyKey,
          expiresAt: approval.expiresAt,
        };
        const result = releaseAction({
          now: now(),
          approvedHash: approval.hash,
          payload,
          alreadyReleasedKeys: workspace.actions.map((item) => item.idempotencyKey),
        });
        if (!result.ok) return result.reason;
        if (result.duplicate) return result.detail;
        set({
          workspace: audit(
            {
              ...workspace,
              actions: [
                {
                  id: id(),
                  approvalId,
                  idempotencyKey: approval.idempotencyKey,
                  hash: approval.hash,
                  at: now(),
                  delivery: "not_connected",
                  outcome: "locked_nothing_sent",
                },
                ...workspace.actions,
              ],
            },
            "action_locked",
            result.detail,
          ),
        });
        return result.detail;
      },
      setDiligence: (itemId, status) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "edit_diligence")) return;
        set({
          workspace: {
            ...workspace,
            diligence: workspace.diligence.map((item) => (item.id === itemId ? { ...item, status } : item)),
          },
        });
      },
      setRoomShare: (documentId, share) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "edit_diligence")) return;
        const current = roomFile(workspace.roomFiles, documentId);
        const roomFiles = [
          { ...current, share },
          ...workspace.roomFiles.filter((file) => file.documentId !== documentId),
        ];
        const roomGrants = share === "approved"
          ? workspace.roomGrants
          : workspace.roomGrants.map((grant) => ({ ...grant, documentIds: grant.documentIds.filter((id) => id !== documentId) }));
        set({ workspace: audit({ ...workspace, roomFiles, roomGrants }, "room_share", `${documentId} marked ${share}.`) });
      },
      setRoomCategory: (documentId, category) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "edit_diligence")) return;
        const current = roomFile(workspace.roomFiles, documentId);
        set({
          workspace: audit(
            {
              ...workspace,
              roomFiles: [{ ...current, category }, ...workspace.roomFiles.filter((file) => file.documentId !== documentId)],
            },
            "room_category",
            `${documentId} filed under ${category}.`,
          ),
        });
      },
      toggleRoomGrant: (investorId, documentId) => {
        const workspace = get().workspace;
        if (!can(workspace.role, "approve")) return;
        const share = roomFile(workspace.roomFiles, documentId).share;
        if (!grantAllows(share)) return;
        const existing = workspace.roomGrants.find((grant) => grant.investorId === investorId) ?? { investorId, documentIds: [] };
        const on = existing.documentIds.includes(documentId);
        const documentIds = on ? existing.documentIds.filter((id) => id !== documentId) : [...existing.documentIds, documentId];
        const roomGrants = [
          { investorId, documentIds },
          ...workspace.roomGrants.filter((grant) => grant.investorId !== investorId),
        ].filter((grant) => grant.documentIds.length > 0);
        set({
          workspace: audit(
            { ...workspace, roomGrants },
            "room_grant",
            on ? `${documentId} removed from ${investorId}.` : `${documentId} granted to ${investorId}.`,
          ),
        });
      },
      markReviewed: () => {
        const workspace = get().workspace;
        set({ workspace: audit({ ...workspace, lastReviewedAt: now() }, "review_marked", "Review bookmark moved to now.") });
      },
      restoreDemo: () => {
        if (!can(get().workspace.role, "manage_roles")) return;
        set({ workspace: demoWorkspace() });
      },
      deleteWorkspace: () => {
        const workspace = get().workspace;
        if (!can(workspace.role, "delete_workspace")) return;
        const fresh = emptyWorkspace();
        fresh.audit = [
          {
            id: id(),
            at: now(),
            actor: workspace.role,
            action: "workspace_deleted",
            detail: "Browser copy removed: documents, claims, drafts, approvals and shortlist. No server copy exists in this build.",
          },
          ...fresh.audit,
        ];
        set({ workspace: fresh });
      },
    }),
    {
      name: "seedstage.workspace.v12",
      skipHydration: true,
      storage: createJSONStorage(() => (typeof window === "undefined" ? memory : window.localStorage)),
      partialize: (state) => ({ workspace: state.workspace }) as Store,
    },
  ),
);
