export type ApprovalPayload = {
  action: "release_outreach";
  recipient: string;
  sender: string;
  subject: string;
  body: string;
  attachmentIds: string[];
  idempotencyKey: string;
  expiresAt: string;
};

export function contentHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5 ^ 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c + i;
    h2 = Math.imul(h2, 0x01000193);
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  return `fnv-${hex(h1)}${hex(h2)}`;
}

export function approvalHash(payload: ApprovalPayload): string {
  return contentHash(
    JSON.stringify({
      action: payload.action,
      recipient: payload.recipient.trim(),
      sender: payload.sender.trim(),
      subject: payload.subject,
      body: payload.body,
      attachmentIds: [...payload.attachmentIds].sort(),
      idempotencyKey: payload.idempotencyKey,
      expiresAt: payload.expiresAt,
    }),
  );
}

export type ReleaseResult =
  | { ok: true; duplicate: boolean; delivery: "not_connected"; detail: string }
  | { ok: false; reason: string };

export function releaseAction(input: {
  now: string;
  approvedHash: string;
  payload: ApprovalPayload;
  alreadyReleasedKeys: string[];
}): ReleaseResult {
  const hash = approvalHash(input.payload);
  if (hash !== input.approvedHash) {
    return { ok: false, reason: "The recipient, sender, subject, body, attachments or expiry no longer match the approval." };
  }
  if (Date.parse(input.payload.expiresAt) < Date.parse(input.now)) {
    return { ok: false, reason: "This approval has expired. Approve the action again." };
  }
  if (!input.payload.recipient.trim() || !input.payload.sender.trim()) {
    return { ok: false, reason: "Sender and recipient are required." };
  }
  if (input.alreadyReleasedKeys.includes(input.payload.idempotencyKey)) {
    return {
      ok: true,
      duplicate: true,
      delivery: "not_connected",
      detail: "This idempotency key was already used. No second action was created, and nothing was sent.",
    };
  }
  return {
    ok: true,
    duplicate: false,
    delivery: "not_connected",
    detail: "Action locked. No email provider is connected, so nothing was sent.",
  };
}
