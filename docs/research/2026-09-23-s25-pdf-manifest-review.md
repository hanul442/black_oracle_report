# BOR-S25 Deterministic PDF Render Manifest Research Review

Date: 2026-09-23
Status: PENDING

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **BOR-S11-E1:** canonical report artifacts are immutable/versioned and preserve citations and uncertainty.
- **BOR-S12-E1:** `bor.report-export.v1` is the canonical render boundary; PDF/HTML format identity is explicit and authority remains false.
- **REPORT_CONSISTENCY_V1 / BOR-S14:** presentation derivatives cannot silently alter canonical report state.
- **BOR-S15/16:** canonical verification is fail-closed and zero-authority.
- **BOR-S22/23:** report archive versions remain immutable through discovery.
- **BOR-S24-E1:** deterministic HTML rendering can preserve scenarios, citations and uncertainty without browser/network/publication authority.

### Hypothesis — BOR-S25-H1
A deterministic renderer-neutral manifest derived only from a fingerprint-valid PDF export can make the PDF path mechanically verifiable while keeping external rendering, publication, network and trading authority outside BOR Alpha.

### Experiment — BOR-S25-E1
Implement `bor.pdf-render-manifest.v1` that:
1. recomputes and verifies the canonical S12 export fingerprint,
2. requires `format=PDF` and zero authority,
3. copies canonical identity/research semantics without inference,
4. emits deterministic JSON bytes and SHA-256 content fingerprint,
5. includes no URL, script, remote asset, provider/browser/network instruction or side effect,
6. rejects HTML input, tamper, empty identity and authority escalation,
7. verifies repeatability and citation/scenario/uncertainty preservation in deterministic tests.

### Safety / production boundary
Repository/local artifact only. The experiment does not produce final PDF bytes, invoke an external renderer, publish, trade, mutate BOT/archive state, fetch remote content, hold broker credentials or bypass Risk.

### Result
PENDING fresh CI and artifact verification.

### Adopt / Reject
PENDING — do not adopt until CI and direct artifact semantics/fingerprint/no-authority verification pass.
