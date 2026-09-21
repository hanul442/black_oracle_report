# BOR Collector Ingestion Contract v1

Status: ALPHA CONTRACT  
Schema versions: `bor.collector-envelope.v1`, `bor.collector-cycle.v1`  
Upstream contract: `bor.source-record.v1`  
Downstream contract: `bor.evidence.v1`

## Purpose

Provide one bounded entry path from NARS/external collectors into canonical BOR Evidence while preserving partial failures, replay identity and BOR's no-trading-authority boundary.

## Canonical flow

`CollectorEnvelope → adaptCollectorEnvelope → SourceRecord → SourceEvidenceIngestor → EvidenceStore`

Collectors never call `EvidenceStore.append` directly.

## Collector envelope

Each envelope carries:
- collector identity/version and origin (`NARS | EXTERNAL`),
- source identity/version and publisher,
- retrieval URI and optional snapshot reference,
- `publishedAt` and `observedAt`,
- canonical content,
- explicit `RESOLVED | UNRESOLVED` asset state.

The adapter derives `retrievedBy = collectorId@collectorVersion` and does not rewrite publication/observation time.

## Cycle semantics

Each cycle has deterministic cycle/item identities and returns:
- item: `APPENDED | ALREADY_PRESENT | REJECTED`,
- cycle: `COMPLETE | PARTIAL | FAILED | EMPTY`,
- attempted/appended/already-present/rejected counts.

A partial cycle is never represented as healthy COMPLETE state. Rejected items retain a deterministic item identity plus explicit error code.

## Evidence integrity

Accepted items pass through BOR-S5, which:
- validates point-in-time ordering,
- derives deterministic Evidence identity,
- calculates SHA-256 canonical-content fingerprint,
- preserves unresolved assets,
- preserves duplicate content with `duplicateOfEvidenceId`,
- persists through append-only `EvidenceStore`.

Collection therefore does not itself confer Evidence trust.

## Authority boundary

Every collector cycle fixes:
- `executionAuthority=false`,
- `reportPublicationAuthority=false`.

Collector code has no broker/order/portfolio/Risk authority, no BOT database dependency, and no historical Evidence update/delete operation.

## Runtime boundary

v1 is deliberately network- and scheduler-agnostic. Provider fetchers, production credentials, independent BOR database provisioning and scheduling are separate infrastructure gates. This keeps transport failures from silently becoming domain authority.

## Rollback

Revert the S6 code path or stop invoking the collector cycle. Existing S0-S5 Evidence remains append-only and untouched.
