# BOR-S24 Deterministic HTML Renderer Research Review

Date: 2026-09-23
Status: EXPERIMENT PENDING

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **BOR-S11-E1:** canonical report artifacts are immutable/versioned and preserve evidence citations and uncertainty.
- **BOR-S12-E1:** `bor.report-export.v1` is the canonical render boundary; presentation must not alter report identity, citations, uncertainty or authority.
- **REPORT_CONSISTENCY_V1 / BOR-S14:** presentation outputs must remain consistent with canonical report state.
- **BOR-S15/16:** canonical Alpha read-model verification is fail-closed and zero-authority.
- **BOR-S22/23:** report versions are immutable and discovery must not mutate canonical artifact bytes.
- S12 deliberately stopped before external rendering; S24 therefore remains a pure deterministic transformation and does not introduce browser/network/provider behavior.

### Hypothesis — BOR-S24-H1
A pure renderer that verifies the S12 export fingerprint, accepts only HTML exports, escapes all report text, and emits deterministic self-contained HTML can provide a safe Alpha presentation artifact without changing evidence lineage, uncertainty, report identity, or authority.

### Experiment — BOR-S24-E1
Implement a renderer that:
1. recomputes and verifies the canonical S12 export fingerprint,
2. requires `format=HTML` and zero authority,
3. HTML-escapes every report-controlled string,
4. renders identity, summary/thesis, Bull/Base/Bear scenarios, citations, unresolved disagreements and data gaps,
5. performs no network/provider/browser calls,
6. returns deterministic UTF-8 HTML plus SHA-256 content fingerprint,
7. rejects tampered exports, PDF inputs and authority escalation,
8. verifies preservation with deterministic tests.

### Safety / production boundary
Repository/local artifact only. No public publication, external renderer, broker credential, order, BOT dependency, Risk bypass, archive mutation, remote assets, or deployment claim.

### Result
PENDING implementation and fresh CI.

### Adopt / Reject
**PENDING — BOR-S24-E1.** Adoption requires passing CI plus direct verification of deterministic bytes, escaped untrusted text, citation/scenario/uncertainty preservation, fingerprint integrity and zero authority.
