# BOR-S15 Alpha Consumer Read Model Research Review

Date: 2026-09-21
Status: EXPERIMENT

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **DI-001:** downstream artifacts require explicit schema, stable parent identity, and version identity.
- **DI-003:** downstream consumers may not expand or silently rewrite the point-in-time knowledge state.
- **DI-004:** canonical Evidence IDs remain citation lineage across transformations.
- **AIML-005:** unsupported/invented citations must remain mechanically detectable.
- **AIML-006:** disagreement, abstention, contradictory evidence, and uncertainty survive presentation transformations.
- **BOR-S8-E1 through S10-E1:** Evidence → analyst/council → thesis/scenario contracts establish verified lineage and explicit uncertainty.
- **BOR-S11-E1:** canonical report artifacts are immutable/versioned and fingerprinted.
- **BOR-S12-E1:** export artifacts preserve report identity, citations, scenarios, and uncertainty.
- **BOR-S13-E1:** repository deployability is adopted while isolated live Railway provisioning remains HOLD.
- **BOR-S14-E1:** report/export pairs become consumer-safe only after deterministic fail-closed consistency verification.

### Hypothesis — BOR-S15-H1
A deterministic read-only projection that requires a S14 PASS can provide one safe Alpha UI/API consumption contract without allowing presentation code to reconstruct evidence, suppress uncertainty, or acquire trading/publication authority.

### Experiment — BOR-S15-E1
Implement `bor.alpha-read-model.v1` derived only from a canonical report/export pair and its S14 consistency result. Preserve parent identity/fingerprints, citation IDs, scenarios/counterevidence, disagreements and data gaps; compute a deterministic projection fingerprint; reject failed/mismatched/tampered parents and authority escalation.

### Production boundary
Read-only projection only. No evidence synthesis/repair, provider calls, broker credentials, orders, BOT dependency, Risk bypass, public publication, database mutation, or deployment mutation.

### Result
PENDING implementation/test/CI.

### Adopt / Reject
PENDING.
