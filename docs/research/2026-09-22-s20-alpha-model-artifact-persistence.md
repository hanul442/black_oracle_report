# BOR-S20 Research Review — Canonical Alpha Model Artifact Persistence

Date: 2026-09-22
Status: IMPLEMENTED / CI PENDING
Hypothesis: BOR-S20-H1
Experiment: BOR-S20-E1

## Question
Can BOR persist a verified Alpha read model for the S19 runtime resolver without exposing readers to partial JSON or creating publication/trading authority?

## Hypothesis
A same-filesystem atomic replace sink that accepts only S16-valid Alpha read models can provide a canonical runtime artifact while keeping persistence separate from research generation and public publication.

## Implementation
- validate with existing isValidAlphaReadModel before any write
- require explicit target path
- serialize one complete canonical model
- write a mode-0600 temporary file in the target directory
- fsync the temporary file before rename
- atomically rename over the target
- best-effort temporary cleanup on write/rename failure
- expose a configured helper using the same BOR_ALPHA_READ_MODEL_PATH consumed by S19
- no provider calls, BOT dependency, public publication, or trading authority

## Success criteria
1. valid model persists and S19 resolver returns 200 for the exact model
2. tampered/authority-escalated model is rejected before target creation
3. replacement makes the next resolver read see only the new verified model
4. failed replacement cleans temp artifacts and preserves prior target state
5. full BLACK ORACLE REPORT CI passes

## Result
PENDING exact-head CI.

## Adopt / Reject
PENDING.

## Authority impact
None. Persistence is local/BOR-owned and does not publish externally or trade.
