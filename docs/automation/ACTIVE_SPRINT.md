# ACTIVE SPRINT — BOR Alpha Collector Integration

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Completed
- BOR-S0 repository/product boundary bootstrap.
- BOR-S1 independent TypeScript runtime + CI.
- BOR-S2 canonical `bor.evidence.v1` point-in-time Evidence contract.
- BOR-S3 append-only Evidence Store.
- BOR-S4 persistent SQL adapter contract.
- CLEANUP-01 migration ownership audit.
- BOR-S5 deterministic Source/NARS ingestion boundary — CI #12 green and merged as `2643fcb9a3f6f5106458b69f83472e83c2c0f3c6`.

## Active — BOR-S6 Collector/NARS adapter + ingestion cycle

### Objective
Create a bounded collector cycle that accepts versioned external/NARS source envelopes, adapts them into canonical `bor.source-record.v1`, ingests them through `SourceEvidenceIngestor`, and returns explicit per-item outcomes without giving collectors database, report-publication or trading authority.

### Acceptance criteria
- Define one versioned collector envelope/adapter boundary; do not import legacy BOT runtime or database types.
- Preserve source identity/version, publisher, retrieval provenance, publication/observation timestamps, canonical content and explicit asset resolution.
- Route accepted records only through `SourceEvidenceIngestor`; collectors never write Evidence directly.
- Represent each item as APPENDED / ALREADY_PRESENT / REJECTED with deterministic source identity and explicit error reason; partial failures must not fabricate a healthy batch.
- Batch summary must expose attempted, appended, already-present and rejected counts.
- Invalid envelope/schema/content/time/asset records fail closed per item and remain auditable in the returned cycle result.
- A collector cycle must have `executionAuthority=false`, `reportPublicationAuthority=false`, and no BOT dependency.
- Add deterministic network-free tests for mixed success/failure, replay idempotency, duplicate lineage propagation and authority invariants.
- No production database provisioning, credentials, network fetcher or scheduler in this work package.

### Product / safety boundary
- BOR has **NO trading authority**.
- No broker credentials, order submission, BOT portfolio mutation, BOT database access or Risk authority.
- No collector may mutate historical Evidence or bypass `EvidenceStore`.
- Missing/unresolved/contradictory evidence remains explicit.
- Existing legacy Railway project remains unchanged; no BOR production deployment exists yet.

### Rollback path
Revert the BOR-S6 PR. BOR-S0–S5 remain intact. No infrastructure/database/runtime state is mutated and historical Evidence is never deleted.

### Exact next gate
`collector adapter + bounded ingestion cycle + explicit partial-failure tests → BOR CI green → merge BOR-S6 → independent BOR runtime/database provisioning gate or BOR-S7 Organizer/Research pipeline contract`.

## Research review required before implementation
- DI-001 — transformation and cycle identity/replay.
- DI-003 — published/observed point-in-time integrity.
- DI-004 — provenance/snapshot replay.
- Legacy BOT #39/#41/#43 — NARS acquisition, primary evidence and activity/error visibility precedents only.
- AIML-005/AIML-006 — no agent behavior in ingestion layer.

Research disposition will be recorded in a dedicated S6 review before implementation.

## Current deployment state
- Railway contains only the legacy combined **Black Oracle** project and its historical services.
- No independent BOR Railway project/service/database is provisioned.
- This does not block the S6 contract/test work.

## Next ordered Alpha work
1. BOR-S6 Collector/NARS adapter + ingestion cycle — ACTIVE.
2. Independent BOR Evidence database/runtime provisioning gate.
3. Organizer/Research Analyst pipeline.
4. Specialist/Red Team/Research Council evaluation.
5. Versioned thesis/Bull-Base-Bear/report archive.
6. Citation/consistency checks and PDF/export.
