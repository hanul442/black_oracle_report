# ACTIVE SPRINT — BOR Alpha Runtime Integration

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S19 ACTIVE — READ-ONLY ALPHA MODEL RESOLVER**

## Completed baseline
- BOR-S0–S18 complete.
- S18 merged as PR #23 / `2809c65e3a02d01a384416eae53f3848260bcf6f`.
- `GET /api/alpha/report` and `GET /alpha/report` both rely on the S16 integrity gate.
- S18 UI is read-only, HTML-escaped, and explicit about unavailable/integrity failure states.

## BOR-S19 — runtime Alpha model resolver

### Gap found
`src/start.ts` started the HTTP runtime without an `AlphaReadModelResolver`, so a real process could expose the route but only return `ALPHA_READ_MODEL_UNAVAILABLE`.

### Objective
Connect the runtime to one explicit read-only canonical model artifact without introducing a second research projection, demo fallback, database write path, BOT dependency, publication authority, or trading authority.

### Implementation
- add `BOR_ALPHA_READ_MODEL_PATH` as an optional read-only file source
- resolve the configured path once, read the artifact on request, and never write it
- missing/unconfigured artifact remains **404 ALPHA_READ_MODEL_UNAVAILABLE**
- parsed-but-tampered/malformed/read-failed configured artifact is passed as invalid state to the existing S16 integrity gate and remains **409 ALPHA_READ_MODEL_INTEGRITY_FAILURE**
- `src/start.ts` now injects the resolver into `createBorHttpServer`
- runtime startup log reports only source mode (`READ_ONLY_FILE` or `UNCONFIGURED`), never artifact content
- no fixture/demo fallback in production

### Acceptance criteria
- valid integrity-verifiable artifact returns 200 from the existing Alpha API/surface path
- absent path/file returns 404
- stale fingerprint or malformed configured artifact returns 409
- no file writes or external network/provider calls
- no BOT database/runtime access
- no execution/publication authority
- full BLACK ORACLE REPORT CI must pass before merge

## Blocker truth
Independent Railway runtime/database capacity remains externally blocked. S19 makes the runtime repository-ready for a mounted/read-only artifact but does not borrow BOT infrastructure.

## Rollback
Repository-only revert/close of S19 PR. S0–S18 remain unchanged.

## Cycle exit record
- Phase: **IMPLEMENT → CI GATE**
- Blocker: exact-head CI pending
- Alpha status: S0–S18 complete; real runtime source integration active
- Single next priority: **verify S19 exact-head CI and merge only if green**
