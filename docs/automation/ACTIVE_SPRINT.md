# ACTIVE SPRINT — BOR Alpha v0.1

Date: **2026-09-23**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S23 MERGED / S24 ADOPTED — FINAL MERGE GATE**

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
If final CI or mergeability regresses, do not merge PR #32. Revert only S24 renderer/tests/research/control changes. S0–S23 contracts and archive history remain untouched.

## Research review / lineage
Lineage: `BOR-S11-E1 → BOR-S12-E1 → REPORT_CONSISTENCY_V1 → BOR-S15/16 → BOR-S22/23 → BOR-S24-H1/E1`.
Primary precedent: `docs/research/2026-09-21-s12-export-integrity-review.md` — S12 adopted `bor.report-export.v1` as canonical input to later HTML/PDF rendering while preserving citations, uncertainty, identity and zero authority.
S24 record: `docs/research/2026-09-23-s24-html-renderer-review.md`.

## Verification result
- implementation head `8a5d57253d84ecc9acbbb381f0fed7128bf5394c` passed BLACK ORACLE REPORT CI #114
- deterministic bytes/content fingerprint, escaping, Bull/Base/Bear, citation and contradicting-evidence IDs, unresolved disagreements/data gaps, and zero-authority behavior verified against implementation/tests
- tampered fingerprint, PDF input, authority escalation and empty identity fail closed
- `BOR-S24-E1 = ADOPT` within repository/local-artifact scope

## Blocker truth
- independent Railway project creation remains blocked by workspace resource limits
- BOR-owned durable production artifact storage is not yet established
- S24 does not claim production deployment, public publication or PDF byte rendering

## Exact next gate
Fresh docs-inclusive CI on the adoption/control head → re-check PR #32 mergeability → squash merge only if green. No deployment claim while Railway/durable-storage blockers remain.

## Cycle exit target
- Phase: **VERIFY → DOCUMENT → FINAL CI/MERGE GATE**
- Research: `BOR-S24-E1 = ADOPT`
- Single next priority: **green docs-inclusive CI and safe merge of PR #32**
