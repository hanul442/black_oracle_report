# BOR-S19 Research Review — Read-only Alpha Model Resolver

Date: 2026-09-22
Status: VERIFIED / ADOPT
Hypothesis: BOR-S19-H1
Experiment: BOR-S19-E1

## Question
Can the started BOR runtime consume a real canonical Alpha read-model artifact without creating a second research projection, write path, BOT dependency, publication authority, or trading authority?

## Hypothesis
An explicit read-only file resolver can bridge the S15–S18 verified read model into the runtime while leaving the existing S16 fingerprint/integrity gate as the final authority.

## Implementation
- optional `BOR_ALPHA_READ_MODEL_PATH`
- path is resolved once; artifact is read-only and reread on request
- unconfigured/missing artifact returns no model and preserves 404
- malformed/read-failed configured artifact is represented only as invalid input to the existing S16 gate and preserves 409
- valid file is not trusted merely because it was read successfully; S16 content fingerprint and no-authority checks remain mandatory
- `src/start.ts` injects this resolver into the HTTP runtime
- no file writes, provider calls, BOT database access, or demo fallback

## Verification result
Exact implementation/test head `1a52fdf7c2df3b4f3dca6b917772d3a03f8e0c52` passed BLACK ORACLE REPORT CI run #35683774043.

Verified cases:
- valid integrity-verifiable artifact -> 200
- missing/unconfigured path -> 404 ALPHA_READ_MODEL_UNAVAILABLE
- tampered fingerprint -> 409 ALPHA_READ_MODEL_INTEGRITY_FAILURE
- malformed JSON -> 409 ALPHA_READ_MODEL_INTEGRITY_FAILURE
- authority-escalated artifact -> 409 ALPHA_READ_MODEL_INTEGRITY_FAILURE
- resolver re-reads the artifact and does not retain a stale valid copy after on-disk mutation
- no file writes, provider calls, BOT dependency, publication authority, or trading authority

A competing automated S19 implementation in PR #24 was reviewed and closed as superseded because it converted malformed/tampered artifacts to `undefined`, collapsing integrity failure into the same 404 state as a missing artifact. S19 preserves the S18 404-versus-409 semantic boundary.

## Adopt / Reject
**ADOPT.** BOR-S19-E1 supports the hypothesis. A read-only artifact source can make the started runtime consume real canonical state while S16 remains the final integrity and authority gate.

## Authority impact
None. Resolver is read-only and cannot publish or trade.
