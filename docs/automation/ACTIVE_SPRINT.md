# ACTIVE SPRINT — BOR Alpha Independent Runtime Infrastructure

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Completed
- BOR-S0–S6 + separation cleanup complete.
- BOR-S6 merged #8 as `6fb72904d9584738460c828edd70fbe729e934cd`.

## Active — BOR-S7 Independent runtime/database provisioning gate

### Objective
Deploy BOR independently from the legacy combined Black Oracle runtime and attach only durable BOR-owned persistence.

### Implemented runtime contract
- `GET /health` backed by existing authority contract.
- `GET /version` with `tradingAuthority=false`, `botDependency=false`.
- forbidden broker/trading env names fail health closed with HTTP 503.
- environment values/secrets are never returned.
- production `start` script.
- deterministic HTTP runtime tests.

### Research review
DI-001, DI-003, DI-004 plus BOR-S1/S4/S6 and Railway durable-storage constraints.
Research record: `docs/research/2026-09-21-s7-infrastructure-review.md`.
Disposition: **ADOPT-RUNTIME / DB-PENDING**.

### Safety boundary
- no BOT database dependency,
- no broker/private exchange credentials,
- no order/portfolio/Risk authority,
- no Evidence deletion rollback,
- legacy Railway Black Oracle project remains untouched,
- ephemeral unmounted Postgres is not acceptable as canonical storage.

### Verification
- PR: **#9**
- implementation head BOR CI #20 — **PASS**
- typecheck/build/full tests — **PASS**
- deployment contract: `docs/architecture/RUNTIME_DEPLOYMENT_CONTRACT_V1.md`
- Railway deployment: pending post-merge.

### Rollback
Repository revert before deploy; after deploy disable/remove only the isolated BOR service or redeploy prior BOR commit. Never mutate legacy Black Oracle services.

### Exact next gate
Final documentation-head CI green → merge PR #9 → create private Railway project `BLACK ORACLE REPORT` → deploy `hanul442/black_oracle_report@main` → configure healthcheck `/health` → verify actual deployment/service env names → durable database gate.

## Database gate
Railway tooling available in this session can create image services but cannot attach a durable volume. Therefore a bare Postgres image will **not** be treated as a valid BOR database. A durable provider/volume path must be verified before schema application.

## Cycle exit target
- independent BOR Railway service HEALTHY,
- no trading/broker env names,
- exact deployed commit verified,
- durable database either verified/bound or explicitly recorded as the only remaining S7 blocker.
