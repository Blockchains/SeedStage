# Threat model

Assets: company evidence, draft emails, approval decisions, round assumptions.

## In this build

| Threat | Control | Limit |
| --- | --- | --- |
| Document says “send the data room” | Parser and Grok prompts treat text as data. No action is created from it. | A person can still paste that text into a draft. |
| Model invents a metric | Quote must occur in the source. Schema is validated. | A true quote can still be a bad interpretation. A person accepts claims. |
| Approval reused after an edit | Hash mismatch blocks release. | Hash is not a keyed MAC. |
| Double send | Idempotency key returns the first lock and does not create a second action. | Nothing is sent either time, because email is not connected. |
| Cross-tenant read | Not applicable. There is one browser workspace and no accounts. | This is not a multi-tenant deployment. |
| Role bypass | Buttons and store actions check the same matrix. | The role is chosen in the browser. It is a demonstration, not authentication. |
| Upload malware | User paste is labelled unscanned. | No scanner is connected. |
| Prompt injection via Grok | System prompt forbids following instructions inside facts. Tool surface is two server functions with size caps, a 12-call hourly budget, one retry, and a short circuit. | Not a formal red-team report. |

## Before a hosted launch

Server-side authorisation on every read and write, tenant keys in the database, signed file URLs, malware scanning, secret rotation, webhook verification, SSRF limits on any future fetcher, backup restore, and a counsel review of financial promotions and introductions. A disclaimer is not that review.
