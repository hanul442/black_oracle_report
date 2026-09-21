# ACTIVE SPRINT — BOR Alpha Independent Runtime Infrastructure

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Completed
- BOR-S0 repository/product boundary bootstrap.
- BOR-S1 independent TypeScript runtime + CI.
- BOR-S2 canonical `bor.evidence.v1`.
- BOR-S3 append-only Evidence Store.
- BOR-S4 persistent SQL adapter contract.
- CLEANUP-01 migration ownership audit.
- BOR-S5 Source/NARS ingestion.
- BOR-S6 bounded Collector/NARS ingestion cycle — merged #8 as `6fb72904d9584738460c828edd70fbe729e934cd`.

## Active — BOR-S7 Independent runtime/database provisioning gate

### Objective
Make BOR independently deployable without using the legacy combined Black Oracle runtime, BOT database, broker credentials, trading state or execution authority. Establish a minimal health/readiness HTTP runtime first, then provision an isolated Railway project/service. Database provisioning is allowed only when persistence is genuinely durable and rollback is non-destructive.

### Acceptance criteria
- Add a minimal BOR HTTP runtime with `/health` and `/version` surfaces backed by the existing runtime authority contract.
- Runtime must fail closed if forbidden trading/broker environment variable names are present.
- Health output must never expose environment values or secrets.
- Add production `start` script and deterministic runtime server tests.
- Deploy from `hanul442/black_oracle_report` into a new independent Railway project/service, not the legacy Black Oracle project.
- Railway service uses an explicit healthcheck and has no trading/broker secrets.
- Do not attach BOR to BOT/legacy database.
- Persisted Evidence database may be provisioned only using a durable provider/volume. Do not create an ephemeral Postgres service and call it production-ready.
- If durable DB provisioning requires provider organization/cost confirmation not available in-chat, record that exact blocker and continue with the independently deployable runtime.
- No Evidence rows are deleted as rollback.

### Product / safety boundary
- BOR has **NO trading authority**.
- No broker credentials, private exchange keys, order path, BOT portfolio mutation, BOT database dependency or Risk authority.
- Runtime is read/write authority only for BOR-owned research/evidence state once an independent DB is attached.
- Legacy Railway Black Oracle project remains unchanged.

### Rollback path
Disable/remove the new isolated BOR Railway service or revert the runtime PR. Do not mutate legacy Black Oracle services and do not delete historical Evidence. Database rollback is stop-writes/roll-forward only.

### Exact next gate
`plan + research review → minimal health runtime + tests → BOR CI green → merge → create isolated Railway project/service → verify deployment health → attach durable independent database only if provider/volume gate is safely satisfied`.

## Research / precedent review
- DI-001 — runtime/build/deployment identity must be explicit and replayable.
- DI-003 — production Evidence still preserves publication/observation time; deployment must not alter time semantics.
- DI-004 — provenance/snapshot replay survives infrastructure changes.
- BOR-S1 — runtime authority contract forbids trading/broker environment variables and BOT dependency.
- BOR-S4 — SQL Evidence adapter is provider-agnostic and append-first.
- BOR-S6 — collector runtime has no execution/report-publication authority.
- Railway persistent database precedent: Postgres persistence requires durable volume; an unmounted image service is not sufficient.

Research disposition: **REFERENCE / infrastructure constraint.** No trading or report-publication authority is adopted.

## Current infrastructure state
- Railway has legacy `Black Oracle` and `SOCIAL VEGAS` projects only.
- No dedicated BOR project/service/database exists.
- Legacy Black Oracle services must not be changed.

## Next ordered Alpha work
1. BOR-S7 independent HTTP runtime + Railway service.
2. Durable independent Evidence database provisioning/binding.
3. Organizer/Research Analyst pipeline.
4. Specialist/Red Team/Research Council evaluation.
5. Versioned thesis/Bull-Base-Bear/report archive.
6. Citation/consistency checks and PDF/export.
