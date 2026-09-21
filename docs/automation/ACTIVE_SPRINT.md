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
- **BOR-S6 Collector/NARS adapter + bounded ingestion cycle — merged #8 as `6fb72904d9584738460c828edd70fbe729e934cd`.**

## BOR-S6 final record

### Delivered
- `bor.collector-envelope.v1`
- deterministic adapter into `bor.source-record.v1`
- `bor.collector-cycle.v1` with deterministic item/cycle identities
- per-item `APPENDED / ALREADY_PRESENT / REJECTED`
- cycle `COMPLETE / PARTIAL / FAILED / EMPTY`
- explicit attempted/appended/already-present/rejected counts
- successful records preserved alongside explicit rejected outcomes
- all accepted records route only through `SourceEvidenceIngestor`
- `executionAuthority=false`
- `reportPublicationAuthority=false`

### Research / precedent
Reviewed **DI-001, DI-003, DI-004, AIML-005, AIML-006** and legacy NARS **#39/#41/#43**.
Research record: `docs/research/2026-09-21-s6-collector-cycle-review.md`.
Disposition: **ADOPT for Alpha contract use**.

### Verification
- PR: **#8**
- implementation CI #14: **PASS**
- final PR head CI #16: **PASS**
- typecheck: PASS
- build: PASS
- full repository tests: PASS
- architecture: `docs/architecture/COLLECTOR_INGESTION_CONTRACT_V1.md`
- deployment: none by design
- runtime/database mutation: none

### Safety / rollback
BOR still has **NO trading authority**. No broker credentials, orders, BOT portfolio/database access, Risk authority, network scheduler or production DB provisioning were introduced. Rollback is repository revert / stop invoking S6; historical Evidence remains append-only.

## Current deployment state
- Railway contains only the legacy combined **Black Oracle** project and historical services.
- No independent BOR Railway project/service/database is provisioned.
- This is now the next infrastructure gate rather than a code blocker.

## Next work package — BOR-S7 independent runtime/database provisioning gate

### Objective
Provision BOR as an independently deployable runtime/database target without reusing BOT execution state or credentials, then bind the already-tested SQL Evidence adapter under explicit rollback and no-trading-authority controls.

### Preconditions / boundaries
- preserve current BOR contracts and append-only Evidence semantics;
- no BOT database dependency;
- no broker/private trading credentials;
- no destructive migration of legacy Evidence;
- provider secrets remain server-only;
- rollback must stop writers/deployments without deleting historical Evidence.

### Exact next gate
`inspect available Railway/database provisioning capabilities → record infra plan/rollback → provision isolated BOR target if no credential/cost/destructive blocker → smoke health + Evidence persistence boundary → document/deploy report`.

## Cycle exit record
- Phase: **BOR-S6 COMPLETE / MERGED**
- Merge: `6fb72904d9584738460c828edd70fbe729e934cd`
- Tests: CI #14 PASS; final CI #16 PASS
- Deployment: none
- Blockers: none for S6
- Single next priority: **BOR-S7 independent runtime/database provisioning gate**
