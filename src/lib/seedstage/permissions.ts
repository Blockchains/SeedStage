import type { Role } from "./types.ts";

export type Action =
  | "edit_company"
  | "review_claims"
  | "edit_plan"
  | "edit_round"
  | "shortlist"
  | "edit_pipeline"
  | "draft"
  | "approve"
  | "release_action"
  | "export"
  | "delete_workspace"
  | "manage_roles"
  | "edit_diligence";

const MATRIX: Record<Role, Action[]> = {
  founder: [
    "edit_company",
    "review_claims",
    "edit_plan",
    "edit_round",
    "shortlist",
    "edit_pipeline",
    "draft",
    "approve",
    "release_action",
    "export",
    "delete_workspace",
    "manage_roles",
    "edit_diligence",
  ],
  finance: ["edit_company", "review_claims", "edit_plan", "edit_round", "export", "edit_diligence"],
  adviser: ["review_claims", "shortlist", "edit_pipeline", "draft", "export", "edit_diligence"],
  board: ["export"],
  admin: [
    "edit_company",
    "review_claims",
    "edit_plan",
    "edit_round",
    "shortlist",
    "edit_pipeline",
    "draft",
    "approve",
    "release_action",
    "export",
    "delete_workspace",
    "manage_roles",
    "edit_diligence",
  ],
};

export function can(role: Role, action: Action): boolean {
  return MATRIX[role].includes(action);
}

export const ROLE_LABEL: Record<Role, string> = {
  founder: "Founder",
  finance: "Finance lead",
  adviser: "Adviser",
  board: "Board, read only",
  admin: "Administrator",
};
