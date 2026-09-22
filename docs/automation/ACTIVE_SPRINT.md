# ACTIVE SPRINT — BOR Alpha HTTP Route Integration

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S17 IMPLEMENTED — PR CI / VERIFY GATE**

## Completed
- BOR-S0–S16 are merged to `main`.
- `main` commit `035cfada8b57bbeb0c5db54c22cefec288dfb868` passed BLACK ORACLE REPORT CI #73.
- S15 provides canonical integrity-gated `bor.alpha-read-model.v1`; S16 provides GET-only `bor.alpha-read-api.v1` serialization.
- S17 research review recorded DI-001/003/004, AIML-005/006 and BOR-S8-E1..BOR-S16-E1 constraints.
- S17 implementation is open as PR #22.

## Active — BOR-S17 runtime HTTP route integration

### Objective
Wire the verified S16 Alpha Read API into BOR's independent HTTP runtime as a narrow read-only route, without creating a second research projection, persistence path, publication authority, trading authority, or BOT dependency.

### Acceptance criteria
- runtime exposes exactly one frozen-Alpha research route: `GET /api/alpha/report`
- route delegates response construction to `getAlphaReadApiResponse`; runtime does not reconstruct, repair, filter, or synthesize research state
- Alpha model access is dependency-injected/read-only so the HTTP layer does not acquire database or provider write authority
- absent model remains explicit `404 ALPHA_READ_MODEL_UNAVAILABLE`
- tampered/authority-escalated model remains fail-closed `409 ALPHA_READ_MODEL_INTEGRITY_FAILURE`
- non-GET request remains `405 METHOD_NOT_ALLOWED` without invoking the resolver
- health/version behavior remains unchanged
- deterministic tests cover valid route, unavailable model, tampered model, unsupported method, and unrelated route isolation
- no broker credentials, orders, BOT portfolio mutation, Risk bypass, public publishing, or BOT runtime dependency

### Product / safety boundary
Presentation transport only. S17 may retrieve a pre-built canonical S15 model through an injected read-only resolver and pass it to S16. It may never create Evidence, alter citations/scenarios/uncertainty, write database state, call brokers/exchanges, submit orders, mutate BOT state, bypass Risk, publish reports publicly, or require BOT to operate.

### Rollback
Repository-only revert of PR #22. S0–S16 canonical artifacts, API contract, runtime health/version endpoints, database schema, and deployment configuration remain unchanged.

### Research review / constraints
DI-001/003/004, AIML-005/006, BOR-S8-E1 through BOR-S16-E1 constrain S17. BOR-S17-H1: dependency-injected route composition can expose S16 without widening authority. BOR-S17-E1 remains **PENDING** until fresh PR CI and artifact verification complete.

### Implementation record
- `src/httpRuntime.ts`: adds read-only `AlphaReadModelResolver` and `/api/alpha/report` delegation to S16.
- `src/httpRuntime.test.ts`: adds canonical preservation, unavailable, tamper, method/no-read, and route-isolation cases.
- No persistence, provider, deployment, trading, publication or BOT contract changed.

### Exact next gate
Fresh CI on PR #22 → if green, verify returned model identity/fingerprint/citation/scenario/uncertainty and fixed authority=false contract → update BOR-S17-E1 Result to ADOPT/REJECT → docs-inclusive final CI → merge only when green and mergeable.

## Current blockers
- **CONFIRMED external:** Railway free-plan resource provision limit blocks independent BOR runtime/database provisioning.
- Existing Railway `Black Oracle` services are legacy BOT/paper/web infrastructure and forbidden for BOR reuse.
- PR #16 is documentation-only Global Intelligence research outside frozen Alpha implementation.
- Repository-only S17 work is unblocked.

## Cycle exit record
- Phase: **IMPLEMENT COMPLETE → TEST/VERIFY CI GATE**
- PR: #22 (`bor-s17-alpha-http-route` → `main`).
- Research result: **BOR-S17-E1 PENDING**.
- Single next priority: fresh PR #22 CI and integrity verification; do not merge before green.
