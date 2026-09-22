# ACTIVE SPRINT — BOR Alpha Runtime Integration

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S21 MERGED / FOUNDATION RUNTIME CLOSURE ACTIVE**

## Completed baseline
- BOR-S0 through BOR-S20 complete.
- S20 atomic verified artifact persistence merged as PR #26 / `97b7c4e1b98abd182660ca386c9f76f307529ba8`.
- S21 verified Alpha model publish cycle merged on `main` at `9118fe77780b26fe1901dc76bcf0add8231d29e0`.

## Foundation objective
Deploy the existing BOR-owned runtime independently, attest its exact source revision, and prove the artifact generation -> verification -> persistence -> resolver -> read path without borrowing BOT execution or database mutation authority.

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

## Foundation changes
- committed the lockfile required by the existing Railway `npm ci` build command
- extended the S21 test through file resolution and the integrity-gated read API
- recorded the independent deployment, artifact, smoke-test, and rollback boundary in `docs/runtime/FOUNDATION_DEPLOYMENT_RUNBOOK.md`

## Blocker truth
- independent Railway project creation was attempted and blocked by the connected workspace's free-plan resource provision limit; an upgrade or an explicitly approved equivalent isolated resource is required
- BOR-owned durable artifact storage is not yet established
- an unmounted Railway filesystem is not canonical persistence
- do not borrow BOT/PAPER storage, credentials, scheduler, or mutation authority

## Cycle exit target
- Phase: **VERIFY → PR / CI → RUNTIME ATTESTATION**
- Repository pipeline: exact-head build/test must remain green
- Runtime: **BLOCKED** pending independent resource capacity; exact deployed SHA, `/health`, and `/version` remain unverified in Railway
- Artifact path: deterministic local handoff pass; durable production persistence remains explicit until provisioned
- Single next priority: **attest the isolated BOR Railway deployment and preserve the storage blocker truth**
