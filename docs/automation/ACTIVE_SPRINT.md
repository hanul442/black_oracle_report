# ACTIVE SPRINT — BOR Alpha Evidence Foundation

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Completed
- **BOR-S0** — repository/product boundary bootstrap.
- **BOR-S1** — independent TypeScript runtime, authority boundary and CI baseline.
- **BOR-S2** — canonical `bor.evidence.v1` point-in-time Evidence contract.
- **BOR-S3** — append-only Evidence Store port/reference implementation; PR #4 CI green and merged as `78b3edd160abb4d73b6056fe11958483317544f8`.

## Active — BOR-S4 Persistent Evidence Adapter Contract

### Objective / acceptance
Define a concrete persistence boundary without provisioning production storage. The branch now contains an additive SQL schema, injected SQL driver adapter, idempotent append/conflict semantics, deterministic fingerprint reads, and network-free tests.

### Research review
- **DI-001** — explicit schema/producer/version identity retained.
- **DI-003** — `published_at` / `observed_at` stored separately and point-in-time ordering constrained.
- **DI-004** — retrieval provenance and optional snapshot reference persisted for replay/citation audit.
- Experiment note: `docs/research/2026-09-21-s4-persistence-review.md`.
- Current decision: **TEST / candidate for ADOPT after CI green**.

### Implemented
- `db/migrations/0001_evidence_store.sql`: BOR-only Evidence table and indexes with DB constraints for schema, producer, `execution_authority=false`, point-in-time ordering, asset shape and non-self-duplicate lineage.
- `src/sqlEvidenceStore.ts`: `EvidenceStore` adapter over an injected parameterized SQL query driver; no DB SDK or credentials embedded.
- `src/sqlEvidenceStore.test.ts`: deterministic append, conflict, fingerprint-order and migration-invariant tests.
- No update/delete API, no production database provisioning and no BOT dependency.

### Product / safety boundary
- BOR has **NO trading authority**.
- No broker credentials, order path, BOT database access, portfolio mutation or Risk authority.
- Missing/contradictory/unresolved Evidence remains explicit.
- Rollback remains non-destructive: revert code / stop writers; never delete historical Evidence as rollback.

### Verification / exact next gate
- Local/live database verification: intentionally not applicable; no database is provisioned.
- GitHub CI on PR head must pass typecheck/build/tests before merge.
- After merge: **BOR-S5 Source/NARS ingestion boundary**. Production DB provisioning remains a separately reviewed infrastructure gate.

## Cycle exit record
- Phase: **IMPLEMENT + DOCUMENT COMPLETE → PR/CI VERIFY**
- Research reviewed: DI-001, DI-003, DI-004
- Deployment: none by design
- Blockers: independent deploy target/database unprovisioned; does not block S4 contract work
- Alpha status: S0/S1/S2/S3 complete; S4 implementation complete pending CI
