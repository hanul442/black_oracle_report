# BOR-S21 Research Review — Verified Alpha Model Publish Cycle

Date: 2026-09-22
Status: ADOPTED
Hypothesis: BOR-S21-H1
Experiment: BOR-S21-E1 = ADOPT

## Research lineage
`REPORT_CONSISTENCY_V1 → BOR-S15 Alpha Read Model → BOR-S16 integrity gate → BOR-S19 resolver → BOR-S20 atomic persistence → BOR-S21-H1/E1`

## Reviewed precedents
- `ALPHA_READ_MODEL_CONTRACT_V1`: projection is presentation-ready metadata, not new synthesis; exact citations/scenarios/disagreements/data gaps are preserved; authority flags are fixed false.
- `BOR-S20-H1/E1 = ADOPT`: same-filesystem atomic replace of an S16-valid model is a safe BOR-owned handoff to the read runtime.
- S15 implementation independently re-runs report/export consistency, so stale PASS objects cannot authorize changed parents.
- S8 thesis safety invariant: `INSUFFICIENT_DATA` may preserve scenarios and uncertainty but cannot be converted into a directional thesis.

## Hypothesis
A composition-only function that calls the existing S15 model creator and then the existing S20 atomic writer can close the generation-to-runtime-artifact handoff without adding a second integrity policy, publication authority, or BOT dependency.

## Experiment
Implemented narrow `publishAlphaReadModelArtifact` boundary taking canonical report/export/consistency parents, projection id, and explicit BOR artifact path. It creates via S15, persists via S20, and returns the immutable model plus persistence receipt. No repair, synthesis, provider/network call, public publication, BOT access, or execution path is permitted.

## Result
ADOPT. Final head `1d77e18c2ee7af7f0647bf1a74ff54c5b243dbf2` passed BLACK ORACLE REPORT CI #95. Deterministic tests verify exact persisted-model equality; citation evidence IDs; all three Bull/Base/Bear scenarios; unresolved disagreement; data gaps; model/persistence fingerprint agreement; and `executionAuthority=false`, `reportPublicationAuthority=false`, `botDependency=false`. Tampered parents and attempted authority escalation fail before persistence, and an invalid artifact target fails closed.

CI #93 previously exposed an invalid test fixture: an `INSUFFICIENT_DATA` council was paired with a non-empty thesis. The fix preserved the production safety invariant by making the fixture thesis explicitly empty rather than weakening validation.

## Adoption decision
`BOR-S21-E1 = ADOPT`. The composition-only handoff satisfies the Alpha boundary and preserves uncertainty/citation integrity. Rollback remains deletion of the S21 orchestration/tests/docs; S15, S19, and S20 remain independently usable.
