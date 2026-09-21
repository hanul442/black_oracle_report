# BOR-S16 Alpha Read API Research Review

Date: 2026-09-22
Status: ADOPT

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **DI-001:** downstream artifacts/transports require explicit schema and stable parent identity/version.
- **DI-003:** consumers may not expand or silently rewrite the point-in-time knowledge state.
- **DI-004:** canonical Evidence IDs remain citation lineage across transformations.
- **AIML-005:** unsupported/invented citations must remain mechanically detectable.
- **AIML-006:** disagreement, contradictory evidence, abstention and uncertainty survive presentation transformations.
- **BOR-S11-E1–S14-E1:** report/export artifacts are fingerprinted, versioned and consistency-gated.
- **BOR-S15-E1:** `bor.alpha-read-model.v1` is the sole integrity-gated consumer projection and independently revalidates its report/export parents.

### Hypothesis — BOR-S16-H1
A deterministic GET-only transport envelope that verifies the S15 projection fingerprint before serialization can expose canonical Alpha research state to UI consumers without creating a second synthesis path, suppressing uncertainty, or acquiring trading/publication authority.

### Experiment — BOR-S16-E1
Implement `bor.alpha-read-api.v1` over `AlphaReadModel`: recompute and verify the projection fingerprint, preserve the canonical projection unchanged, fail closed on tampering/authority escalation/unsupported methods, and represent missing state explicitly as unavailable rather than manufacturing an empty report.

### Production boundary
Read-only transport/presentation only. No provider calls, broker credentials, orders, BOT dependency, Risk bypass, evidence repair/synthesis, public publication, database mutation, or deployment mutation.

### Result
Implemented the deterministic GET-only `bor.alpha-read-api.v1` envelope. The transport recomputes the S15 projection fingerprint before returning state, rejects schema/fingerprint/authority violations with an explicit integrity failure, returns an explicit unavailable response when no canonical model exists, and rejects non-GET methods. CI #68 completed successfully: typecheck, build, full deterministic test suite, and independent Railway runtime-config verification all passed. Manual contract review confirmed the successful response embeds the canonical S15 model unchanged and does not create Evidence, suppress uncertainty, or acquire execution/publication/BOT authority.

### Adopt / Reject
**ADOPT — BOR-S16-E1.** The read API boundary is suitable as the frozen-Alpha transport contract for later UI consumers, subject to the S15 merge dependency and the existing independent Railway capacity blocker.
