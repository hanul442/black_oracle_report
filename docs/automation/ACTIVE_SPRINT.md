# ACTIVE SPRINT — BOR Alpha Runtime Integration

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S20 COMPLETE / S21 ACTIVE — CI FIX VERIFICATION**

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
S21 remains composition-only: S15 owns canonical projection/integrity, S20 owns verified atomic persistence. The S8 thesis precedent also constrains fixtures: an `INSUFFICIENT_DATA` council may preserve scenarios and uncertainty but cannot be laundered into a directional thesis.

## Test / verification status
- CI #93 on `374b1049ff1647f3b768da9f5715a8c4424ee42f`: **FAIL**, 81/84 tests passed.
- Failure was isolated to all three new S21 tests before the S21 boundary executed: the fixture paired an `INSUFFICIENT_DATA` council with non-empty `thesis: 'bounded thesis'`, correctly rejected by the existing thesis safety invariant.
- Production S21 orchestration was not implicated; no integrity or authority bypass was observed.
- Fix commit `8353ae55070a64c421190948ed980714e64130a9` keeps the council uncertainty explicit and sets the fixture thesis to empty rather than weakening the invariant.
- CI #94 for the fix is in progress. `BOR-S21-E1` remains **PENDING** until green CI and artifact verification.

## Exact next gate
CI #94 GREEN → verify persisted artifact equals canonical model; citations, three scenarios, unresolved disagreement, data gaps and fingerprint are preserved; all authority flags remain false → record `BOR-S21-E1` ADOPT/REJECT → docs-inclusive final CI → merge only if green.

## Blocker truth
Independent Railway runtime/storage provisioning remains external. Do not borrow BOT/paper/web infrastructure.

## Cycle exit target
- Phase: **TEST → VERIFY**
- Research: `BOR-S21-H1/E1 = PENDING`
- Single next priority: **close CI #94 and verify the S21 generation-to-persistence handoff without weakening uncertainty safeguards**
