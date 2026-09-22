# BOR-S17 Alpha HTTP Route Research Review

Date: 2026-09-22
Status: EXPERIMENT

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **DI-001:** downstream transports require explicit versioned contracts and stable parent identity.
- **DI-003:** consumers may not expand or silently rewrite point-in-time knowledge state.
- **DI-004:** canonical Evidence IDs remain citation lineage across transformations.
- **AIML-005/006:** uncertainty, disagreement and contradictory evidence remain first-class; downstream presentation cannot collapse them into unsupported certainty.
- **BOR-S15-E1 ADOPT:** `bor.alpha-read-model.v1` is the canonical integrity-gated consumer projection.
- **BOR-S16-E1 ADOPT:** `bor.alpha-read-api.v1` validates the S15 fingerprint/authority boundary and serializes GET-only success/unavailable/integrity-failure states.
- Existing `httpRuntime.ts` owns only `/health` and `/version`; it has no research-model dependency or write authority.

### Hypothesis — BOR-S17-H1
A dependency-injected, read-only resolver can wire S16 into `GET /api/alpha/report` while keeping HTTP transport unable to synthesize Evidence, mutate persistence, acquire publication/trading authority, or depend on BOT.

### Experiment — BOR-S17-E1
1. Add an optional synchronous read-only `AlphaReadModelResolver` to runtime composition.
2. Route only `/api/alpha/report` through `getAlphaReadApiResponse`.
3. Preserve the S16 response body without field-level reconstruction/filtering.
4. Test valid canonical model identity/citations/uncertainty, unavailable state, tamper rejection, non-GET rejection and unrelated-route isolation.
5. Re-run typecheck/build/full deterministic tests and inspect the resulting route contract.

### Result
PENDING implementation and CI verification.

### Adopt / Reject gate
ADOPT only if deterministic tests and CI prove exact S16 delegation, fail-closed integrity behavior, unchanged health/version behavior, and fixed no-authority/BOT-independent boundaries. Otherwise REJECT/REVISE without weakening S15/S16.
