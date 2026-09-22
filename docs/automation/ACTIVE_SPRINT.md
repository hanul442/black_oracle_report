# ACTIVE SPRINT — BOR Alpha Runtime Integration

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S20 COMPLETE / S21 ACTIVE**

## Completed baseline
- BOR-S0 through BOR-S20 complete.
- S20 atomic verified artifact persistence merged as PR #26 / `97b7c4e1b98abd182660ca386c9f76f307529ba8`.

## BOR-S21 objective
Add the smallest BOR-owned orchestration boundary that creates an Alpha read model only from already-versioned report/export/consistency parents and persists it through the S20 atomic writer. This is an internal artifact handoff, not public publication.

## Acceptance criteria
- compose existing S15 `createAlphaReadModel` with S20 persistence; do not duplicate either contract
- require explicit projection id and artifact path
- parent report/export consistency and no-authority checks remain fail-closed through S15/S16
- persistence remains atomic through S20
- return only model + persistence receipt needed for verification
- deterministic tests cover valid handoff plus parent inconsistency / authority escalation / invalid path rejection
- no network/provider calls and no BOT dependency

## Product / safety boundary
Internal BOR artifact generation only. No broker credentials, orders, BOT state/database/runtime dependency, Risk bypass, public report publication, execution authority, or publication authority. Missing/contradictory evidence remains represented by the canonical report/model rather than repaired here.

## Rollback
Delete the S21 orchestration module/tests/docs. S15 model creation, S19 read resolver, and S20 persistence remain independently usable and unchanged.

## Research review gate
Review S15 Alpha read-model contract, S19 resolver, S20 persistence experiment, report consistency contract, and the no-authority precedents before implementation. Record `BOR-S21-H1/E1` lineage.

## Exact next gate
Research review → implement composition-only orchestration → deterministic CI → verify artifact/citation/scenario/uncertainty fingerprints and authority=false → ADOPT/REJECT → docs-inclusive CI → merge if green.

## Blocker truth
Independent Railway runtime/storage provisioning remains external. Do not borrow BOT/paper/web infrastructure.

## Cycle exit target
- Phase: **PLAN → RESEARCH REVIEW**
- Research: `BOR-S21-H1/E1`
- Single next priority: **verified canonical model generation-to-persistence handoff**
