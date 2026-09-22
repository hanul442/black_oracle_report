# ACTIVE SPRINT — BOR Alpha v0.1

Date: **2026-09-23**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S23 MERGED / S24 PLANNED — IMPLEMENTATION GATE**

## Completed baseline
- BOR-S0 through BOR-S23 complete.
- S23 verified read-only archive catalog merged as PR #31 / `0d0ac230abe7cd4ee59fa76341407905b474a819`.
- Foundation runtime boundary remains independent from BOT.

## BOR-S24 objective
Add a deterministic, self-contained HTML renderer for canonical `bor.report-export.v1` artifacts so Alpha reports have a verifiable presentation artifact before later PDF byte rendering.

## Acceptance criteria
- renderer accepts only `format=HTML` canonical export artifacts
- export fingerprint is recomputed and verified before rendering
- rendered HTML preserves report/export identity, thesis, Bull/Base/Bear scenarios, citations, unresolved disagreements and data gaps
- all untrusted report text is HTML-escaped
- output is deterministic and has a content SHA-256 fingerprint
- renderer has no network/provider calls and no external publication or trading authority
- tampered export, PDF input, malformed/empty identity and authority escalation fail closed
- deterministic tests cover positive preservation and negative safety cases

## Product / safety boundary
BOR-owned internal research/report rendering only. S24 transforms an already-canonical S12 export into inert HTML bytes. It cannot publish externally, trade, mutate archives/BOT state, infer missing evidence, fetch remote content, grant authority, or hold broker credentials.

## Rollback
If implementation or CI regresses, do not merge the S24 PR. Revert only S24 renderer/tests/research/control changes. S0–S23 contracts and archive history remain untouched.

## Research review / lineage
Required lineage: `BOR-S11-E1 → BOR-S12-E1 → REPORT_CONSISTENCY_V1 → BOR-S15/16 → BOR-S22/23 → BOR-S24-H1/E1`.
Primary precedent: `docs/research/2026-09-21-s12-export-integrity-review.md` — S12 explicitly adopted `bor.report-export.v1` as canonical input to later HTML/PDF rendering while preserving citations, uncertainty, identity and zero authority.
S24 research/adoption record: `docs/research/2026-09-23-s24-html-renderer-review.md`.

## Blocker truth
- independent Railway project creation remains blocked by workspace resource limits
- BOR-owned durable production artifact storage is not yet established
- S24 repository work does not claim production deployment, public publication or PDF rendering

## Exact next gate
Record S24 research review → implement renderer/tests → fresh CI → verify actual HTML artifact semantics/fingerprint/citation/scenario/uncertainty/no-authority → ADOPT/REJECT → docs-inclusive final CI → merge only if green.

## Cycle exit target
- Phase: **PLAN → RESEARCH REVIEW → IMPLEMENT**
- Research: `BOR-S24-E1 = PENDING`
- Single next priority: **deterministic zero-authority HTML renderer over S12 export artifacts**
