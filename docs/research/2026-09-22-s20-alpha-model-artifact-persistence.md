# BOR-S20 Research Review — Canonical Alpha Model Artifact Persistence

Date: 2026-09-22
Status: VERIFIED / ADOPT
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

## Verification result
Exact implementation/docs head e7adf19218b887bb08c0b4a8957d41804f56cb5d passed BLACK ORACLE REPORT CI run #35684260234.

Verified behavior:
- valid model persists and is read back through the real S19 resolver/API gate with 200
- tampered and authority-escalated models are rejected before target creation
- atomic replacement makes the next resolver read observe only the new verified model
- failed replacement cleans temporary artifacts and preserves the existing target directory state
- no provider/network calls, BOT dependency, public publication, execution authority, or Risk bypass

## Adopt / Reject
**ADOPT.** BOR-S20-E1 supports the hypothesis. Atomic persistence is suitable as the BOR-owned handoff between verified model generation and the S19 read-only runtime resolver.

## Authority impact
None. Persistence is local/BOR-owned and does not publish externally or trade.
