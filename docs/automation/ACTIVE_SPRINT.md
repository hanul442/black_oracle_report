# ACTIVE SPRINT — BOR Alpha Source Ingestion

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
- CLEANUP-01 migration ownership audit — merged #6 as `bfb8d8fc6756d930aeb98250a82fd444a79ea62f`.

## Active — BOR-S5 Source/NARS ingestion boundary

### Objective
Create a deterministic, fail-closed ingestion boundary that converts externally collected source records into canonical BOR Evidence without giving collectors storage, report-publication or trading authority.

### Acceptance criteria
- Define a versioned `bor.source-record.v1` input contract with source identity/version, publisher, retrieval provenance, `publishedAt`, `observedAt`, canonical content and asset-resolution result.
- Validate point-in-time ordering and reject future observations, missing identity/provenance/content, and malformed asset-resolution records before persistence.
- Derive deterministic Evidence IDs from immutable source/version/content identity rather than collector-generated randomness.
- Reuse `createEvidencePacket` for SHA-256 content fingerprints and canonical timestamp normalization.
- Detect existing fingerprints through `EvidenceStore`; preserve duplicates explicitly via `duplicateOfEvidenceId` rather than silently dropping them.
- Keep unresolved assets explicit and append them as Evidence; never guess a canonical asset.
- Add deterministic tests for fresh append, idempotent replay, duplicate lineage, unresolved asset preservation and fail-closed invalid time/content.
- No network client, provider credential or production database provisioning in this work package.

### Product / safety boundary
- BOR has **NO trading authority** and remains independent from BOT runtime/database.
- Collector input cannot submit orders, mutate BOT portfolio state, bypass Risk, publish a report, or change historical Evidence.
- Missing/contradictory/unresolved evidence remains explicit.
- Existing Evidence is append-only; duplicate detection creates lineage, not deletion.

### Rollback path
Revert the BOR-S5 PR. S0–S4 Evidence contracts and persistence remain unchanged because S5 is additive. Historical Evidence is never deleted as rollback.

### Exact next gate
`source-record contract + ingestion service + deterministic tests → BOR CI green → merge BOR-S5 → independent database provisioning gate / Collector adapter integration.`

## Research review for BOR-S5
- **DI-001** — transformation identity and deterministic lineage must be explicit and replayable.
- **DI-003** — `publishedAt` and `observedAt` remain separate; future/retroactive knowledge fails closed.
- **DI-004** — retrieval provenance and snapshot references survive ingestion for replay/citation audit.
- **AIML-005 / AIML-006** — agent expansion remains downstream; ingestion is deterministic infrastructure, not an LLM behavior.
- Legacy BOT **#39/#41/#43** — historical NARS acquisition/canonicalization precedents only; no legacy runtime/database coupling is imported.

Research disposition: **TEST / schema candidate.** No research item grants production or trading authority.

## Next ordered Alpha work
1. BOR-S5 Source/NARS ingestion boundary — ACTIVE.
2. Independent Evidence database provisioning gate.
3. Collector/Organizer/Research Analyst pipeline.
4. Specialist/Red Team/Research Council evaluation.
5. Versioned thesis/scenario/report archive.
6. Citation/consistency checks and PDF/export.
