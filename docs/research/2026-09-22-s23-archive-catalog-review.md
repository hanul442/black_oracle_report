# BOR-S23 — Verified Archive Catalog Research Review

Date: 2026-09-23
Status: ADOPTED

## Research lineage
`REPORT_CONSISTENCY_V1 → BOR-S15 → BOR-S16 → BOR-S19 → BOR-S20 → BOR-S21 → BOR-S22 → BOR-S23-H1/E1`

## Reviewed precedents
- **S15 canonical Alpha read model**: report/export consistency is projected into one deterministic no-authority model with a content fingerprint.
- **S16 Alpha read integrity gate**: consumers must reject schema/fingerprint mismatch and any execution, publication, or BOT-dependency authority.
- **S20/S21 persistence handoff**: persistence is downstream of canonical verification; storage must not become a repair or policy layer.
- **S22 immutable archive**: archive identity is SHA-256 over projection/report/series/version/content fingerprint; exact replay is idempotent and conflicting bytes fail closed.

## Research constraint
A filesystem filename is not evidence that an artifact is canonical. Catalog discovery therefore treats every directory entry and every JSON payload as untrusted input. A valid catalog entry requires all of:
1. regular non-symlink `.json` file under the explicit archive root;
2. parseable JSON;
3. S16 canonical integrity/no-authority validation;
4. recomputed S22 archive identity matching the filename.

Malformed/tampered/authority-escalated/identity-mismatched/symlink entries never appear as valid reports. They remain explicit rejected observations so missing or contradictory archive state is not silently hidden.

## Hypothesis — BOR-S23-H1
A read-only verified catalog can make S22 report history discoverable for future Reports/Library UI without weakening artifact integrity, mutating archive bytes, or creating publication/trading authority.

## Experiment — BOR-S23-E1
Implemented the smallest filesystem catalog with deterministic newest-first ordering and rejection accounting. Verification covers:
- multiple canonical versions discoverable with metadata derived from verified payload content;
- citation/scenario/disagreement/data-gap counts preserved;
- tamper/fingerprint failure, authority escalation, archive-ID mismatch, malformed JSON and symlink entries rejected;
- repeated catalog reads deterministic and archive bytes unchanged;
- all returned authority flags false.

## Result
**ADOPT.** PR #31 head `2b496870d7fa4da1995b7dc7e318ee05f7817463` passed BLACK ORACLE REPORT CI #110. Deterministic fixtures exercise valid multi-version discovery and explicit rejection classes. Catalog reads do not mutate archive bytes, and the existing S16 integrity/no-authority gate remains authoritative.

This adoption is repository/local-artifact scope only. Independent Railway runtime capacity and BOR-owned durable production storage remain blocked, so S23 does not claim deployed durability or production availability.
