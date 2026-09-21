# ACTIVE SPRINT — BOR Alpha Bootstrap

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Completed
- **BOR-S0** — repository/product boundary bootstrap.
- **BOR-S1** — independent TypeScript runtime, authority boundary and CI baseline.

## Active — BOR-S2 Canonical Evidence Contract

### Objective
Create BOR's immutable, versioned Evidence contract before persistence, NARS ingestion or agent orchestration.

### Acceptance criteria
- Versioned Source identity (`source_id`, `source_version`).
- Canonical asset mapping with explicit `RESOLVED` / `UNRESOLVED` state.
- Provenance carrying retrieval URI and optional immutable snapshot reference.
- Distinct `published_at` and `observed_at` point-in-time semantics.
- SHA-256 content fingerprint derived from canonical content identity.
- Duplicate detection preserves lineage via `duplicate_of_evidence_id`; it never silently discards an observation.
- Staleness is an evaluation result, not a mutation of historical Evidence.
- Versioned Evidence packet has `execution_authority: false` and `producer: BLACK_ORACLE_REPORT`.
- Fail-closed tests cover invalid timestamps, publication after observation, future observation, unresolved assets and duplicate identity.

### Research review applied before implementation
- **DI-001** — schema and producer/version identity must be explicit and replayable.
- **DI-003** — `published_at` and `observed_at` are separate; information cannot be treated as knowable before publication.
- **DI-004** — provenance supports snapshot-addressable replay without requiring mutable source pages.
- Existing BOR bootstrap review keeps agent expansion deferred until this contract is independently testable.

### Product / safety boundary
- Evidence carries no order, portfolio, broker or Risk authority.
- BOR does not import BOT runtime code or credentials.
- Missing asset resolution remains explicit instead of guessed.
- Duplicate/stale evidence remains auditable; historical rows are never rewritten.

### Rollback
S2 is additive contract/test/documentation work on an isolated branch. Rollback is closing/reverting this PR; there is no database or deployment mutation.

### Exact next gate
Typecheck/build/tests must pass on the PR head before merge. After merge, **BOR-S3 Evidence Store persistence boundary** becomes next.

## Cycle exit record
- Phase: **PLAN + RESEARCH REVIEW COMPLETE → IMPLEMENT**
- Research reviewed: DI-001, DI-003, DI-004
- Deployment: none by design
- Blockers: independent deploy target/database unprovisioned; not required for contract work
