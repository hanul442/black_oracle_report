# ACTIVE SPRINT — BOR Alpha v0.1

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S21 + FOUNDATION MERGED / S22 ADOPTED — FINAL MERGE GATE**

## Completed baseline
- BOR-S0 through BOR-S21 complete.
- S21 verified Alpha model publish cycle merged as PR #27 / `9118fe77780b26fe1901dc76bcf0add8231d29e0`.
- Foundation runtime build boundary merged as PR #29 / `51c88b786a2b31ee968f5c9124123cf828f7059a`; it adds publish-to-read verification, lockfile, and isolated deployment runbook while preserving the independent-runtime blocker truth.

## BOR-S22 objective
Recover the already-researched S22 immutable/versioned archive on top of foundation `main`, without overwriting foundation control-plane changes, and preserve reproducible report history for already-verified canonical Alpha read models.

## Acceptance criteria
- accept only an already-verified canonical Alpha read model
- derive archive identity deterministically from projection/report/version/model fingerprint; reject unsafe/path-traversal identifiers
- write each version atomically and never silently overwrite an existing different artifact
- exact replay of the same model/version is idempotent
- archived JSON deep-equals the verified canonical model; citations, Bull/Base/Bear scenarios, disagreement/data gaps and authority=false remain unchanged
- foundation lockfile/runbook/runtime verification from PR #29 remain intact
- no network/provider calls, broker credentials, BOT state/database/runtime dependency, Risk bypass, execution or publication authority

## Product / safety boundary
BOR-owned internal research/report archive only. No external publication or trading. S22 does not infer, repair or suppress missing/contradictory evidence and does not mutate canonical report/model content. It only versions verified artifacts. Do not borrow BOT/PAPER storage, credentials, scheduler, runtime or mutation authority.

## Rollback
If the final docs-inclusive gate regresses, do not merge PR #30; revert only the S22 archive module/tests/research/control-document changes. Foundation PR #29 and S15/S19/S20/S21 contracts remain untouched. Existing archive artifacts, when production storage exists, are append-only and are not destructively deleted by rollback.

## Research review / lineage
`REPORT_CONSISTENCY_V1 → BOR-S15 → BOR-S16 → BOR-S19 → BOR-S20 → BOR-S21 → BOR-S22-H1/E1`.
S22-H1: a content-addressed append-only BOR archive can preserve reproducible report history without weakening canonical integrity or introducing publication/trading authority.
Original S22 implementation head `6f8915f82931e89e907a7d558663cffc6601be11` passed CI #99 and adoption-record head `ea5d7db389e26324c0dec9f255b687b3578a9008` passed CI #101. PR #28 became non-mergeable after foundation PR #29 advanced `main`, so recovery PR #30 reapplied S22 on current `main`. Recovery implementation head `2e6d4443f863c4b6279cf6ae98fb295d2a28f574` passed BLACK ORACLE REPORT CI #105.

## Verification result
- archived JSON deep-equals the canonical Alpha model
- citation IDs and Bull/Base/Bear scenarios remain unchanged
- unresolved disagreements, data gaps and content fingerprint remain unchanged
- exact replay is idempotent
- collision/tamper, unsafe identity, missing root and authority escalation fail closed
- PR #30 changes only S22 archive module/tests/research/control docs, preserving foundation runtime/build/deployment files
- `BOR-S22-E1 = ADOPT`

## Blocker truth
- independent Railway project creation remains blocked by the connected workspace free-plan resource provision limit
- BOR-owned durable production artifact storage is not yet established
- an unmounted Railway filesystem is not canonical persistence
- S22 repository work does not claim production durability

## Exact next gate
Run fresh docs-inclusive CI on the adoption-record head → re-check PR #30 mergeability and blocker truth → squash merge only if green. No deployment is claimed while independent runtime/storage provisioning remains blocked.

## Cycle exit target
- Phase: **VERIFY → DOCUMENT → PR/MERGE**
- Research: `BOR-S22-E1 = ADOPT`
- Single next priority: **final docs-inclusive CI and safe PR #30 merge**
