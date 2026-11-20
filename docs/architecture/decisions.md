# Architecture decisions

## One workspace, not a service mesh

The founder journey runs in one TypeScript application. Calculations, matching, claims and approvals are modules with tests. There is no second backend, queue or agent swarm. A queue would not make the arithmetic more correct.

## Evidence before prose

Briefs and outreach read accepted claims. Pending and rejected claims are withheld. Contradictions are listed and are not averaged.

## Grok is a proposer

`grok-4.5` may propose claims or tighten a draft after a button press. Claim proposals must quote the document verbatim (normalised whitespace, at least 12 characters). The model cannot approve, send, or change a pipeline stage. Untrusted text is passed through `authorityFromUntrustedText`, which returns no actions.

## Browser system of record, for now

Zustand persists the workspace in `localStorage`. That is enough to complete the journey in this product. It is not tenant isolation. A Postgres schema should follow this model; it is not pretended here, because a migration that the running app does not use would be a false system of record.

## Approvals are content hashes

`approvalHash` covers action, recipient, sender, subject, body, attachments, idempotency key and expiry. It is a lock against accidental change, not a MAC. Production should sign with a server secret. Release refuses a mismatch, an expiry, and a repeated idempotency key. Delivery is `not_connected`.

## No generic convertible formula

`unsupportedInstrument` blocks SAFEs and notes. A later template must name its version and its own tests.
