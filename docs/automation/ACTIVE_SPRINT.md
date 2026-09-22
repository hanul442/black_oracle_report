# ACTIVE SPRINT — BOR-S19 Runtime Alpha Model Resolver

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S19 PLAN / IMPLEMENTATION**

## Baseline
- BOR-S0–S18 are merged.
- Latest main CI #82 is SUCCESS.
- `GET /api/alpha/report` and `GET /alpha/report` are integrity-gated consumer surfaces.
- Production `src/start.ts` currently starts `createBorHttpServer(process.env)` without an AlphaReadModelResolver, so a started runtime cannot resolve a real model.
- Independent Railway runtime/database provisioning remains blocked by free-plan capacity; BOT/paper/web infrastructure remains forbidden for BOR reuse.

## Objective
Connect the production entrypoint to one BOR-owned, read-only canonical Alpha model resolver without introducing a database dependency or fabricating report state. For frozen Alpha, the resolver may read a BOR-local canonical artifact file path explicitly configured by environment; absence must remain an explicit 404 and malformed/tampered artifacts must fail closed.

## Acceptance criteria
1. Define one read-only resolver/repository boundary returning `Readonly<AlphaReadModel> | undefined`.
2. Production start wires that resolver into `createBorHttpServer`.
3. No configured artifact => existing `ALPHA_READ_MODEL_UNAVAILABLE` 404.
4. Configured artifact must parse as JSON and pass `isValidAlphaReadModel`; malformed/tampered/authority-escalated artifacts must never become a 200 response.
5. Resolver does not repair, mutate, synthesize, or rewrite model/Evidence/citations/scenarios/uncertainty.
6. Production has no fixture/demo fallback and no BOT database/runtime dependency.
7. Tests cover verified artifact, absent artifact, malformed/tampered artifact, and restart/read behavior.
8. Typecheck/build/full deterministic suite green before adoption/merge.

## Product / safety boundary
Read-only BOR artifact loading only. No broker credentials, order submission, BOT portfolio state, BOT database access, Risk bypass, report-publication authority, trading authority, provider calls, or fixture fallback. `executionAuthority=false`, `reportPublicationAuthority=false`, and `botDependency=false` remain mandatory. Missing or contradictory evidence remains explicit in the canonical model.

## Research constraints
Review before implementation: DI-001/DI-003/DI-004, AIML-005/AIML-006, BOR-S11–S18 lineage, especially BOR-S15 integrity-gated projection and S16/S17/S18 fail-closed consumer/runtime contracts. Record S19 as Research → Hypothesis → Experiment → Result → Adopt/Reject.

## Rollback path
Revert S19 branch/PR. `main` remains on S18 with structurally complete surfaces returning explicit `ALPHA_READ_MODEL_UNAVAILABLE` from the production entrypoint. No database/deployment migration is involved.

## Exact next gate
Research review recorded → implement read-only file resolver + production wiring + deterministic tests → CI → verify actual artifact/citation/authority integrity → ADOPT/REJECT → docs → merge if green. Deployment remains HOLD while independent Railway capacity is unavailable.

## Current blockers
- **External deployment only:** Railway free-plan resource provision limit blocks independent BOR runtime/database provisioning.
- Existing BOT/paper/web Railway services remain forbidden for BOR reuse.
