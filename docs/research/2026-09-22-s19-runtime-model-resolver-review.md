# BOR-S19 Runtime Alpha Model Resolver Research Review

Date: 2026-09-22
Status: EXPERIMENT PENDING

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **DI-001:** downstream artifacts require explicit schema, stable identity, and version identity.
- **DI-003:** downstream consumers may not expand or silently rewrite point-in-time knowledge state.
- **DI-004:** canonical Evidence IDs remain citation lineage across transformations.
- **AIML-005:** unsupported/invented citations must remain mechanically detectable.
- **AIML-006:** disagreement, contradictory evidence, and uncertainty survive presentation transformations.
- **BOR-S11-E1:** report artifacts are immutable/versioned/fingerprinted and citation integrity is checked before archive.
- **BOR-S12–S14:** export and consistency gates preserve report identity and fail closed on divergence.
- **BOR-S15-E1:** `bor.alpha-read-model.v1` is the adopted deterministic read-only consumer boundary; it independently verifies parent consistency and fixes execution/publication/BOT authority to false.
- **BOR-S16–S18:** API, HTTP runtime, and HTML consumer surfaces preserve that integrity gate and explicit unavailable/tampered states.

### Hypothesis — BOR-S19-H1
A production resolver that reads only an explicitly configured BOR-owned canonical Alpha model artifact, validates the complete S15 fingerprint/authority contract before returning it, and otherwise fails closed can make the started BOR runtime useful without creating hidden state, fixture fallbacks, or BOT infrastructure coupling.

### Experiment — BOR-S19-E1
Implement a read-only file-backed `AlphaReadModelResolver` using an explicit BOR environment path. Parse JSON without mutation, validate with `isValidAlphaReadModel`, return the verified immutable model when valid, return unavailable when no path/file exists, and fail closed on malformed/tampered/authority-escalated artifacts. Wire it into `src/start.ts`; add deterministic tests for valid, absent, malformed/tampered, and repeated/restart-style reads.

### Production boundary
BOR-owned read-only artifact only. No fixture/demo fallback, Evidence repair/synthesis, database writes, provider calls, BOT database/runtime dependency, broker credentials, orders, Risk bypass, trading authority, or report-publication authority.

### Result
PENDING implementation and CI.

### Adopt / Reject
PENDING.
