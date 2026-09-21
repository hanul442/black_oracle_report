# ACTIVE SPRINT — BOR Alpha Evidence Foundation

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Completed
- **BOR-S0** — repository/product boundary bootstrap.
- **BOR-S1** — independent TypeScript runtime, authority boundary and CI baseline.
- **BOR-S2** — canonical `bor.evidence.v1` point-in-time Evidence contract.
- **BOR-S3** — append-only Evidence Store port and deterministic in-memory reference implementation; PR #4 green and merged as `78b3edd160abb4d73b6056fe11958483317544f8`.

## Active — BOR-S4 Persistent Evidence Adapter Contract

### Objective
Define the first concrete persistence schema/adapter boundary for BOR Evidence without provisioning or mutating a production database. Preserve S2/S3 immutable, point-in-time and no-trading-authority invariants at the storage boundary.

### Acceptance criteria
- Versioned SQL schema for `bor.evidence.v1` with explicit source/provenance/timestamp/fingerprint/duplicate-lineage fields.
- Database constraints reject trading authority, invalid producer/schema identity, self-duplicate and publication-after-observation.
- No application update/delete API; adapter exposes the existing `EvidenceStore` append/read contract only.
- Persistence driver is injected behind a minimal query boundary so CI needs no live DB credentials.
- Exact re-append is idempotent; conflicting reuse of an Evidence ID fails closed.
- Fingerprint lookup preserves every observation in deterministic order.
- Schema/adapter tests run without network or secrets.
- Migration is additive; rollback guidance never destroys historical Evidence.

### Research review / constraints
- **DI-001** — schema/version/producer identity and replay metadata remain explicit.
- **DI-003** — `published_at` and `observed_at` remain distinct; publication-after-observation fails closed.
- **DI-004** — provenance and optional snapshot reference remain persisted for replay/citation audit.
- Existing BOR research decision continues to defer agent expansion until Evidence persistence is independently testable.
- Research lineage remains **Research → Hypothesis → Experiment → Result → Adopt/Reject**; this persistence work does not constitute an agent/model adoption result.

### Product / safety boundary
- BOR has **NO trading authority**; persisted rows encode `execution_authority = false`.
- No BOT runtime/database import or access.
- No broker credentials, orders, portfolio mutation or Risk authority.
- No production DB provisioning in S4; schema + adapter + deterministic tests only.
- Missing, contradictory and unresolved Evidence remains explicit and auditable.

### Rollback
S4 is additive code/schema/documentation on an isolated branch. Rollback is closing/reverting the PR. No production database is provisioned or mutated. If this schema is later applied, rollback must disable new writes while preserving historical Evidence rather than dropping Evidence tables.

### Exact next gate
Typecheck/build/tests must pass on the PR head before merge. After merge, **BOR-S5 Source/NARS ingestion boundary** becomes next; actual database provisioning remains a separately reviewed infrastructure gate.

## Cycle exit record
- Phase: **PLAN + RESEARCH REVIEW COMPLETE → IMPLEMENT**
- Research reviewed: DI-001, DI-003, DI-004
- Deployment: none by design
- Blockers: independent deploy target/database unprovisioned; intentionally not required for deterministic S4 adapter work
- Alpha status: S0/S1/S2/S3 complete; S4 active
