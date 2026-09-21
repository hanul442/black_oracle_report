# ACTIVE SPRINT — BOR Alpha Independent Runtime Bootstrap

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS — DEPLOYMENT CAPACITY BLOCKED**

## Completed
- BOR-S0–S12 complete and merged.
- S12 established `bor.report-export.v1` with deterministic parent/export integrity and zero execution/publication authority.

## Active — BOR-S13 Independent runtime/deployment bootstrap

### Objective
Close the highest-priority structural Alpha blocker by making the existing BOR runtime contract independently deployable and verifiable without reusing or mutating legacy BLACK ORACLE/BOT services.

### Acceptance criteria
- independent BOR Railway project/service identity; no legacy Black Oracle service reuse
- deploy source exclusively `hanul442/black_oracle_report`
- `/health` and `/version` expose BOR runtime status/version with fixed `tradingAuthority=false`, `botDependency=false`
- forbidden broker/trading environment names fail closed without leaking values
- deployment config/startup is deterministic and covered by repository tests/CI
- BOR-owned database remains isolated; if durable DB provisioning is blocked, record it explicitly rather than borrowing BOT storage
- actual deployed artifact/revision and runtime endpoints verified before claiming deployment complete

### Product / safety boundary
BOR research/report runtime only. Never hold broker/exchange credentials, submit orders, mutate BOT portfolio state, bypass Risk, reuse BOT database credentials, or make BOT a runtime dependency. No destructive database operation. Public report publication authority remains false.

### Rollback
Repository: revert S13 PR. Railway: disable/remove only a newly isolated BOR service/project or redeploy the previous BOR revision. Existing `Black Oracle` Railway project/services remain untouched.

### Research review / constraints
DI-001/003/004, AIML-005/006, bootstrap review, `RUNTIME_BOUNDARY.md`, and `RUNTIME_DEPLOYMENT_CONTRACT_V1.md` reviewed. Preserve Research → Hypothesis → Experiment → Result → Adopt/Reject lineage. Deployment identity and revision must be auditable; inability to provision durable storage remains explicit.

### Verification / result
- Added deterministic `railway.json`: Railpack build, `npm ci --ignore-scripts && npm run build`, `npm start`, `/health`, bounded restart policy.
- CI #57 passed typecheck, build, full tests and Railway config verification.
- Isolated Railway project creation was attempted and rejected by Railway: `Free plan resource provision limit exceeded. Please upgrade to provision more resources!`
- No legacy Railway service or BOT/database resource was modified or reused.
- **BOR-S13-E1: repository-side deployment contract ADOPT; live deployment verification HOLD.**

### Exact next gate
Merge repository-side S13 only after docs-inclusive CI is green. Runtime/database gate remains: provision isolated BOR resources after Railway capacity is available, then verify deployed revision + `/health` + `/version`. While blocked, move Alpha implementation to the next safe repository-only package rather than reusing BOT infrastructure.

## Current blockers
- **CONFIRMED:** Railway free-plan resource provision limit blocks creation of an independent BOR project/runtime/database.
- Existing Railway `Black Oracle` project is legacy BOT/paper/web infrastructure and is forbidden for BOR reuse.
- PR #16 remains documentation-only Global Intelligence research outside the frozen Alpha implementation path.

## Cycle exit record
- Phase: **IMPLEMENT/TEST/VERIFY COMPLETE → DOCUMENT / FINAL CI**
- Research result: repository deployability **ADOPT**, live deployment **HOLD**.
- Single next priority after safe S13 merge: next frozen-Alpha repository-only package, with Railway deployment gate kept explicit.
