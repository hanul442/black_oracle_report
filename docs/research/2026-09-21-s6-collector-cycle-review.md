# BOR-S6 Collector/NARS Adapter Research Review

Date: 2026-09-21  
Status: ADOPT

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research

- **DI-001 — canonical experiment / transformation identity:** collector and cycle identities must be explicit enough to replay the same input path without inventing new lineage.
- **DI-003 — point-in-time availability:** `publishedAt` and `observedAt` remain distinct; collector transport must not rewrite when information became knowable.
- **DI-004 — snapshot-addressable replay:** retrieval URI and optional immutable snapshot reference must survive the adapter unchanged.
- **AIML-005 / AIML-006:** collection and ingestion correctness remains deterministic infrastructure; no LLM/agent judgment is introduced here.
- Legacy BOT **#39**: cutover readiness was intentionally hard-gated; pipeline health could pass while calibration/comparator/evidence remained BLOCKED.
- Legacy BOT **#41**: official-domain discovery alone was insufficient for Evidence promotion. Ambiguous/failed acquisition stayed explicit (`fetched_unverified`, `failed`, `blocked`), acquisition attempts were auditable, content was SHA-256 fingerprinted, dedup was deterministic, and NARS stayed `execution_authority=false`.
- Legacy BOT **#43**: operational surfaces exposed partial upstream failures and an explicit errors stream rather than fabricating healthy state.

### Hypothesis — BOR-S6-H1

A bounded collector cycle can adapt NARS/external source envelopes into BOR-S5 `bor.source-record.v1` and ingest each item independently while preserving explicit partial failure, replay identity, duplicate lineage and BOR's no-authority boundary.

### Experiment — BOR-S6-E1

Implemented:
1. `bor.collector-envelope.v1`,
2. deterministic adapter into `bor.source-record.v1`,
3. `bor.collector-cycle.v1` with deterministic cycle/item identities,
4. per-item `APPENDED | ALREADY_PRESENT | REJECTED`,
5. batch `COMPLETE | PARTIAL | FAILED | EMPTY`,
6. no direct EvidenceStore write path from collector code,
7. deterministic tests for mixed failure, replay, duplicate lineage, collector identity mismatch and empty cycles.

### Result

**PASS.** BOR CI #14 completed successfully:
- TypeScript typecheck: PASS
- build: PASS
- full repository tests: PASS

The implementation preserves successful records when another item fails, exposes the rejection in the cycle result, replays unchanged batches idempotently, and propagates duplicate lineage through BOR-S5.

### Adopt / Reject

**ADOPT for Alpha contract use.**

The result is an ingestion-domain contract only. It does not authorize a production network collector, scheduler, database cutover, report publication or trading behavior. Those remain separate gates.

## Authority statement

BOR-S6 has `executionAuthority=false` and `reportPublicationAuthority=false`. It cannot submit orders, mutate BOT state, access broker credentials, bypass Risk, or create trading authority.
