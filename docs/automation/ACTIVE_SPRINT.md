# ACTIVE SPRINT — BOR Alpha v0.1

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S22 MERGED / S23 PLAN — VERIFIED ARCHIVE CATALOG**

## Completed baseline
- BOR-S0 through BOR-S22 complete.
- S22 immutable/versioned report archive merged as PR #30 / `27bbb55b808405770c7558d0f91aac0bfd0f9a7e`.
- Foundation runtime boundary remains merged; repository CI/build contracts are independent from BOT.

## BOR-S23 objective
Add a deterministic, read-only catalog over BOR-owned versioned report archives so Reports/Library surfaces can discover archived artifacts without mutating them or weakening canonical integrity.

## Acceptance criteria
- enumerate only safe archive entries rooted beneath an explicit BOR archive root
- parse each candidate as JSON and accept only artifacts that pass the existing canonical Alpha model integrity/no-authority gate
- derive catalog metadata from verified artifact content, never from untrusted filename claims alone
- expose deterministic newest-first metadata sufficient for Reports/Library: projection/report/version/fingerprint, generated/observed time, citation count, scenario count, disagreement/data-gap counts
- skip/reject malformed, tampered, symlinked or unsafe entries explicitly; do not silently present them as valid reports
- catalog operation is read-only and deterministic; no artifact rewrite, publication, network/provider call, broker credential, BOT state/database/runtime dependency, Risk bypass, execution or publication authority
- preserve missing/contradictory evidence as counts/metadata rather than repairing or suppressing it

## Product / safety boundary
BOR-owned internal research/report discovery only. S23 may read already-archived canonical artifacts and return metadata. It cannot publish externally, trade, alter archive bytes, infer missing evidence, mutate BOT state, or borrow BOT/PAPER storage/runtime/credentials.

## Rollback
If S23 regresses integrity or CI, do not merge its PR. Revert only the archive-catalog module/tests/research/control-document changes. S22 append-only archive artifacts and S0–S22 contracts remain untouched; rollback never deletes archive history.

## Research review / lineage
Required before implementation: `REPORT_CONSISTENCY_V1 → BOR-S15 → BOR-S16 → BOR-S19 → BOR-S20 → BOR-S21 → BOR-S22 → BOR-S23-H1/E1`.
S23-H1: a read-only catalog can make versioned BOR reports discoverable while treating archive bytes as untrusted until canonical integrity/no-authority verification succeeds.
Experiment `BOR-S23-E1` starts PENDING and must test valid multi-version ordering plus malformed/tampered/authority-escalated/symlinked archive controls.

## Blocker truth
- independent Railway project creation remains blocked by the connected workspace free-plan resource provision limit
- BOR-owned durable production artifact storage is not yet established
- an unmounted Railway filesystem is not canonical persistence
- S23 repository work must not claim production durability or deployment

## Exact next gate
Read S22 archive implementation and relevant report-consistency/integrity research → record S23 research constraints → implement the smallest read-only catalog → deterministic tests → verify actual artifact metadata/citation/scenario/uncertainty/fingerprint/no-authority behavior → document result → PR/merge only on green CI.

## Cycle exit target
- Phase: **PLAN → RESEARCH REVIEW**
- Research: `BOR-S23-E1 = PENDING`
- Single next priority: **verified archive catalog implementation and deterministic integrity tests**
