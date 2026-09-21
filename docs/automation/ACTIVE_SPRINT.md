# ACTIVE SPRINT — BOR Separation Cleanup

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Completed
- BOR-S0 repository/product boundary bootstrap.
- BOR-S1 independent runtime + CI.
- BOR-S2 canonical `bor.evidence.v1`.
- BOR-S3 append-only Evidence Store.
- BOR-S4 persistent SQL adapter contract — CI green and merged as `f11f014b0bcc95b231c07bf17bf3f1900b65059c`.

## Active — CLEANUP-01 Migration ownership audit

### Objective
Create a canonical extraction queue for useful Report/NARS assets left in the legacy BOT history without restoring repository/runtime coupling.

### Acceptance criteria
- Record source PRs and BOR-owned extraction candidates.
- Prioritize NARS/source ingestion before agent/report orchestration.
- Bind all migrated Evidence concepts to BOR contracts.
- Explicitly defer Credits/billing from frozen Alpha.
- Preserve no-trading-authority and independent database/runtime boundaries.

### Research / precedent review
- DI-001 / DI-003 / DI-004 constrain identity, point-in-time semantics and replay.
- Legacy BOT #39/#41/#43 are historical NARS implementation references.
- Legacy BOT #200 is a historical Report/agent contract source.
- No legacy branch is production authority for BOR.

### Product / safety boundary
No broker credentials, orders, BOT portfolio mutation, BOT database dependency, Risk authority or execution authority.

### Rollback
Documentation-only. Remove/revise migration classifications without changing historical Evidence or runtime state.

### Exact next gate
Cleanup PR CI green → merge → **BOR-S5 Source/NARS ingestion boundary**.

## Next ordered Alpha work
1. BOR-S5 Source/NARS ingestion.
2. Independent Evidence database provisioning gate.
3. Collector/Organizer/Research Analyst pipeline.
4. Specialist/Red Team/Research Council evaluation.
5. Versioned thesis/scenario/report archive.
6. Citation/consistency checks and PDF/export.
