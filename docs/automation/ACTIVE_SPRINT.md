# ACTIVE SPRINT — BOR Alpha Collector Integration

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Completed
- BOR-S0 repository/product boundary bootstrap.
- BOR-S1 independent TypeScript runtime + CI.
- BOR-S2 canonical `bor.evidence.v1`.
- BOR-S3 append-only Evidence Store.
- BOR-S4 persistent SQL adapter contract.
- CLEANUP-01 migration ownership audit.
- BOR-S5 Source/NARS ingestion — merged as `2643fcb9a3f6f5106458b69f83472e83c2c0f3c6`.

## Active — BOR-S6 Collector/NARS adapter + ingestion cycle

### Objective
Create a bounded collector cycle that accepts versioned external/NARS source envelopes, adapts them into canonical `bor.source-record.v1`, ingests through `SourceEvidenceIngestor`, and exposes explicit per-item/batch outcomes without database, report-publication or trading authority.

### Acceptance criteria — IMPLEMENTED
- `bor.collector-envelope.v1` adapter boundary.
- source/provenance/published/observed/content/asset state preserved.
- accepted records route only through `SourceEvidenceIngestor`.
- per-item `APPENDED / ALREADY_PRESENT / REJECTED` with deterministic identity/error.
- batch `COMPLETE / PARTIAL / FAILED / EMPTY` plus attempted/appended/already-present/rejected counts.
- mixed failures stay visible and do not erase successful records.
- `executionAuthority=false`, `reportPublicationAuthority=false`.
- deterministic tests cover mixed failure, replay, duplicate lineage, identity mismatch and empty cycles.
- no network fetcher, credentials, scheduler or production DB provisioning.

### Research review
Reviewed **DI-001, DI-003, DI-004, AIML-005, AIML-006** and legacy NARS **#39/#41/#43**.
Research record: `docs/research/2026-09-21-s6-collector-cycle-review.md`.
Disposition: **ADOPT for Alpha contract use after implementation CI #14 PASS**; no runtime/trading authority adopted.

### Product / safety boundary
- BOR has **NO trading authority**.
- No broker credentials, orders, BOT portfolio/database access or Risk authority.
- Collectors cannot mutate historical Evidence or bypass `EvidenceStore`.
- Missing/unresolved/contradictory evidence remains explicit.
- Legacy Railway Black Oracle project is unchanged; no independent BOR production deployment exists yet.

### Rollback
Repository-only revert / stop invoking the S6 cycle. S0-S5 and historical Evidence remain intact.

### Verification
- PR: **#8**
- Implementation head CI: **BLACK ORACLE REPORT CI #14 — PASS**
- Typecheck/build/full repository tests: **PASS**
- Architecture contract: `docs/architecture/COLLECTOR_INGESTION_CONTRACT_V1.md`
- Deployment: none by design
- Runtime/database mutation: none

### Exact next gate
Final PR head CI green → merge BOR-S6 → **independent BOR runtime/database provisioning gate**.

## Current deployment state
- Railway contains only the legacy combined **Black Oracle** project and historical services.
- No independent BOR Railway project/service/database is provisioned.
- This did not block S6 contract/test work.

## Cycle exit record
- Phase: **IMPLEMENT / TEST / VERIFY / DOCUMENT COMPLETE → FINAL CI/MERGE GATE**
- Concrete change: bounded Collector/NARS adapter + ingestion-cycle contract
- Research: DI-001/003/004; AIML-005/006; legacy #39/#41/#43
- Tests: CI #14 PASS
- PR: #8
- Deployment: none
- Blockers: no code blocker; independent production infrastructure remains unprovisioned by design
- Single next priority: **BOR independent runtime/database provisioning gate**
