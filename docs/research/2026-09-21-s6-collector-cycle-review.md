# BOR-S6 Collector/NARS Adapter Research Review

Date: 2026-09-21  
Status: ADOPT

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **DI-001:** collector/cycle transformation identity must be replayable.
- **DI-003:** `publishedAt` and `observedAt` remain distinct and are never rewritten by transport.
- **DI-004:** retrieval URI and optional snapshot reference survive the adapter.
- **AIML-005 / AIML-006:** collection/ingestion remains deterministic infrastructure; no LLM judgment is introduced.
- Legacy BOT **#39:** cutover/readiness remained hard-gated and non-automatic.
- Legacy BOT **#41:** official-domain discovery alone was insufficient; ambiguous/failed acquisition stayed explicit, attempts were auditable, canonical content was hashed, dedup was deterministic, and NARS remained evidence-only with `execution_authority=false`.
- Legacy BOT **#43:** partial upstream failures and errors were surfaced instead of being represented as healthy state.

### Hypothesis — BOR-S6-H1
A bounded collector cycle can adapt NARS/external source envelopes into `bor.source-record.v1` and ingest each item independently while preserving partial failure, replay identity, duplicate lineage and BOR's no-authority boundary.

### Experiment — BOR-S6-E1
Implemented and tested:
1. `bor.collector-envelope.v1`,
2. deterministic adapter into `bor.source-record.v1`,
3. `bor.collector-cycle.v1`,
4. deterministic cycle/item identities,
5. `APPENDED | ALREADY_PRESENT | REJECTED` item outcomes,
6. `COMPLETE | PARTIAL | FAILED | EMPTY` cycle outcomes,
7. no direct EvidenceStore write path from collector code,
8. tests for mixed failure, replay, duplicate lineage, collector identity mismatch and empty cycles.

### Result
**PASS.**

Verification:
- BOR CI #14: PASS
- final PR head BOR CI #16: PASS
- TypeScript typecheck: PASS
- build: PASS
- full repository tests: PASS
- PR #8 merged as `6fb72904d9584738460c828edd70fbe729e934cd`

The implementation preserves successful records when another item fails, exposes rejected items explicitly, replays unchanged batches idempotently, and propagates duplicate lineage through BOR-S5.

### Adopt / Reject
**ADOPT for Alpha contract use.**

This does not authorize a network collector, scheduler, production database cutover, report publication or trading behavior. Those remain separate gates.

## Authority statement
BOR-S6 fixes `executionAuthority=false` and `reportPublicationAuthority=false`. It cannot submit orders, mutate BOT state, access broker credentials, bypass Risk, or create trading authority.
