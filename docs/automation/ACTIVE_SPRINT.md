# ACTIVE SPRINT — BOR Alpha Consumer Read Model

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS — LIVE DEPLOYMENT CAPACITY BLOCKED**

## Completed
- BOR-S0–S14 complete and merged.
- S11–S14 established versioned report/archive, deterministic export, independent deployability contract, and fail-closed report/export consistency verification.

## Active — BOR-S15 Alpha consumer read-model contract

### Objective
Create a deterministic, read-only Alpha consumer projection over canonical report/export/consistency artifacts so future Today/Research/Evidence/Oracle/Reports/Library UI surfaces consume one integrity-gated contract instead of reconstructing or silently repairing research state.

### Acceptance criteria
- schema `bor.alpha-read-model.v1`
- input requires a report/export pair whose S14 consistency result is PASS
- preserve report ID, series ID, version, asOf and canonical report/export fingerprints
- preserve exact canonical citation IDs, Bull/Base/Bear scenarios and contradicting-evidence IDs
- preserve unresolved disagreements and data gaps explicitly
- expose report summary/thesis without manufacturing evidence or directional certainty
- fixed `executionAuthority=false`, `reportPublicationAuthority=false`, `botDependency=false`
- deterministic content fingerprint over the canonical read-model payload
- fail closed on stale/tampered/inconsistent parent artifacts or authority escalation
- deterministic tests cover valid projection, consistency failure, parent mismatch/tamper and authority escalation

### Product / safety boundary
Read-only BOR research/report consumer contract only. No broker/exchange credentials, orders, BOT portfolio mutation, Risk bypass, provider calls, public publishing, database mutation, deployment mutation, or BOT dependency. The projection may expose canonical uncertainty; it may never suppress, repair, infer, or manufacture Evidence.

### Rollback
Repository-only revert of S15 branch/PR. S11–S14 canonical artifacts and gates remain unchanged.

### Research review / constraints
Review DI-001/003/004, AIML-005/006, BOR-S8-E1 through BOR-S14-E1 and the report/export/consistency contracts before implementation. Preserve Research → Hypothesis → Experiment → Result → Adopt/Reject lineage. UI/read models are consumers of verified artifacts, never a new synthesis or authority layer.

### Exact next gate
Research review recorded → implement S15 projection + deterministic tests → typecheck/build/full tests → verify parent fingerprint/citation/scenario/uncertainty/no-authority invariants → document → PR/CI → merge only if green.

## Current blockers
- **CONFIRMED external:** Railway free-plan resource provision limit blocks independent BOR runtime/database provisioning.
- Existing Railway `Black Oracle` services remain legacy BOT/paper/web infrastructure and forbidden for BOR reuse.
- PR #16 remains documentation-only Global Intelligence research outside frozen Alpha implementation.
- Repository-only Alpha work is unblocked.

## Cycle exit record
- Phase: **PLAN COMPLETE → RESEARCH REVIEW**
- Single next priority: BOR-S15 Alpha consumer read-model contract.
