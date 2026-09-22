# ACTIVE SPRINT — BOR Alpha Runtime Integration

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S20 COMPLETE / S21 ADOPTED — FINAL CI GATE**

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

## Research review / lineage
`REPORT_CONSISTENCY_V1 → BOR-S15 → BOR-S16 → BOR-S19 → BOR-S20 → BOR-S21-H1/E1`.
S21 remains composition-only: S15 owns canonical projection/integrity, S20 owns verified atomic persistence. The S8 thesis precedent constrains fixtures: an `INSUFFICIENT_DATA` council may preserve scenarios and uncertainty but cannot be laundered into a directional thesis.

## Test / verification status
- CI #93 on `374b1049ff1647f3b768da9f5715a8c4424ee42f`: **FAIL**, 81/84 tests passed because the new fixture violated the existing `INSUFFICIENT_DATA` thesis invariant before S21 executed.
- Fix `8353ae55070a64c421190948ed980714e64130a9` preserved the invariant and made the fixture thesis explicitly empty.
- Final implementation/docs head before adoption record `1d77e18c2ee7af7f0647bf1a74ff54c5b243dbf2`: **CI #95 SUCCESS**.
- Verified deterministic coverage: persisted artifact deep-equals canonical model; citation IDs preserved; Bull/Base/Bear count = 3; unresolved disagreement and data gaps preserved; persistence/model fingerprints agree; execution/publication/BOT authority flags all false.
- Tampered parent and authority escalation reject before persistence; invalid artifact target fails closed.
- Research decision: **`BOR-S21-E1 = ADOPT`**.

## Exact next gate
Run docs-inclusive CI on the adoption-record head → require GREEN and PR #27 mergeable → squash merge. If either fails, do not merge; diagnose without weakening integrity/uncertainty/authority boundaries.

## Blocker truth
Independent Railway runtime/storage provisioning remains external. Do not borrow BOT/paper/web infrastructure.

## Cycle exit target
- Phase: **DOCUMENT → FINAL CI / MERGE**
- Research: `BOR-S21-H1/E1 = ADOPT`
- Single next priority: **close final docs-inclusive CI and merge PR #27 only if green**
