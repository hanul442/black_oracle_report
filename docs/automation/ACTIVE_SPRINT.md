# ACTIVE SPRINT — BOR Alpha Consumer Surface

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S17 COMPLETE / S18 IMPLEMENTED — CI GATE**

## Completed
- BOR-S0–S17 are merged to `main`.
- BOR-S17 PR #22 passed final docs-inclusive BLACK ORACLE REPORT CI #77 and squash-merged as `95a3f5c667e968e8935d4a9865835869875d802f`.
- S15 provides canonical integrity-gated `bor.alpha-read-model.v1`.
- S16 provides GET-only `bor.alpha-read-api.v1`.
- S17 exposes the canonical model at `GET /api/alpha/report` through a dependency-injected read-only resolver.
- BOR-S17-E1 remains **ADOPT**. No trading, publication, BOT, database-write, or broker authority was introduced.

## Active — BOR-S18 Alpha report consumer surface

### Objective
Create the smallest real user-facing Alpha report surface over the verified S15–S17 chain, so a human can inspect the canonical report without introducing a second research projection, client-side reconstruction, write path, or new framework dependency.

### Acceptance criteria
- expose one read-only HTML surface at `GET /alpha/report`
- obtain report state through the same canonical Alpha resolver and S16 integrity gate used by `GET /api/alpha/report`
- render title, summary, thesis, Bull/Base/Bear scenarios, Evidence citation IDs, unresolved disagreements, and explicit data gaps
- preserve canonical report identity/version/asOf and display the authority boundary: execution=false, publication=false, BOT dependency=false
- unavailable/tampered models remain explicit fail-closed states; the surface must not repair or synthesize missing Evidence
- non-GET requests remain rejected without invoking the model resolver
- mobile-first markup is usable without JavaScript and without horizontal-scroll dependence
- HTML escaping prevents report/evidence text from becoming executable markup
- deterministic tests cover valid view, unavailable model, tampered model, escaping, non-GET behavior, and isolation of existing API/health/version routes
- no broker credentials, orders, BOT portfolio mutation, Risk bypass, public publication, database mutation, provider calls, or BOT runtime dependency

### Implementation record
- added pure `renderAlphaReportPage` renderer over `AlphaReadApiResponse`
- added framework-free dark/mobile-first report markup with no client JavaScript
- added `GET /alpha/report` to the existing BOR HTTP runtime
- route delegates to the same S16 `getAlphaReadApiResponse` gate as `GET /api/alpha/report`
- dynamic report/scenario/Evidence text is HTML-escaped
- unavailable, tampered, and unsupported-method states remain explicit fail-closed HTML responses
- added renderer and runtime-route regression tests
- recorded BOR-S18-H1 / BOR-S18-E1 in `docs/research/2026-09-22-s18-alpha-consumer-surface-review.md`

### Product / safety boundary
S18 is a read-only presentation layer. The canonical S15 model and S16 integrity decision remain authoritative. S18 may format verified fields for display but may not create Evidence, change scenarios, hide disagreements/data gaps, write persistent state, publish externally, or acquire execution authority.

### Rollback
Repository-only revert/close of the S18 branch/PR. S0–S17 API/runtime/database/deployment contracts remain unchanged.

### Research / precedent constraints
DI-001/003/004, AIML-005/006, D-005 progressive disclosure, and BOR-S14-E1 through BOR-S17-E1 constrain S18. BOR-S18-E1 remains **PENDING** until CI and final verification.

### Exact next gate
Open S18 PR → require exact-head BLACK ORACLE REPORT CI green → verify valid/unavailable/tampered/non-GET/escaping cases and unchanged API/health/version behavior → record BOR-S18-E1 ADOPT only if supported → docs-inclusive final CI → merge only if green and mergeable.

## Current blockers
- **External only:** Railway free-plan resource provision limit still blocks independent BOR runtime/database provisioning.
- Existing BOT/paper/web Railway services remain forbidden for BOR reuse.
- Repository-only S18 verification is unblocked.

## Cycle exit record
- Phase: **IMPLEMENT → TEST / CI GATE**
- Branch: `bor-s18-alpha-report-surface`
- Blocker: exact-head CI pending
- Single next priority: open PR and verify the full repository CI on the S18 head.
