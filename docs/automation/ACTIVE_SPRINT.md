# ACTIVE SPRINT — BOR Alpha Runtime Integration

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S21 COMPLETE / S22 PLAN — VERSIONED REPORT ARCHIVE**

## Completed baseline
- BOR-S0 through BOR-S21 complete.
- S21 verified Alpha model publish cycle merged as PR #27 / `9118fe77780b26fe1901dc76bcf0add8231d29e0`.
- Independent Railway runtime/storage provisioning remains externally blocked; do not borrow BOT/paper/web infrastructure.

## BOR-S22 objective
Add the smallest BOR-owned immutable/versioned archive boundary for already-verified Alpha read-model artifacts. S22 must preserve prior versions rather than overwrite history, and must make archive identity/integrity explicit without creating public publication authority.

## Acceptance criteria
- accept only an already-verified canonical Alpha read model
- derive archive identity deterministically from projection/report identity + model fingerprint; reject unsafe/path-traversal identifiers
- write each version atomically and never silently overwrite an existing different artifact
- idempotent replay of the exact same model/version is allowed and returns the same archive identity
- archived JSON deep-equals the verified canonical model; citations, Bull/Base/Bear scenarios, disagreement/data gaps and authority=false remain unchanged
- no network/provider calls, broker credentials, BOT state/database/runtime dependency, Risk bypass, execution or publication authority
- deterministic tests cover valid archive, idempotent replay, collision/tamper rejection and unsafe identifier rejection

## Product / safety boundary
BOR-owned internal research/report archive only. This does not publish externally and cannot trade. S22 must not infer, repair or suppress missing/contradictory evidence and must not mutate canonical report/model content. It only versions verified artifacts.

## Rollback
Delete the S22 archive module/tests/docs. S15 canonical projection, S19 resolver, S20 atomic writer and S21 publish cycle remain independently usable and unchanged. Existing archived files are append-only artifacts and are not destructively deleted by rollback.

## Research review / lineage
Planned lineage: `REPORT_CONSISTENCY_V1 → BOR-S15 → BOR-S16 → BOR-S19 → BOR-S20 → BOR-S21 → BOR-S22-H1/E1`.
Research hypothesis H1: an append-only, fingerprint-addressed BOR archive can preserve reproducible report history without weakening canonical integrity or introducing publication/trading authority.
Experiment E1: deterministic archive tests + CI + artifact verification. Decision remains **PENDING** until verification completes.

## Exact next gate
Review S15/S20/S21 contracts and research precedents → implement composition-only archive writer → deterministic tests → fresh CI → verify byte/model integrity, citation/scenario/uncertainty preservation and no-authority flags → record ADOPT/REJECT. Merge only after docs-inclusive GREEN CI.

## Cycle exit target
- Phase: **PLAN → RESEARCH REVIEW**
- Research: `BOR-S22-H1/E1 = PENDING`
- Single next priority: **implement and verify immutable versioned archive boundary**
