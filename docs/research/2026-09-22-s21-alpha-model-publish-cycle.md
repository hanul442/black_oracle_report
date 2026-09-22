# BOR-S21 Research Review — Verified Alpha Model Publish Cycle

Date: 2026-09-22
Status: ACTIVE / PENDING
Hypothesis: BOR-S21-H1
Experiment: BOR-S21-E1

## Research lineage
`REPORT_CONSISTENCY_V1 → BOR-S15 Alpha Read Model → BOR-S16 integrity gate → BOR-S19 resolver → BOR-S20 atomic persistence → BOR-S21-H1/E1`

## Reviewed precedents
- `ALPHA_READ_MODEL_CONTRACT_V1`: projection is presentation-ready metadata, not new synthesis; exact citations/scenarios/disagreements/data gaps are preserved; authority flags are fixed false.
- `BOR-S20-H1/E1 = ADOPT`: same-filesystem atomic replace of an S16-valid model is a safe BOR-owned handoff to the read runtime.
- S15 implementation independently re-runs report/export consistency, so stale PASS objects cannot authorize changed parents.

## Hypothesis
A composition-only function that calls the existing S15 model creator and then the existing S20 atomic writer can close the generation-to-runtime-artifact handoff without adding a second integrity policy, publication authority, or BOT dependency.

## Experiment
Implement a narrow `publishAlphaReadModelArtifact` boundary taking canonical report/export/consistency parents, projection id, and explicit BOR artifact path. It must create via S15, persist via S20, and return the immutable model plus persistence receipt. No repair, synthesis, provider/network call, public publication, BOT access, or execution path is permitted.

## Adoption gate
ADOPT only if deterministic CI proves valid round-trip and fail-closed behavior for inconsistent/tampered parents, authority escalation, and invalid path while preserving citation/scenario/uncertainty fields and all authority flags as false.
