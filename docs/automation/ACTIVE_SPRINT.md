# ACTIVE SPRINT — BOR Alpha v0.1

Date: **2026-09-23**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S25 MERGED / S26 PLAN — PDF BYTE RENDERER**

## Completed baseline
- BOR-S0 through BOR-S25 complete.
- S25 deterministic PDF render manifest merged as PR #33 / `71a8bf1c5f267497aad32da2a9c6f4029bfcb8e0`.
- Foundation runtime boundary remains independent from BOT.

## BOR-S26 objective
Add a deterministic, dependency-free PDF byte renderer over the adopted `bor.pdf-render-manifest.v1` contract so Alpha can produce a locally verifiable PDF artifact without browser, provider, network, publication, trading, or BOT authority.

## Acceptance criteria
- accepts only canonical S25 PDF render manifests and recomputes the S25 manifest fingerprint before rendering
- produces valid deterministic `%PDF-1.4` bytes with a SHA-256 content fingerprint
- preserves report/export identity, title, thesis, Bull/Base/Bear labels, citation evidence IDs, unresolved disagreements and data gaps in the rendered document text
- PDF contains no remote assets, JavaScript, launch actions, embedded files, external URLs, provider/browser/network instructions, or publication side effects
- execution/publication authority remains false and BOT/trading state is unreachable
- tampered manifest, malformed/empty identity and authority escalation fail closed
- deterministic tests cover PDF structure, preservation, repeatability and negative safety cases

## Product / safety boundary
BOR-owned local research/report rendering only. S26 transforms an already-verified S25 inert manifest into inert PDF bytes. It does not publish, upload, browse, fetch remote content, mutate report/archive/BOT state, trade, hold broker credentials, or infer missing evidence. The renderer is intentionally dependency-free and local-only.

## Rollback
If tests, CI, artifact verification, or mergeability regress, do not merge the S26 PR. Revert only S26 renderer/tests/research/control changes. S0–S25 contracts and archive history remain untouched.

## Research review / lineage
Lineage pending review: `BOR-S11-E1 → BOR-S12-E1 → REPORT_CONSISTENCY_V1 → BOR-S15/16 → BOR-S22/23 → BOR-S24-E1 → BOR-S25-E1 → BOR-S26-H1/E1`.
Primary precedents to review before implementation: S12 export integrity, S24 HTML renderer, S25 PDF manifest.

## Verification result
- `BOR-S26-E1 = PENDING`
- no S26 implementation exists at PLAN gate

## Blocker truth
- independent Railway project creation remains blocked by workspace resource limits
- BOR-owned durable production artifact storage is not yet established
- local deterministic PDF bytes do not imply production deployment or public publication

## Exact next gate
RESEARCH REVIEW S12/S24/S25 precedents → record S26 hypothesis/experiment → implement dependency-free PDF byte renderer → tests → direct artifact/citation/data-integrity verification → ADOPT/REJECT → docs-inclusive CI → merge only if green.

## Cycle exit target
- Phase: **PLAN → RESEARCH REVIEW**
- Research: `BOR-S26-E1 = PENDING`
- Single next priority: **review rendering precedents and implement verified local PDF bytes**
