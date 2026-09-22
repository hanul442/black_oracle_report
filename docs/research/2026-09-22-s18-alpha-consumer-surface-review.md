# BOR-S18 Research Review — Alpha Consumer Surface

Date: 2026-09-22
Status: IMPLEMENTED / CI PENDING
Hypothesis: BOR-S18-H1

## Question
Can BOR expose a useful human-facing Alpha report surface without introducing a second research projection, client-side truth reconstruction, write authority, publication authority, trading authority, or BOT dependency?

## Constraints reviewed
- DI-001 / DI-003 / DI-004 — preserve versioned identity, point-in-time state, and replayable lineage.
- AIML-005 / AIML-006 — product/agent changes require regression evidence; presentation must not silently alter research semantics.
- D-005 — progressive disclosure should expose conclusion first, then supporting Evidence, uncertainty, and lineage.
- BOR-S14-E1 — report/export consistency must fail closed.
- BOR-S15-E1 — the Alpha read model is the canonical consumer projection.
- BOR-S16-E1 — API serialization must preserve canonical identity, citation, scenario, disagreement, data-gap, and authority fields.
- BOR-S17-E1 — HTTP transport delegates to S16 and must not reconstruct research state.

## Hypothesis — BOR-S18-H1
A framework-free server-rendered HTML surface can consume the same S16 integrity-gated response used by the Alpha API and improve inspectability while preserving the exact no-authority and fail-closed boundaries.

## Experiment — BOR-S18-E1
Implementation:
- add a pure HTML renderer over `AlphaReadApiResponse`
- expose `GET /alpha/report`
- use the same dependency-injected model resolver and S16 integrity gate as `GET /api/alpha/report`
- render report identity, summary, thesis, scenarios, Evidence IDs, contradicting Evidence, catalysts, risks, invalidation conditions, unresolved disagreements, and data gaps
- display execution/publication/BOT authority as false
- escape every dynamic field before HTML insertion
- render unavailable/integrity failures explicitly instead of synthesizing fallback research

Success criteria:
1. valid canonical model renders with HTTP 200 and mobile-first HTML
2. unavailable model remains 404
3. tampered model remains 409
4. non-GET remains 405 without resolving report state
5. Evidence/disagreement/data-gap fields remain visible
6. dynamic markup is escaped
7. existing API/health/version behavior remains unchanged
8. full repository CI passes

## Result
PENDING exact-head CI and final verification.

## Adopt / Reject
PENDING. Do not mark ADOPT until exact-head BLACK ORACLE REPORT CI is green and the PR remains mergeable.

## Authority impact
None. S18 grants no execution, broker, capital, publication, persistent-write, or BOT authority.
