# ACTIVE SPRINT — BOR Alpha Research Pipeline Foundation

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Completed
- BOR-S0–S6 + separation cleanup complete.
- BOR-S7 deployable runtime contract — merged #9 as `54056741c7c1bfe6f2636d7706c2f31a807ab35a`.
- BOR-S7 infrastructure activation is **BLOCKED by Railway free-plan resource provision limit**; no legacy runtime/database was reused.

## Active — BOR-S8 Organizer / Research Analyst contract

### Objective
Define an authority-safe research transformation from canonical Evidence into organized research bundles and analyst reviews before introducing LLM orchestration, Specialist/Red Team/Council behavior or report publication.

### Acceptance criteria
- Define versioned `bor.research-bundle.v1` and `bor.analyst-review.v1` contracts.
- Preserve explicit Evidence IDs, source/time/provenance lineage and asset resolution state.
- Require analysis material to match the stored Evidence content fingerprint before it can support an analyst claim.
- If canonical analysis material is missing, preserve the Evidence as a data gap; never fabricate content.
- Preserve explicit evidence disposition: SUPPORTING / CONTRADICTING / CONTEXT / UNRESOLVED.
- Reject duplicate Evidence IDs and Evidence observed after the bundle knowledge cutoff.
- Analyst supporting/counterevidence citations must refer to Evidence in the bundle and must have verified analysis material.
- Analyst may not silently relabel CONTRADICTING Evidence as supporting or vice versa.
- Missing/contradictory evidence and assumptions remain explicit.
- `executionAuthority=false` and `reportPublicationAuthority=false` throughout.
- Add deterministic tests for fingerprint mismatch, future knowledge, missing material, unknown citation, contradiction preservation and authority escalation.
- No LLM/provider calls, no report publication, no database/runtime provisioning and no BOT dependency in this work package.

### Product / safety boundary
- BOR has **NO trading authority**.
- Organizer/Analyst contracts cannot submit orders, mutate BOT portfolio state, access BOT database, bypass Risk or publish a final report.
- Legacy BOT #200 is a design precedent only; no stale runtime/credit/billing behavior is imported.
- AIML-005/006 remain downstream evaluation gates before broad multi-agent activation.

### Rollback path
Revert the BOR-S8 PR. S0–S7 contracts remain intact; no infrastructure/database state or historical Evidence is modified.

### Exact next gate
`plan + research review → research bundle + analyst review contracts → deterministic tests → BOR CI green → merge BOR-S8 → Specialist/Red Team/Research Council evaluation boundary`.

## Research review
- **DI-001** — research transformations must be versioned/replayable.
- **DI-003** — Evidence observed after knowledge cutoff cannot enter a historical research bundle.
- **DI-004** — Evidence provenance/fingerprint identity survives into analysis.
- **AIML-005 / AIML-006** — broad agent/Council expansion remains evaluation-gated.
- Legacy BOT **#200** — AnalystReview / Debate / Lead synthesis / activation structures are migration precedents only.
- Current BOR-S2/S5/S6 contracts are canonical over all legacy report-first code.

Research disposition will be recorded in `docs/research/2026-09-21-s8-organizer-analyst-review.md` before implementation.

## Current blocker
Independent BOR Railway/database provisioning remains blocked by Railway free-plan resource capacity. Repository Alpha development continues independently.

## Next ordered Alpha work
1. BOR-S8 Organizer / Research Analyst contract — ACTIVE.
2. Specialist / Red Team / Research Council evaluation boundary.
3. Versioned thesis + Bull/Base/Bear + catalysts/risks/contradictions.
4. Report archive + citation/consistency checks.
5. UI + PDF/export.
