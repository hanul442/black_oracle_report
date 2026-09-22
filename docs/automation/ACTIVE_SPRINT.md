# ACTIVE SPRINT — BOR Alpha Runtime Integration

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S21 COMPLETE / S22 VERIFIED — FINAL CI GATE**

## Completed baseline
- BOR-S0 through BOR-S21 complete.
- S21 verified Alpha model publish cycle merged as PR #27 / `9118fe77780b26fe1901dc76bcf0add8231d29e0`.
- Independent Railway runtime/storage provisioning remains externally blocked; do not borrow BOT/paper/web infrastructure.

## BOR-S22 objective
Add the smallest BOR-owned immutable/versioned archive boundary for already-verified Alpha read-model artifacts. S22 preserves prior versions rather than overwriting history and makes archive identity/integrity explicit without creating public publication authority.

## Acceptance criteria
- accept only an already-verified canonical Alpha read model
- derive archive identity deterministically from projection/report identity + model fingerprint; reject unsafe/path-traversal identifiers
- write each version atomically and never silently overwrite an existing different artifact
- idempotent replay of the exact same model/version is allowed and returns the same archive identity
- archived JSON deep-equals the verified canonical model; citations, Bull/Base/Bear scenarios, disagreement/data gaps and authority=false remain unchanged
- no network/provider calls, broker credentials, BOT state/database/runtime dependency, Risk bypass, execution or publication authority
- deterministic tests cover valid archive, idempotent replay, collision/tamper rejection and unsafe identifier rejection

## Product / safety boundary
BOR-owned internal research/report archive only. This does not publish externally and cannot trade. S22 does not infer, repair or suppress missing/contradictory evidence and does not mutate canonical report/model content. It only versions verified artifacts.

## Rollback
Delete the S22 archive module/tests/docs. S15 canonical projection, S19 resolver, S20 atomic writer and S21 publish cycle remain independently usable and unchanged. Existing archived files are append-only artifacts and are not destructively deleted by rollback.

## Research review / lineage
Lineage: `REPORT_CONSISTENCY_V1 → BOR-S15 → BOR-S16 → BOR-S19 → BOR-S20 → BOR-S21 → BOR-S22-H1/E1`.
Research hypothesis H1: an append-only, fingerprint-addressed BOR archive can preserve reproducible report history without weakening canonical integrity or introducing publication/trading authority.
Experiment E1: **ADOPT** after implementation head `6f8915f82931e89e907a7d558663cffc6601be11` passed BLACK ORACLE REPORT CI #99 and deterministic artifact verification.

## Verification result
- archived JSON deep-equals the canonical model
- citation IDs, Bull/Base/Bear scenarios, unresolved disagreements, data gaps and content fingerprint survive unchanged
- exact replay is idempotent and returns the same archive identity
- collision/tamper, unsafe identity, authority escalation and missing archive root fail closed
- `executionAuthority=false`, `reportPublicationAuthority=false`, `botDependency=false`
- no BOT/paper/web infrastructure or trading/publication authority introduced

## Exact next gate
Run docs-inclusive CI on the adoption-record head → require GREEN and PR #28 mergeable → squash merge. Do not deploy while independent BOR Railway runtime/storage provisioning remains externally blocked.

## Cycle exit target
- Phase: **VERIFY → DOCUMENT → FINAL CI GATE**
- Research: `BOR-S22-H1/E1 = ADOPT`
- Single next priority: **docs-inclusive GREEN CI, then safe PR #28 squash merge**
