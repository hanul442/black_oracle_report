# BOR Evidence Store Boundary

Status: **BOR-S3 Alpha contract**

## Purpose

The Evidence Store persists canonical `bor.evidence.v1` packets without granting any producer, agent, report or downstream consumer mutation authority over historical Evidence.

## Contract

```text
Canonical Evidence packet
        ↓ append
EvidenceStore
 ├─ getById(evidenceId)
 └─ findByFingerprint(contentFingerprint)
```

There is deliberately no update/delete API.

### Identity semantics

- `evidenceId` is immutable identity.
- Exact re-append is idempotent.
- Reusing an `evidenceId` with a different packet fails closed as `EVIDENCE_ID_CONFLICT`.
- A fingerprint can map to multiple Evidence observations; duplicate observations remain queryable and may carry `duplicateOfEvidenceId` lineage.
- `publishedAt` and `observedAt` are source/observation facts from the canonical packet and are never replaced by persistence time.

### Replay semantics

The store preserves packet identity needed for later report reconstruction and Decision/Evidence replay. A concrete database adapter must preserve the same append-only behavior and deterministic lookup semantics.

## Authority boundary

Accepted packets must remain:

- `schemaVersion = bor.evidence.v1`
- `producer = BLACK_ORACLE_REPORT`
- `executionAuthority = false`

The Evidence Store contains no broker credentials, order API, portfolio mutation, BOT runtime dependency or trading authority.

## S3 implementation boundary

`InMemoryEvidenceStore` is a deterministic reference implementation used to prove the port semantics. It is not the Alpha production database. BOR-S4 may bind this port to an independent database only after schema ownership, rollback and append-only constraints are documented and tested.

## Research lineage

- **DI-001** → explicit schema/producer identity remains persisted.
- **DI-003** → point-in-time publication/observation semantics remain immutable.
- **DI-004** → deterministic immutable lookup is the prerequisite for snapshot-addressable replay.

This is infrastructure adoption, not a claim that any agent/Council architecture has been validated.
