# ACTIVE SPRINT — BOR Alpha Research Pipeline Foundation

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Completed
- BOR-S0–S6 + separation cleanup complete.
- BOR-S7 deployable runtime contract merged #9 as `54056741c7c1bfe6f2636d7706c2f31a807ab35a`.
- BOR-S7 infrastructure activation remains blocked by Railway free-plan resource capacity; legacy runtime/database was not reused.
- BOR-S8 grounded Organizer / Research Analyst contract merged #10 as `3bcccd01d8f203fbf023c0599ea699aafead4d6e`.

## Current blocker
**Independent BOR Railway/database activation remains blocked by Railway free-plan resource capacity.** Legacy Black Oracle infrastructure remains intentionally isolated.

## Active work package — BOR-S9 Specialist / Red Team / Research Council evaluation boundary

### Objective
Add deterministic, versioned Specialist, Red Team, and Research Council evaluation artifacts downstream of `bor.analyst-review.v1`. Preserve disagreement, counterevidence, data gaps and evaluation lineage without granting report-publication or trading authority.

### Acceptance criteria
- Specialist reviews are explicitly typed and trace back to an existing AnalystReview/bundle.
- Red Team challenges reference the reviewed artifact and preserve strongest counterarguments, contradicting Evidence and unresolved gaps.
- Council synthesis consumes bounded member reviews/challenges, records disagreement instead of erasing it, and can return `INSUFFICIENT_DATA`.
- Referenced Evidence IDs must exist in the ResearchBundle and have verified canonical material; invented/mismatched citations fail closed.
- Member/review IDs are unique and timestamps cannot precede their upstream artifacts.
- Evaluation artifacts carry method/prompt/schema identity suitable for AIML-005 grounded-task evaluation.
- `executionAuthority=false` and `reportPublicationAuthority=false` are invariant and authority escalation fails closed.
- Deterministic tests cover valid synthesis, disagreement, citation integrity, data gaps, chronology and authority rejection.

### Product / safety boundary
BOR remains research/report-only. S9 adds no provider/LLM call, broker credential, order submission, portfolio mutation, BOT database dependency, Risk bypass, report publication, production database mutation, or requirement for BOT operation. Missing or contradictory evidence remains explicit.

### Research constraints
- DI-001/003/004: schema identity, point-in-time lineage, stable Evidence fingerprints/provenance.
- AIML-005: grounded financial-agent evaluation must make unsupported citations observable.
- AIML-006: Council topology is downstream of grounded Organizer/Analyst correctness and must not weaken those contracts.
- BOR-S8-E1: verified material, citation membership/disposition and authority checks are adopted upstream constraints.
- Legacy BOT #200 is migration precedent only; no combined runtime/authority is imported.

### Rollback path
Repository-only revert of S9 commits/contracts/tests/docs. No database migration or deployment mutation is required; canonical Evidence and S8 artifacts remain unchanged.

### Exact next gate
Implement S9 contracts + deterministic tests → run typecheck/build/full tests → verify artifact/citation/authority invariants → record Research→Hypothesis→Experiment→Result→Adopt/Reject → PR/CI → merge if green. Railway activation remains separately blocked.

## Cycle state
- Phase: **BOR-S9 PLAN / RESEARCH REVIEW**
- Open PRs at cycle start: none
- Deployment blocker: Railway free-plan resource capacity
- Single priority: **BOR-S9 Specialist / Red Team / Research Council evaluation boundary**
