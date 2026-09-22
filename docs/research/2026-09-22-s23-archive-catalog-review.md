# BOR-S23 — Verified Archive Catalog Research Review

Date: 2026-09-22
Status: HYPOTHESIS / EXPERIMENT PENDING

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

Malformed/tampered/authority-escalated/identity-mismatched/symlink entries must never appear as valid reports. They remain explicit rejected observations so missing or contradictory archive state is not silently hidden.

## Hypothesis — BOR-S23-H1
A read-only verified catalog can make S22 report history discoverable for future Reports/Library UI without weakening artifact integrity, mutating archive bytes, or creating publication/trading authority.

## Experiment — BOR-S23-E1
Implement the smallest filesystem catalog with deterministic newest-first ordering and rejection accounting. Verify:
- multiple canonical versions are discoverable and metadata comes from verified payload content;
- citation/scenario/disagreement/data-gap counts are preserved;
- tamper/fingerprint failure, authority escalation, archive-ID mismatch, malformed JSON and symlink entries are rejected;
- repeated catalog reads are deterministic and do not mutate archive bytes;
- all returned authority flags remain false.

## Adopt / reject gate
**ADOPT** only if CI passes and actual archive fixtures prove valid-only discovery plus explicit rejection behavior. Otherwise **REJECT** and retain S22 as the terminal archive contract.
