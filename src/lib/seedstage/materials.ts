import { findContradictions } from "./claims.ts";
import { formatBps, formatMoney, formatShares } from "./money.ts";
import { modelPricedRound } from "./round.ts";
import type { Claim, Investor, Workspace } from "./types.ts";

function accepted(claims: Claim[]): Claim[] {
  return claims.filter((claim) => claim.status === "accepted");
}

function linesFor(claims: Claim[]): string[] {
  if (claims.length === 0) return ["- No accepted claims yet. Figures below are not treated as facts."];
  return claims.map((claim) => {
    const value =
      claim.value === null
        ? "no structured value"
        : claim.unit === "money_minor"
          ? formatMoney(claim.value, claim.currency ?? "GBP")
          : String(claim.value);
    return `- ${claim.text} (${claim.kind}, ${claim.period ?? "no period"}, ${value}). Source ${claim.sourceId}. Quote: “${claim.evidenceQuote}”.`;
  });
}

export function fundingBrief(workspace: Workspace): string {
  const company = workspace.company;
  const contradictions = findContradictions(workspace.claims);
  const round = modelPricedRound(workspace.roundDraft);
  const name = company.tradingName.value ?? company.legalName.value ?? "This company";
  return [
    `# Funding brief — ${name}`,
    "",
    workspace.demo ? "Demonstration workspace. Names, documents and investors are synthetic." : "Founder-entered workspace.",
    "",
    "## What is accepted",
    ...linesFor(accepted(workspace.claims)),
    "",
    "## Unresolved",
    contradictions.length
      ? contradictions.map((item) => `- ${item.metricKey} ${item.period}: ${item.note}`).join("\n")
      : "- No open numeric contradictions among unrejected claims.",
    "",
    "## Round scenario",
    round.ok
      ? [
          `- ${round.input.mechanic}, engine ${round.engine}.`,
          `- Pre-money ${formatMoney(round.input.preMoneyMinor, round.input.currency)}, investment ${formatMoney(round.input.investmentMinor, round.input.currency)}, post-money ${formatMoney(round.postMoneyMinor, round.input.currency)}.`,
          `- New investor ${formatShares(round.investorShares)} shares (${formatBps(round.investorBps)}). Holders ${formatBps(round.holderBps)}. Unallocated pool ${formatBps(round.poolBps)}.`,
          "- Not a valuation opinion.",
        ].join("\n")
      : `- Scenario blocked: ${round.reason}`,
    "",
    "## Missing",
    "- Verified company number and domain.",
    "- Independently corroborated revenue, unless an accepted claim says otherwise.",
    "- Investor confirmation of mandate, cheque and contact route.",
  ].join("\n");
}

export function outreachDraft(workspace: Workspace, investor: Investor): { subject: string; body: string } {
  const name = workspace.company.tradingName.value ?? "the company";
  const facts = accepted(workspace.claims)
    .slice(0, 4)
    .map((claim) => claim.text)
    .join(" ");
  return {
    subject: `${name} — seed conversation`,
    body: [
      `Hello${investor.partner ? ` ${investor.partner}` : ""},`,
      "",
      `I am writing about ${name}. This draft uses only accepted evidence and the public-style mandate on file for ${investor.firm}.`,
      "",
      facts || "No claims have been accepted yet, so this draft does not state traction.",
      "",
      `${investor.firm} is marked synthetic and unconfirmed. Please replace the recipient before any approval.`,
      "",
      "Nothing in this draft is permission to send it.",
    ].join("\n"),
  };
}

export function meetingBrief(workspace: Workspace, investor: Investor): string {
  return [
    `# Meeting brief — ${investor.firm}`,
    "",
    `Fund: ${investor.fund}. Partner on file: ${investor.partner ?? "Unknown"}.`,
    `Source: ${investor.source} (${investor.sourceDate}). Not confirmed by the firm.`,
    "",
    "## Accepted evidence you can say aloud",
    ...linesFor(accepted(workspace.claims)),
    "",
    "## Do not say",
    "- Any pending, rejected or contradictory figure.",
    "- That SeedStage has predicted they will invest.",
    "- A contact detail that is not on the record.",
  ].join("\n");
}
