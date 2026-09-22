# BOR-S19 Research Review — Read-only Alpha Model Resolver

Date: 2026-09-22
Status: IMPLEMENTED / CI PENDING
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

## Success criteria
1. valid integrity-verifiable artifact -> 200
2. missing/unconfigured -> 404
3. malformed/tampered -> 409
4. no write/network/BOT dependency
5. execution/publication authority remain false
6. full BLACK ORACLE REPORT CI passes

## Result
PENDING exact-head CI.

## Adopt / Reject
PENDING.

## Authority impact
None. Resolver is read-only and cannot publish or trade.
