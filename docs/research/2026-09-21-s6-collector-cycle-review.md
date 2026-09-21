# BOR-S6 Collector/NARS Adapter Research Review

Date: 2026-09-21  
Status: TEST

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research

- **DI-001 — canonical experiment / transformation identity:** collector and cycle identities must be explicit enough to replay the same input path without inventing new lineage.
- **DI-003 — point-in-time availability:** `publishedAt` and `observedAt` remain distinct; collector transport must not rewrite when information became knowable.
- **DI-004 — snapshot-addressable replay:** retrieval URI and optional immutable snapshot reference must survive the adapter unchanged.
- **AIML-005 / AIML-006:** collection and ingestion correctness must remain deterministic infrastructure; no LLM/agent judgment is introduced here.
- Legacy BOT **#39**: cutover readiness was intentionally hard-gated; pipeline health could pass while calibration/comparator/evidence remained BLOCKED.
- Legacy BOT **#41**: official-domain discovery alone was insufficient for Evidence promotion. Ambiguous/failed acquisition stayed explicit (`fetched_unverified`, `failed`, `blocked`), acquisition attempts were auditable, content was SHA-256 fingerprinted, dedup was deterministic, and NARS stayed `execution_authority=false`.
- Legacy BOT **#43**: operational surfaces exposed partial upstream failures and an explicit errors stream rather than fabricating healthy state.

### Hypothesis — BOR-S6-H1

A bounded collector cycle can adapt NARS/external source envelopes into BOR-S5 `bor.source-record.v1` and ingest each item independently while preserving explicit partial failure, replay identity, duplicate lineage and BOR's no-authority boundary.

### Experiment — BOR-S6-E1

Implement:
1. `bor.collector-envelope.v1`,
2. a deterministic adapter into `bor.source-record.v1`,
3. `bor.collector-cycle.v1` with deterministic cycle/item identities,
4. per-item `APPENDED | ALREADY_PRESENT | REJECTED` outcomes,
5. batch `COMPLETE | PARTIAL | FAILED | EMPTY` status and explicit counts,
6. no direct EvidenceStore writes from collector code,
7. deterministic network-free tests covering mixed success/failure, replay and duplicate lineage.

### Constraints adopted from research

- Collection success never implies Evidence trust beyond the canonical BOR ingestion gates.
- One rejected record must not hide accepted records, and accepted records must not hide rejection.
- Errors are represented as data in the cycle outcome.
- No automatic production cutover, scheduling, report publication, order path, execution authority or BOT dependency.

### Result

Pending implementation and BOR CI verification.

### Adopt / Reject gate

**ADOPT** only if deterministic tests and BOR CI pass and the cycle cannot write Evidence except through `SourceEvidenceIngestor`. Otherwise **REVISE/REJECT** without changing BOR-S0–S5.

## Authority statement

BOR-S6 has `executionAuthority=false` and `reportPublicationAuthority=false`. It cannot submit orders, mutate BOT state, access broker credentials, bypass Risk, or create trading authority.
