# ACTIVE SPRINT — BOR Alpha Research Pipeline Foundation

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Completed
- BOR-S0–S6 + separation cleanup complete.
- BOR-S7 deployable runtime contract merged #9 as `54056741c7c1bfe6f2636d7706c2f31a807ab35a`.
- BOR-S7 infrastructure activation remains blocked by Railway free-plan resource capacity; legacy runtime/database was not reused.

## Active — BOR-S8 Organizer / Research Analyst contract

### Objective
Define an authority-safe Evidence → Organizer → AnalystReview transformation before LLM orchestration, Specialist/Red Team/Council behavior or report publication.

### Implemented
- `bor.research-bundle.v1`
- `bor.analyst-review.v1`
- explicit SUPPORTING / CONTRADICTING / CONTEXT / UNRESOLVED disposition
- point-in-time knowledge cutoff
- analysis material must hash to the canonical Evidence fingerprint
- missing canonical material becomes explicit `MISSING_CANONICAL_CONTENT:<evidenceId>` data gap
- citations must belong to the bundle
- citations require verified material
- supporting/counterevidence disposition relabeling fails closed
- facts / inferences / assumptions / data gaps remain distinct
- `executionAuthority=false`
- `reportPublicationAuthority=false`

### Research review
DI-001/003/004, AIML-005/006, BOR-S2/S5/S6 and legacy BOT #200 as migration precedent only.
Research record: `docs/research/2026-09-21-s8-organizer-analyst-review.md`.

### Safety boundary
No LLM/provider calls, final report publication, BOT database/runtime dependency, broker/order/portfolio/Risk/trading authority, production DB mutation or deployment.

### Architecture
`docs/architecture/GROUNDED_RESEARCH_PIPELINE_V1.md`

### Verification
- PR: **#10**
- deterministic tests added for fingerprint mismatch, future knowledge, missing material, invented citation, contradiction preservation, disposition relabeling and authority escalation
- BOR CI: pending final head

### Rollback
Repository-only revert. S0-S7 and historical Evidence remain unchanged.

### Exact next gate
Final BOR CI green → merge BOR-S8 → Specialist / Red Team / Research Council evaluation boundary.

## Current blocker
BOR independent Railway/database activation remains blocked by Railway free-plan resource capacity. This does not block repository Alpha development.
