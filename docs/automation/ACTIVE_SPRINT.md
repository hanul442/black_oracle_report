# ACTIVE SPRINT — BOR Alpha Research Pipeline Foundation

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Completed
- BOR-S0–S9 complete and merged.
- BOR-S9 introduced grounded Specialist / Red Team / Research Council evaluation artifacts with execution and publication authority fixed false.
- Independent Railway/database activation remains blocked by Railway free-plan resource capacity; repository Alpha development is unblocked.

## Active — BOR-S10 Versioned thesis + Bull/Base/Bear scenario contract

### Objective
Create a deterministic, versioned thesis/scenario artifact downstream of a valid Research Council decision, preserving citation lineage, contradictory evidence, catalysts, risks, invalidation conditions, and explicit data gaps.

### Acceptance criteria
- schema `bor.thesis-scenario.v1`
- exactly one BULL, BASE and BEAR scenario
- parent Council/review/bundle lineage and chronology validated
- every cited Evidence ID must belong to the upstream ResearchBundle and be material-verified
- `contradictingEvidenceIds` must reference upstream `CONTRADICTING` Evidence
- catalysts, risks, invalidation conditions and data gaps remain explicit
- Council `INSUFFICIENT_DATA` cannot be converted into an actionable directional thesis
- artifact is immutable/versioned and fixes `executionAuthority=false` and `reportPublicationAuthority=false`
- deterministic tests cover forged citations, missing scenario, duplicate scenario, chronology and authority escalation

### Product / safety boundary
Research/report artifact only. No broker credentials, orders, BOT portfolio mutation, Risk bypass, provider calls, final publication authority, database migration or deployment mutation.

### Rollback
Repository-only revert of S10 branch/PR. Canonical Evidence, S8 analyst artifacts and S9 Council artifacts remain unchanged.

### Research review / constraints
Review S9 Council contract and grounded pipeline precedents before implementation. Preserve Research → Hypothesis → Experiment → Result → Adopt/Reject lineage. S10 may structure scenarios but must not manufacture evidence or suppress contradiction/uncertainty.

### Exact next gate
Research review recorded → implement S10 contract + tests → typecheck/build/full tests → verify citation/authority invariants → document → PR/CI → merge only if green.

## Current blocker
Independent BOR Railway/database activation remains blocked by Railway free-plan resource capacity. Repository Alpha development is unblocked.

## Cycle exit record
- Phase: **PLAN COMPLETE → RESEARCH REVIEW**
- Single next priority: BOR-S10 thesis/scenario contract
