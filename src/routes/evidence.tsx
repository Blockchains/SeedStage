import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AreaField, Gate, GhostButton, Notice, Panel, Pill, PrimaryButton, TextField } from "@/components/seedstage/bits";
import { Frame } from "@/components/seedstage/shell";
import { findContradictions } from "@/lib/seedstage/claims";
import { extractClaimsWithGrok } from "@/lib/seedstage/grok";
import { formatMoney } from "@/lib/seedstage/money";
import { can } from "@/lib/seedstage/permissions";
import { useSeedstage } from "@/lib/seedstage/store";
import type { Claim } from "@/lib/seedstage/types";

export const Route = createFileRoute("/evidence")({ component: EvidencePage });

function valueLabel(claim: Claim): string {
  if (claim.value === null) return "No structured value";
  if (claim.unit === "money_minor") return formatMoney(claim.value, claim.currency ?? "GBP");
  return String(claim.value);
}

function EvidencePage() {
  const workspace = useSeedstage((state) => state.workspace);
  const reviewClaim = useSeedstage((state) => state.reviewClaim);
  const addDocument = useSeedstage((state) => state.addDocument);
  const parseDocument = useSeedstage((state) => state.parseDocument);
  const addGroundedClaims = useSeedstage((state) => state.addGroundedClaims);
  const [name, setName] = useState("Pasted note");
  const [text, setText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = !can(workspace.role, "review_claims");
  const contradictions = findContradictions(workspace.claims);

  return (
    <Frame title="Evidence" lede="Claims stay tied to a quote. A document can ask SeedStage to email someone. That sentence is stored. It is not obeyed.">
      <div className="flex flex-col gap-4">
        {contradictions.map((item) => (
          <Panel key={item.id} title={`${item.metricKey} · ${item.period}`} aside={<Pill tone="bad">Contradiction</Pill>}>
            <p className="text-sm text-muted">{item.note}</p>
          </Panel>
        ))}
        <div className="flex flex-col gap-3">
          {workspace.claims.map((claim) => {
            const source = workspace.documents.find((document) => document.id === claim.sourceId);
            const conflicted = contradictions.some((item) => item.claimIds.includes(claim.id));
            return (
              <Panel key={claim.id} title={claim.text} aside={<Pill tone={claim.status === "accepted" ? "ok" : claim.status === "rejected" ? "bad" : "warn"}>{claim.status}</Pill>}>
                <dl className="grid gap-2 text-sm md:grid-cols-2">
                  <div><dt className="text-muted">Value</dt><dd className="num">{valueLabel(claim)}</dd></div>
                  <div><dt className="text-muted">Kind</dt><dd>{claim.kind.replaceAll("_", " ")} · {claim.observed}</dd></div>
                  <div><dt className="text-muted">Period</dt><dd>{claim.period ?? "Unknown"}</dd></div>
                  <div><dt className="text-muted">Extraction</dt><dd>{claim.extraction.replaceAll("_", " ")}</dd></div>
                </dl>
                <p className="mt-3 text-sm">“{claim.evidenceQuote}”</p>
                <p className="mt-1 text-xs text-muted">{source?.name ?? "Missing source"} · {claim.confidenceNote}</p>
                {conflicted ? <p className="mt-2 text-sm text-danger">This figure conflicts with another unrejected claim. Neither is preferred.</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <GhostButton disabled={locked} onClick={() => reviewClaim(claim.id, "accepted")}>Accept</GhostButton>
                  <GhostButton disabled={locked} onClick={() => reviewClaim(claim.id, "rejected")}>Reject</GhostButton>
                  <GhostButton disabled={locked} onClick={() => reviewClaim(claim.id, "pending")}>Return to pending</GhostButton>
                </div>
              </Panel>
            );
          })}
          {workspace.claims.length === 0 ? <Notice>No claims yet. Paste a structured block, or ask Grok to propose quotes it can point at.</Notice> : null}
        </div>
        <Panel title="Add a document">
          <Gate action="review_claims">
            <div className="flex flex-col gap-3">
              <TextField label="Name" value={name} onChange={setName} />
              <AreaField label="Text" value={text} onChange={setText} />
              <p className="text-xs text-muted">A structured block starts with a line containing only `--- claim ---`, then text, metric, period, value, unit, currency and kind.</p>
              <div className="flex flex-wrap gap-2">
                <PrimaryButton
                  onClick={() => {
                    const documentId = addDocument(name, text);
                    if (!documentId) return;
                    setMessage(parseDocument(documentId));
                    setText("");
                  }}
                >
                  Store and parse blocks
                </PrimaryButton>
                <GhostButton
                  disabled={busy || text.trim().length < 20}
                  onClick={() => {
                    void (async () => {
                      const documentId = addDocument(name, text);
                      if (!documentId) return;
                      setBusy(true);
                      setMessage(null);
                      try {
                        const result = await extractClaimsWithGrok({ data: { source: text } });
                        if (!result.ok) {
                          setMessage(result.error);
                          return;
                        }
                        const kept = addGroundedClaims(documentId, result.claims);
                        const dropped = result.claims.length - kept;
                        setMessage(
                          kept
                            ? `${kept} candidate claim(s) added as pending.${dropped ? ` ${dropped} dropped because the quote was not in the document.` : ""}`
                            : "Nothing was added. Grok's quotes did not match the document.",
                        );
                        setText("");
                      } catch (error) {
                        setMessage(error instanceof Error ? error.message : "Grok could not be reached.");
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }}
                >
                  {busy ? "Asking Grok…" : "Extract with Grok"}
                </GhostButton>
              </div>
              {message ? <Notice>{message}</Notice> : null}
            </div>
          </Gate>
        </Panel>
        <Panel title="Sources">
          <ul className="flex flex-col gap-4">
            {workspace.documents.map((document) => (
              <li key={document.id} className="text-sm">
                <p>{document.name}</p>
                <p className="text-muted">{document.scan.replaceAll("_", " ")} · {document.quarantine.replaceAll("_", " ")} · {document.uploadedAt.slice(0, 10)}</p>
                <p className="mt-1 text-muted">{document.note}</p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-bg p-3 text-xs leading-relaxed">{document.text}</pre>
              </li>
            ))}
            {workspace.documents.length === 0 ? <li className="text-sm text-muted">No documents.</li> : null}
          </ul>
        </Panel>
      </div>
    </Frame>
  );
}
