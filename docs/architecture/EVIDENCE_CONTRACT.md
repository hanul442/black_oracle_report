# Canonical Evidence Contract — v1

Status: **Alpha contract candidate**  
Schema: `bor.evidence.v1`

## Purpose

BOR Evidence is a replayable statement of **what source content was observed, when it was knowable, how it was retrieved, and what asset mapping was or was not resolved**. It is not a trading signal and carries no execution authority.

## Point-in-time semantics

- `publishedAt`: source-declared publication/event availability time.
- `observedAt`: time BOR actually observed the content.
- `publishedAt <= observedAt <= processing now` is required at creation.
- Later corrections create new Evidence; historical Evidence is not rewritten.

This implements the DI-003 requirement that event/publication time and information-availability/observation time remain distinct.

## Identity and replay

- `sourceId` identifies the canonical producer/source family.
- `sourceVersion` identifies the ingestion/source contract version.
- `retrievalUri` records retrieval origin.
- `snapshotRef`, when available and legally retainable, points to immutable source material for replay/audit.
- `contentFingerprint` is SHA-256 of the canonical content identity.

This follows DI-001/DI-004: versions and replay references are explicit rather than inferred from final report prose.

## Asset resolution

Asset mapping is a discriminated state:
- `RESOLVED` carries a canonical asset ID.
- `UNRESOLVED` carries the original query and reason.

BOR must not invent a mapping merely to keep a pipeline moving.

## Duplicate lineage

Equal content fingerprints indicate equal canonical content identity, but observations are not silently discarded. A duplicate observation can retain its own Evidence ID and explicitly point to `duplicateOfEvidenceId`.

## Staleness

Staleness is evaluated relative to a caller-supplied clock and max age. It never mutates Evidence. This permits a historical report to replay the evidence state it actually used while current consumers can independently reject stale material.

## Authority boundary

Every packet is produced as:

```text
producer = BLACK_ORACLE_REPORT
executionAuthority = false
```

No Evidence packet can submit orders, mutate a portfolio, hold broker credentials or bypass BOT Risk.

## Next boundary

BOR-S3 will define the Evidence Store port and append-only persistence semantics around this contract. NARS and agents remain downstream and are not imported into the contract layer.
