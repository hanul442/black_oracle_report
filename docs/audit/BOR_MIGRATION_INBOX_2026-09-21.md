# BOR Migration Inbox — 2026-09-21

Status: CANONICAL EXTRACTION QUEUE  
Source repository: hanul442/black_oracle_bot  
Target: BLACK ORACLE REPORT Alpha v0.1

## Rule

Legacy assets are references, not production authority. Reimplement or adapt them against BOR's current independent runtime, bor.evidence.v1, append-only Evidence Store and no-trading-authority boundary.

## Priority extraction queue

### P0 — BOR-S5 Source / NARS ingestion
Source PRs: BOT #39, #41, #43.

Extract concepts for:
- source identity and authority continuity,
- canonical content retrieval,
- content fingerprinting,
- observed/published time integrity,
- deduplication and lineage,
- acquisition failures remaining explicit,
- evidence packets with execution_authority=false.

Do not copy:
- BOT execution/runtime coupling,
- direct legacy database ownership assumptions,
- cutover logic that assumes the old combined product.

### P1 — Report domain contracts
Source PR: BOT #200.

Candidate concepts:
- versioned Report,
- AnalystReview,
- DebateSession,
- DomainLeadSynthesis,
- Bull/Base/Bear Forecast,
- ForecastEvaluation,
- ReportTrace.

Required adaptation:
- Evidence references must resolve to canonical BOR Evidence IDs.
- missing/contradictory evidence stays explicit.
- published reports are immutable/versioned artifacts.
- no trading/order/portfolio authority.

### P2 — Research agent orchestration
Source PR: BOT #200.

Candidate concepts:
- analyst registry,
- relevance/cost-aware activation,
- Specialist → disagreement → optional Red Team/Debate → lead synthesis,
- forecast/accountability evaluation.

Gate:
- only after BOR-S5 ingestion and Evidence persistence are stable.
- AIML-005/006 evaluation precedes broad multi-agent expansion.

### P3 — UI/report history
Candidate concepts:
- report projection,
- forecast-vs-actual accountability,
- chart/history surfaces.

Target UI remains:
Today / Markets / Research / Evidence / Oracle / Reports / Library / Watchlist.

## Explicitly deferred from Alpha

- Credit Economy,
- billing/charging,
- subscription entitlements beyond minimal product scaffolding,
- any AutoTrade or broker integration.

## Migration completion criteria

An old BOT source PR may be closed/archive-classified when every BOR-relevant contract or research precedent has either:
1. been implemented and tested in BOR,
2. been recorded as REJECT/DEFER with rationale, or
3. been preserved as a cited historical reference with no remaining code dependency.
