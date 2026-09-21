# ACTIVE SPRINT — BOR Alpha Evidence Foundation

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Completed
- **BOR-S0** repository/product boundary.
- **BOR-S1** independent TypeScript runtime + CI.
- **BOR-S2** canonical `bor.evidence.v1` point-in-time Evidence contract; PR #3 green and merged as `bcc877ca2da5c47ac6f5f145cbfd94074b327a21`.

## Current — BOR-S3 Append-only Evidence Store boundary

### Objective
Introduce the persistence port and deterministic in-memory reference implementation that make Evidence append-only, replayable and independent from any concrete database. Do not provision or mutate production storage in this slice.

### Acceptance criteria
- `EvidenceStore` port exposes append, get-by-id and fingerprint lookup/read operations only; no update/delete mutation authority.
- Re-appending the exact same immutable packet is idempotent.
- Reusing an `evidenceId` for different content/metadata fails closed.
- Fingerprint lookup preserves all evidence IDs so duplicate lineage is inspectable rather than silently collapsed.
- Returned records cannot mutate store state.
- Store accepts only BOR `bor.evidence.v1` packets with `executionAuthority=false`.
- Tests cover append/read, idempotency, conflicting identity, fingerprint lineage and mutation isolation.
- Typecheck/build/tests must pass before merge.

### Research review / constraints
- **DI-001**: persistence retains explicit producer/schema identity and supports reproducible downstream experiment/report inputs.
- **DI-003**: point-in-time `publishedAt`/`observedAt` from S2 remain immutable; storage must not replace them with write time.
- **DI-004**: append-only identity and deterministic lookup are prerequisites for snapshot-addressable replay and later report reconstruction.
- Research lineage remains **Research → Hypothesis → Experiment → Result → Adopt/Reject**; this store is infrastructure, not evidence that any agent topology is superior.

### Safety / product boundary
- BOR has no trading authority, broker credentials, order path or BOT portfolio mutation.
- No concrete database credentials or deployment changes in S3.
- No update/delete methods are introduced.
- Missing evidence stays missing; the store does not fabricate or enrich packets.

### Rollback
S3 is additive and isolated to the BOR repository. Revert the S3 merge commit if the persistence contract proves unsuitable; no external database state is created by this slice.

### Exact next gate
Implement port + reference store + tests → run BOR CI → merge only when green → then begin **BOR-S4 concrete independent database schema/adapter**.

## Cycle exit record
- Phase: **PLAN / RESEARCH REVIEW complete; implementation next**
- Research reviewed: DI-001, DI-003, DI-004
- Deployment: none
- Blockers: independent deploy target/database not yet provisioned; does not block S3
- Alpha status: S0/S1/S2 complete; S3 active
