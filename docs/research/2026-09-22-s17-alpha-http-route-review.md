# BOR-S17 Alpha HTTP Route Research Review

Date: 2026-09-22
Status: ADOPT

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **DI-001:** downstream transports require explicit versioned contracts and stable parent identity.
- **DI-003:** consumers may not expand or silently rewrite point-in-time knowledge state.
- **DI-004:** canonical Evidence IDs remain citation lineage across transformations.
- **AIML-005/006:** uncertainty, disagreement and contradictory evidence remain first-class; downstream presentation cannot collapse them into unsupported certainty.
- **BOR-S15-E1 ADOPT:** `bor.alpha-read-model.v1` is the canonical integrity-gated consumer projection.
- **BOR-S16-E1 ADOPT:** `bor.alpha-read-api.v1` validates the S15 fingerprint/authority boundary and serializes GET-only success/unavailable/integrity-failure states.
- Existing `httpRuntime.ts` owned only `/health` and `/version`; it had no research-model dependency or write authority before S17.

### Hypothesis — BOR-S17-H1
A dependency-injected, read-only resolver can wire S16 into `GET /api/alpha/report` while keeping HTTP transport unable to synthesize Evidence, mutate persistence, acquire publication/trading authority, or depend on BOT.

### Experiment — BOR-S17-E1
1. Add an optional synchronous read-only `AlphaReadModelResolver` to runtime composition.
2. Route only `/api/alpha/report` through `getAlphaReadApiResponse`.
3. Preserve the S16 response body without field-level reconstruction/filtering.
4. Test valid canonical model identity/citations/uncertainty, unavailable state, tamper rejection, non-GET rejection and unrelated-route isolation.
5. Re-run typecheck/build/full deterministic tests and inspect the resulting route contract.

### Result
**PASS.** PR #22 implementation head `bb8558a8e5bd6168b64a374e652cc54ae5dd958f` completed BLACK ORACLE REPORT CI #75 successfully. Manual contract verification confirms the runtime delegates `/api/alpha/report` to S16 without field-level reconstruction; the resolver is invoked only for GET; missing/tampered state remains explicit fail-closed S16 output; `/health` and `/version` remain isolated. No persistence/provider/trading/publication/BOT authority was added.

### Adopt / Reject
**BOR-S17-E1 = ADOPT.** The experiment satisfies the frozen-Alpha transport boundary. Merge remains gated on a docs-inclusive final CI for the post-result head; any later contract widening requires a new hypothesis/experiment rather than weakening S15/S16/S17.
