# ACTIVE SPRINT — BOR Alpha v0.1

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S21 + FOUNDATION MERGED / S22 REBASE-RECOVERY ACTIVE**

## Completed baseline
- BOR-S0 through BOR-S21 complete.
- S21 verified Alpha model publish cycle merged as PR #27 / `9118fe77780b26fe1901dc76bcf0add8231d29e0`.
- Foundation runtime build boundary merged as PR #29 / `51c88b786a2b31ee968f5c9124123cf828f7059a`; it adds publish-to-read verification, lockfile, and isolated deployment runbook while preserving the independent-runtime blocker truth.

## BOR-S22 objective
Recover the already-researched and CI-verified S22 immutable/versioned archive on top of the newer foundation `main`, without overwriting foundation control-plane changes. Preserve reproducible report history for already-verified canonical Alpha read models.

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
Close the superseded/conflicting PR #28 and delete only the rebased S22 archive module/tests/research doc if the fresh integration gate fails. Foundation PR #29 and S15/S19/S20/S21 contracts remain untouched. Existing archive artifacts, when production storage exists, are append-only and are not destructively deleted by rollback.

## Research review / lineage
`REPORT_CONSISTENCY_V1 → BOR-S15 → BOR-S16 → BOR-S19 → BOR-S20 → BOR-S21 → BOR-S22-H1/E1`.
S22-H1: a content-addressed append-only BOR archive can preserve reproducible report history without weakening canonical integrity or introducing publication/trading authority.
Prior S22 implementation head `6f8915f82931e89e907a7d558663cffc6601be11` passed CI #99; adoption-record head `ea5d7db389e26324c0dec9f255b687b3578a9008` passed docs-inclusive CI #101. PR #28 then became non-mergeable because foundation PR #29 independently changed `ACTIVE_SPRINT` from the same S21 base. This recovery branch starts from current `main` and reapplies S22 without discarding foundation changes.

## Blocker truth
- independent Railway project creation remains blocked by the connected workspace free-plan resource provision limit
- BOR-owned durable production artifact storage is not yet established
- an unmounted Railway filesystem is not canonical persistence
- S22 repository work is unblocked because it is deterministic/local and does not claim production durability

## Exact next gate
Reapply the reviewed S22 research/implementation/tests on current `main` → fresh CI → verify archive equality/citations/scenarios/disagreements/data gaps/fingerprint/no-authority and foundation regression safety → ADOPT/REJECT → merge only if green and mergeable.

## Cycle exit target
- Phase: **PLAN → RESEARCH REVIEW → IMPLEMENT / TEST / VERIFY**
- Research: `BOR-S22-H1/E1` remains provisionally ADOPT based on CI #99/#101, pending fresh current-main integration verification
- Single next priority: **complete current-main S22 integration without weakening the foundation boundary**
