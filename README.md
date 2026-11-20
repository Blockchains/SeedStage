# SeedStage

Evidence, cash planning, priced-round maths and investor-fit explanations for a seed raise.

The working workspace is the app in this repository. Northline, the firm names and the documents in the first-run workspace are synthetic. They are labelled as such in the product.

## What is implemented

- Company profile with provenance, or an explicit unknown.
- Documents, structured-claim parsing, contradiction detection, and human accept / reject.
- Grok extraction and drafting, only when you ask. A candidate claim is kept only if its quote is in the source. Instructions inside a document do not grant permission.
- Monthly cash bridge. Runway is the first month that closes under the buffer, not cash divided by average burn.
- Priced equity with two named option-pool mechanics. SAFE and note conversion are refused.
- Investor matching that separates hard exclusions from reasons for, reasons against and unknowns.
- Pipeline stages that a suggestion cannot overwrite.
- Drafts, content-locked approvals, and a release that does not send email because no provider is connected.
- Export, browser deletion, and a role gate for founder, finance, adviser, board and admin.

## What is not implemented

- Production sign-in, MFA, or database tenant isolation. Roles live in the browser. Do not store secrets in the workspace.
- Licensed investor data, verified emails, malware scanning, bank feeds, or outbound email.
- A legal cap table, an investment exchange, or a probability of raising.
- GitHub Pages hosting. This app is a server-rendered workspace, not a static site.

## Tests

The financial and policy tests do not need a database:

```bash
node --experimental-strip-types --test src/lib/seedstage/*.test.ts
```

Engines:

- `priced-equity-1` in `src/lib/seedstage/round.ts`
- `cash-bridge-1` in `src/lib/seedstage/cash.ts`
- `match-aid-1` in `src/lib/seedstage/match.ts` (a sort aid, not a probability)

## Stack

TypeScript, TanStack Start, React, Tailwind, Zustand. Calculations are deterministic and do not call a model. Grok is used only from server functions behind an explicit button, model `grok-4.5`.
