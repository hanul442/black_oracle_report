# ACTIVE SPRINT — BOR Alpha v0.1

Date: **2026-09-23**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S24 MERGED / S25 ADOPTED — FINAL MERGE GATE**

## Completed baseline
- BOR-S0 through BOR-S24 complete.
- S24 deterministic verified HTML renderer merged as PR #32 / `2099603de86f50a367226a6a7229f76b149ea248`.
- Foundation runtime boundary remains independent from BOT.

## BOR-S25 objective
Add a deterministic, fail-closed PDF export preparation contract over canonical `bor.report-export.v1` PDF artifacts. Alpha must be able to produce a renderer-neutral, citation-complete PDF render manifest before any external PDF engine is introduced.

## Acceptance criteria
- accepts only canonical `format=PDF` S12 export artifacts
- recomputes and verifies the S12 export fingerprint before manifest construction
- preserves report/export identity, thesis, Bull/Base/Bear scenarios, citations, contradicting evidence, unresolved disagreements and data gaps
- produces deterministic renderer-neutral manifest bytes plus SHA-256 content fingerprint
- manifest contains no remote assets, scripts, URLs, provider/browser/network instructions or publication side effects
- execution/publication authority remains false and BOT/trading state is unreachable
- HTML input, tampered export, malformed/empty identity and authority escalation fail closed
- deterministic tests cover preservation, repeatability and negative safety cases

## Product / safety boundary
BOR-owned internal research/report export preparation only. S25 converts an already-canonical S12 PDF export into an inert local render manifest. It does not invoke Chromium, wkhtmltopdf, a provider, browser or network; does not publish; does not mutate report/archive/BOT state; cannot trade; cannot hold broker credentials; and cannot infer missing evidence.

## Rollback
If final CI or mergeability regresses, do not merge PR #33. Revert only S25 manifest/tests/research/control changes. S0–S24 contracts and archive history remain untouched.

## Research review / lineage
Lineage: `BOR-S11-E1 → BOR-S12-E1 → REPORT_CONSISTENCY_V1 → BOR-S15/16 → BOR-S22/23 → BOR-S24-E1 → BOR-S25-H1/E1`.
Primary precedents: `docs/research/2026-09-21-s12-export-integrity-review.md` and `docs/research/2026-09-23-s24-html-renderer-review.md`.
S25 record: `docs/research/2026-09-23-s25-pdf-manifest-review.md`.

## Verification result
- implementation head `111c13b7254e3014785f3e506dd2bc6adcee414c` passed BLACK ORACLE REPORT CI #119
- direct implementation/test review verified export-fingerprint recomputation, deterministic manifest bytes/content fingerprint, canonical identity/thesis/Bull-Base-Bear/citation/contradicting-evidence/disagreement/data-gap preservation, and zero-authority behavior
- tampered fingerprint, HTML input, authority escalation and empty identity fail closed
- `BOR-S25-E1 = ADOPT` within repository/local-artifact scope

## Blocker truth
- independent Railway project creation remains blocked by workspace resource limits
- BOR-owned durable production artifact storage is not yet established
- S25 does not claim production deployment, public publication or final PDF byte rendering

## Exact next gate
Fresh docs-inclusive CI on the adoption/control head → re-check PR #33 mergeability → squash merge only if green. No deployment claim while Railway/durable-storage blockers remain.

## Cycle exit target
- Phase: **VERIFY → DOCUMENT → FINAL CI/MERGE GATE**
- Research: `BOR-S25-E1 = ADOPT`
- Single next priority: **green docs-inclusive CI and safe merge of PR #33**
