# ACTIVE SPRINT — BOR Alpha Runtime Integration

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S19 VERIFIED / ADOPT — FINAL CI + MERGE GATE**

## Completed baseline
- BOR-S0–S18 complete.
- S18 merged as PR #23 / `2809c65e3a02d01a384416eae53f3848260bcf6f`.
- `GET /api/alpha/report` and `GET /alpha/report` both rely on the S16 integrity gate.

## BOR-S19 — runtime Alpha model resolver

### Delivered
- optional read-only `BOR_ALPHA_READ_MODEL_PATH`
- resolver rereads the configured artifact on each request and never writes it
- `src/start.ts` injects the resolver into the real BOR HTTP runtime
- missing/unconfigured artifact remains **404 ALPHA_READ_MODEL_UNAVAILABLE**
- malformed/tampered/read-failed/authority-escalated configured artifact remains **409 ALPHA_READ_MODEL_INTEGRITY_FAILURE**
- valid integrity-verifiable artifact returns 200 through the existing S16 gate
- no fixture/demo fallback
- startup log reports only source mode, never report content

### Verification
- exact implementation/test head: `1a52fdf7c2df3b4f3dca6b917772d3a03f8e0c52`
- BLACK ORACLE REPORT CI #35683774043 — **SUCCESS**
- PR #25 mergeable after implementation CI — **true**
- BOR-S19-E1 — **ADOPT**
- competing PR #24 closed **SUPERSEDED** after review because it collapsed integrity failures into unavailable 404 responses

## Safety boundary
Read-only runtime source integration only. No database writes, provider calls, BOT database/runtime reuse, broker credentials, orders, Risk bypass, execution authority, or publication authority.

## Blocker truth
Independent Railway runtime/database capacity remains externally blocked. S19 is repository/runtime-ready for a mounted read-only canonical artifact but does not deploy or borrow BOT infrastructure.

## Rollback
Repository-only revert/close of PR #25. S0–S18 remain unchanged.

## Exact next gate
Require fresh docs-inclusive BLACK ORACLE REPORT CI on the final PR #25 head. If green and mergeable, squash merge. Do not deploy while independent Railway capacity remains blocked.

## Cycle exit record
- Phase: **VERIFY / DOCUMENT COMPLETE → FINAL CI / MERGE GATE**
- PR: #25 (`bor-s19-file-model-resolver` → `main`)
- Research result: **BOR-S19-E1 ADOPT**
- Single next priority: **final docs-inclusive CI; merge only if green**
