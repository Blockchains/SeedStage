import { findContradictions, quoteIsInSource } from "./claims.ts";
import type { Claim, DocumentRecord, Workspace } from "./types.ts";

export const ROOM_CATEGORIES = [
  "01 Company overview",
  "02 Corporate records",
  "03 Ownership and financing",
  "04 Financial information",
  "05 Commercial evidence",
  "06 Product and technology",
  "07 Intellectual property",
  "08 People and agreements",
  "09 Security and privacy",
  "10 Material risks and disputes",
  "11 Funding plan",
  "12 Investor questions",
] as const;

export type RoomCategory = (typeof ROOM_CATEGORIES)[number];
export type RoomShare = "held" | "approved" | "restricted";
export type RoomReadiness = "missing" | "held" | "needs_review" | "restricted" | "approved";

export type RoomFile = {
  documentId: string;
  category: RoomCategory;
  share: RoomShare;
};

export type RoomGrant = {
  investorId: string;
  documentIds: string[];
};

export type RoomQuestion = { id: string; text: string };

export function roomFile(files: RoomFile[], documentId: string): RoomFile {
  return files.find((file) => file.documentId === documentId) ?? { documentId, category: "01 Company overview", share: "held" };
}

export function categoryReadiness(workspace: Pick<Workspace, "documents" | "claims" | "roomFiles">): { category: RoomCategory; status: RoomReadiness; detail: string }[] {
  return ROOM_CATEGORIES.map((category) => {
    const docs = workspace.documents.filter((document) => roomFile(workspace.roomFiles, document.id).category === category);
    if (docs.length === 0) return { category, status: "missing", detail: "No document on file." };
    const shares = docs.map((document) => roomFile(workspace.roomFiles, document.id).share);
    if (shares.every((share) => share === "restricted")) return { category, status: "restricted", detail: "Held back from every room." };
    if (shares.some((share) => share === "approved")) return { category, status: "approved", detail: "An approved copy can be granted." };
    const pending = workspace.claims.some((claim) => claim.status === "pending" && docs.some((document) => document.id === claim.sourceId));
    if (pending) return { category, status: "needs_review", detail: "A claim on these documents is still pending." };
    return { category, status: "held", detail: "On file. Not approved for a room." };
  });
}

export function investorRoom(workspace: Pick<Workspace, "documents" | "claims" | "roomFiles" | "roomGrants" | "diligence">, investorId: string): {
  documents: DocumentRecord[];
  claims: Claim[];
  questions: RoomQuestion[];
} {
  const grant = workspace.roomGrants.find((item) => item.investorId === investorId);
  const allowed = new Set(
    (grant?.documentIds ?? []).filter((documentId) => roomFile(workspace.roomFiles, documentId).share === "approved"),
  );
  const documents = workspace.documents.filter((document) => allowed.has(document.id));
  const contradictions = findContradictions(workspace.claims);
  const blocked = new Set(contradictions.flatMap((item) => item.claimIds));
  const claims = workspace.claims.filter((claim) => {
    if (claim.status !== "accepted" || !allowed.has(claim.sourceId) || blocked.has(claim.id)) return false;
    const source = documents.find((document) => document.id === claim.sourceId);
    return Boolean(source && quoteIsInSource(claim.evidenceQuote, source.text));
  });
  const questions: RoomQuestion[] = [
    ...categoryReadiness(workspace)
      .filter((item) => item.status === "missing")
      .map((item) => ({ id: `missing-${item.category}`, text: `${item.category}: no document on file.` })),
    ...contradictions.map((item) => ({
      id: item.id,
      text: `${item.metricKey} for ${item.period} is not in the room. The sources disagree.`,
    })),
    ...workspace.diligence
      .filter((item) => item.status === "missing")
      .map((item) => ({ id: item.id, text: `${item.request}: missing.` })),
  ];
  return { documents, claims, questions };
}

export function grantAllows(share: RoomShare): boolean {
  return share === "approved";
}
