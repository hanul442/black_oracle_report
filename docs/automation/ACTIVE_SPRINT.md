# ACTIVE SPRINT — BOR Alpha v0.1

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S22 MERGED / S23 IMPLEMENTED — CI VERIFICATION GATE**

## Completed baseline
- BOR-S0 through BOR-S22 complete.
- S22 immutable/versioned report archive merged as PR #30 / `27bbb55b808405770c7558d0f91aac0bfd0f9a7e`.
- Foundation runtime boundary remains merged; repository CI/build contracts are independent from BOT.

## BOR-S23 objective
Add a deterministic, read-only catalog over BOR-owned versioned report archives so Reports/Library surfaces can discover archived artifacts without mutating them or weakening canonical integrity.

## Acceptance criteria
- enumerate only safe archive entries rooted beneath an explicit BOR archive root
- parse each candidate as JSON and accept only artifacts that pass the existing canonical Alpha model integrity/no-authority gate
- derive catalog metadata from verified artifact content and require recomputed S22 archive identity to match the filename
- expose deterministic newest-first metadata sufficient for Reports/Library: projection/report/series/version/asOf/fingerprint, citation/scenario/disagreement/data-gap counts
- reject malformed, tampered, authority-escalated, identity-mismatched, symlinked or unsafe entries explicitly; never present them as valid reports
- catalog operation is read-only and deterministic; no artifact rewrite, publication, network/provider call, broker credential, BOT state/database/runtime dependency, Risk bypass, execution or publication authority
- preserve missing/contradictory evidence as counts/metadata rather than repairing or suppressing it

## Product / safety boundary
BOR-owned internal research/report discovery only. S23 may read already-archived canonical artifacts and return metadata. It cannot publish externally, trade, alter archive bytes, infer missing evidence, mutate BOT state, or borrow BOT/PAPER storage/runtime/credentials.

## Rollback
If S23 regresses integrity or CI, do not merge PR #31. Revert only the archive-catalog module/tests/research/control-document changes. S22 append-only archive artifacts and S0–S22 contracts remain untouched; rollback never deletes archive history.

## Research review / lineage
`REPORT_CONSISTENCY_V1 → BOR-S15 → BOR-S16 → BOR-S19 → BOR-S20 → BOR-S21 → BOR-S22 → BOR-S23-H1/E1`.
S23-H1: a read-only catalog can make versioned BOR reports discoverable while treating archive bytes as untrusted until canonical integrity/no-authority verification succeeds.
Research review recorded in `docs/research/2026-09-22-s23-archive-catalog-review.md`.

## Implementation / test state
- added `alphaReadModelArchiveCatalog.ts`: safe-name filter, regular-file/symlink control, JSON parse gate, S16 integrity/no-authority gate, recomputed S22 archive-ID match, deterministic newest-first metadata
- added deterministic tests for valid multi-version ordering, citation/scenario/disagreement/data-gap metadata, byte immutability/repeatability, malformed JSON, tamper/fingerprint failure, authority escalation, identity mismatch, unsafe names and symlinks
- PR #31 opened from current S22 `main`; implementation head before this control update: `aa012a143a95573a6b7ce0742b838d74d7b76cca`
- fresh CI had not yet materialized at the first post-PR check; `BOR-S23-E1 = PENDING`

## Blocker truth
- independent Railway project creation remains blocked by the connected workspace free-plan resource provision limit
- BOR-owned durable production artifact storage is not yet established
- an unmounted Railway filesystem is not canonical persistence
- S23 repository work does not claim production durability or deployment

## Exact next gate
Fresh PR #31 CI → inspect failures if any → verify actual catalog fixtures and no-authority behavior → record `BOR-S23-E1` ADOPT/REJECT → docs-inclusive final CI → merge only if green and mergeable. No deployment is claimed while independent runtime/storage provisioning remains blocked.

## Cycle exit target
- Phase: **TEST → VERIFY**
- Research: `BOR-S23-E1 = PENDING`
- Single next priority: **fresh PR #31 CI and verified catalog adoption decision**
