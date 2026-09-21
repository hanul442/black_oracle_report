# ACTIVE SPRINT — BOR Alpha Independent Runtime Bootstrap

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

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
- BOR-owned database remains isolated; if durable DB provisioning is blocked, record it explicitly and continue with stateless runtime verification rather than borrowing BOT storage
- actual deployed artifact/revision and runtime endpoints verified before ADOPT

### Product / safety boundary
BOR research/report runtime only. Never hold broker/exchange credentials, submit orders, mutate BOT portfolio state, bypass Risk, reuse BOT database credentials, or make BOT a runtime dependency. No destructive database operation. Public report publication authority remains false.

### Rollback
Repository: revert S13 PR. Railway: disable/remove only the newly isolated BOR service/project or redeploy the previous BOR revision. Existing `Black Oracle` Railway project/services remain untouched.

### Research review / constraints
Review DI-001/003/004, AIML-005/006, bootstrap review, `RUNTIME_BOUNDARY.md`, and `RUNTIME_DEPLOYMENT_CONTRACT_V1.md`. Preserve Research → Hypothesis → Experiment → Result → Adopt/Reject lineage. Deployment identity and revision must be auditable; inability to provision durable storage must remain explicit.

### Exact next gate
Record S13 research review → inspect runtime implementation/config/tests → implement missing deterministic deployability controls → CI → create isolated Railway BOR project/service only if safe and capacity permits → verify `/health` + `/version` and revision → document → PR/merge when green.

## Current blockers
- Independent BOR Railway project/runtime/database not yet provisioned at PLAN time.
- Existing Railway `Black Oracle` project is legacy BOT/paper/web infrastructure and is forbidden for BOR reuse.
- PR #16 remains documentation-only Global Intelligence research outside the frozen Alpha implementation path.

## Cycle exit record
- Phase: **PLAN COMPLETE → RESEARCH REVIEW**
- Single next priority: BOR-S13 independent runtime bootstrap
