# ACTIVE SPRINT — BOR Alpha Consumer Surface

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S18 COMPLETE / MERGED**

## Completed
- BOR-S0–S17 are merged.
- BOR-S18 Alpha report consumer surface merged as PR #23 / `2809c65e3a02d01a384416eae53f3848260bcf6f`.
- `GET /alpha/report` renders the canonical S15/S16 report model through the same integrity gate used by `GET /api/alpha/report`.
- report identity/version/asOf, summary, thesis, scenarios, Evidence, contradicting Evidence, catalysts, risks, invalidation conditions, unresolved disagreements, and data gaps are visible.
- dynamic report content is HTML-escaped.
- unavailable/tampered/non-GET states remain explicit fail-closed 404/409/405 responses.
- execution authority=false, publication authority=false, BOT dependency=false remain explicit.
- BOR-S18-E1 = **ADOPT**.

## S18 verification
- implementation/docs CI head `5bff818e322af8cbaca92e8d8a3aeedaa17291ba`: BLACK ORACLE REPORT CI **SUCCESS**
- final docs head `a7436e8de17fc861c5ba381e9323522ffa2b6fe0`: BLACK ORACLE REPORT CI **SUCCESS**
- PR mergeable before merge: **true**
- squash merge: `2809c65e3a02d01a384416eae53f3848260bcf6f`
- deployment/database mutation: none

## Important runtime truth
The production entrypoint `src/start.ts` currently calls `createBorHttpServer(process.env)` **without an AlphaReadModelResolver**. Therefore the new API/HTML surfaces are structurally complete but a real started runtime will return `ALPHA_READ_MODEL_UNAVAILABLE` until a verified read-only resolver is connected. Do not hide this with mock or fabricated report state.

## Next priority — S19 candidate
Connect the runtime to a real, read-only canonical Alpha report/model source:
- define one read-only report/model repository/resolver boundary
- load only integrity-verifiable canonical artifacts
- preserve 404 when no verified model exists
- no fixture/demo fallback in production
- no BOT database access or BOT runtime dependency
- no write/publication/trading authority
- add restart/runtime tests proving the started server can resolve a verified model when present and fails closed when absent/tampered

If independent persistence provisioning is required, keep the existing Railway free-plan capacity blocker explicit rather than borrowing BOT infrastructure.

## Current blockers
- **External:** Railway free-plan resource provision limit blocks independent BOR runtime/database provisioning.
- Existing BOT/paper/web Railway services remain forbidden for BOR reuse.

## Cycle exit record
- Phase: **BOR-S18 COMPLETE / MERGED**
- Blocker: independent runtime/database capacity for live deployment
- Alpha status: S0-S18 repository work complete
- Single next priority: **S19 real read-only Alpha model resolver/persistence integration**
