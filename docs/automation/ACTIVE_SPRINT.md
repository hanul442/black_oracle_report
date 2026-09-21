# ACTIVE SPRINT — BOR Alpha Research Pipeline Foundation

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Completed
- BOR-S0–S11 complete and merged.
- BOR-S11 introduced `bor.report-artifact.v1`, canonical citation union, deterministic fingerprinting and append-only report archive controls with execution/publication authority fixed false.
- Independent BOR Railway/database provisioning remains unresolved; existing BOT/paper/web services must not be reused as BOR runtime.

## Active — BOR-S12 Deterministic export/PDF integrity boundary

### Objective
Create a deterministic export artifact downstream of a valid S11 ReportArtifact so HTML/PDF renderers can consume one verified, versioned payload without changing research meaning or authority.

### Acceptance criteria
- schema `bor.report-export.v1`
- exact parent report identity, version, asOf and contentFingerprint preserved
- canonical citation IDs, thesis/scenarios, contradictory evidence references, disagreements and data gaps preserved in export payload
- deterministic export fingerprint over canonical payload
- fail closed on report fingerprint tampering, authority escalation or invalid format
- export authority remains false; rendering does not imply public publication
- deterministic tests cover stable export, tampered report, authority escalation and citation/uncertainty preservation

### Product / safety boundary
Research/report export contract only. No broker credentials, orders, BOT portfolio mutation, Risk bypass, provider calls, public publishing, database migration, external PDF service or deployment mutation.

### Rollback
Repository-only revert of S12 branch/PR. S11 ReportArtifact and archive remain canonical and unchanged.

### Research review / constraints
Review DI-001/003/004, AIML-005/006 and BOR-S8-E1 through BOR-S11-E1. Preserve Research → Hypothesis → Experiment → Result → Adopt/Reject lineage. Export/rendering is a representation layer only: it may not invent citations, suppress contradiction/data gaps, rewrite version identity, or create execution/publication authority.

### Exact next gate
Record S12 research review → implement deterministic export contract + tests → typecheck/build/full tests → verify parent fingerprint/citation/authority invariants → document → PR/CI → merge only if green.

## Current blockers
- Independent BOR Railway/database runtime is not yet provisioned. This does not block repository-only S12 work.
- Open PR #16 is documentation-only Global Intelligence research and is outside the frozen Alpha implementation path; do not let it alter S12 scope.

## Cycle exit record
- Phase: **PLAN COMPLETE → RESEARCH REVIEW**
- Single next priority: BOR-S12 deterministic export integrity boundary
