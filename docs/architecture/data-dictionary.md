# Data dictionary

The running record is the browser workspace (`Workspace` in `src/lib/seedstage/types.ts`). Names below are the fields a later Postgres schema should keep. Tenant columns are not implemented.

| Record | Purpose | Delete behaviour |
| --- | --- | --- |
| Workspace | One funding case. `demo` marks synthetic data. | Browser delete replaces it with an empty case. |
| Company field | Value plus provenance, or null. | Cleared with the workspace. |
| Document | Original text, scan status, quarantine label. | Removed with the workspace. No object store. |
| Claim | Statement, metric, period, value, kind, status, quote, history. | Rejected claims stay for audit until workspace delete. |
| Contradiction | Derived. Not stored. Same metric, period and currency, two unrejected values. | Disappears when a claim is rejected or edited away. |
| Plan assumptions | Cash-bridge inputs. Confirmed months are separate from growth. | Replaced on delete. |
| Round draft and versions | Priced-equity inputs and saved snapshots. | Replaced on delete. |
| Investor | Synthetic firm, fund, person, mandate, source date. `confirmed` is false. | Replaced on delete. |
| Match | Derived by `assessInvestor`. Not stored. | — |
| Opportunity | Pipeline stage with `stageSource: user` and an optional suggestion. | Replaced on delete. |
| Activity | Note, stage change, or suggestion. | Replaced on delete. |
| Draft | Subject, body, origin `deterministic` or `grok`. | Replaced on delete. |
| Approval | Exact payload plus hash, expiry, idempotency key, role. | Replaced on delete. |
| External action | Lock only. `delivery: not_connected`. | Replaced on delete. |
| Diligence item | Request, status, optional claim link. | Replaced on delete. |
| Audit event | Actor role, action, detail, time. Capped at 200. | The delete itself writes one new event on the empty case. |

Money is integer minor units. Shares are integers. Percentages in the interface are basis points divided for display.
