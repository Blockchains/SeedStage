# Known limitations

- Demonstration roles are not accounts. Anyone with the browser can switch them.
- Data lives in `localStorage` under `seedstage.workspace.v1`. Another device does not see it. Export JSON is the portability path.
- Investor firms are fictional mandate cards. Freshness, cheque and sector are authored for the demo. They are not a directory.
- Cheque ranges in a different currency are left uncompared. There is no FX rate.
- Management accounts in the demo are not a bank statement. The cash claim says so.
- The March 2026 MRR contradiction is intentional and stays open until a person reviews it.
- Grok can be absent. The workspace still parses structured blocks and writes deterministic drafts.
- Approvals lock a payload. They do not send it.
- Share counts are scenario inputs, not a statutory register.
- Option-pool maths covers two priced mechanics only.
- Deletion does not call a third-party processor. If Grok was used, that request is subject to the provider’s retention, which this app cannot erase from here.
