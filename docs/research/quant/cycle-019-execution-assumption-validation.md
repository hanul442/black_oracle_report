# Cycle 019 — Execution Assumption Validation

Date: 2026-09-25
Status: TEST
ID: Q-007
Hypothesis: H-Q007
Experiment: EXP-Q007

## Research finding

Recent peer-reviewed and preprint market-microstructure work strengthens a gap already visible in BLACK ORACLE: reproducible backtests can still be wrong if execution assumptions are too optimistic.

Bank, Cartea & Körber (Finance and Stochastics, 2026-09-10) model execution outcomes as dependent on a stochastic liquidity state rather than a constant friction. Barzykin et al. (2026 preprint) study passive execution using fill probability, quote distance, order-flow imbalance, adverse selection and non-execution risk. Gang & Choi (Mathematical Finance 36(1)) show that transaction costs and trading-opportunity frictions jointly affect optimal no-trade behavior.

Evidence quality: the first and third sources are peer-reviewed; the passive-execution paper is a useful empirical challenger but remains a preprint. Evidence from crypto/on-chain venues was reviewed only as a transfer-limited reference.

## Gap versus BLACK ORACLE

DI-001/DI-003 can reproduce a historical experiment and Q-005 can preserve the search process, but neither proves that the simulated execution assumptions were realistic. A perfectly reproducible simulation may therefore reproduce an optimistic fill/cost model.

## H-Q007

A replayable evaluation of execution assumptions across liquidity states will identify strategies whose apparent post-cost robustness depends on optimistic fill or friction assumptions better than a flat fee/slippage baseline.

## EXP-Q007

Use archived or synthetic research fixtures only. Compare a simple fixed-friction baseline with progressively richer, versioned execution-assumption challengers. Seed known faults such as stale market snapshots, unrealistic passive fills, partial-fill omissions, liquidity deterioration, and parameter cherry-picking.

Measure:
- execution-assumption error on frozen fixtures;
- calibration of modeled fill likelihood where ground truth exists;
- cost-estimation error;
- detection of seeded optimistic assumptions;
- strategy-rank sensitivity to execution assumptions;
- worst-liquidity-state error;
- replay determinism and provenance completeness.

No universal empirical threshold is created here.

## Proposed research-only implementation path

Reuse DI-001/DI-003 point-in-time snapshots and link the evaluation to Q-005 search provenance. Store model/version/provenance information so execution-model tuning is itself auditable. Start with transparent baselines before testing richer challengers. Any later change to paper or production execution requires separate evidence, review and explicit adoption.

## Risks

Market-depth data can be incomplete or venue-specific; richer simulators can create false precision; evidence from NASDAQ, FX or crypto may not transfer to KRX; future-informed liquidity labels would reintroduce leakage; simulator tuning can become another hidden search channel.

## Cross-domain review

Design/UX: IEEE VIS 2026 reports that practice can change performance with uncertainty visualizations, reinforcing the need to include learning effects in D-005 evaluation. REFERENCE.

AI/ML: vendor-reported structured-data gains for financial agents are directionally relevant but insufficient for adoption without independent evaluation. REFERENCE.

Market/Data Infrastructure: Q-007 strengthens the need for timestamped point-in-time market-state snapshots under DI-003; no duplicate infrastructure ID created.

Product/Competitor: Orbit and Pascal emphasize source-cited, auditable institutional research workflows. REFERENCE for product positioning, not performance evidence.

Evidence & Validation: Q-007 adds validation of execution assumptions; it does not replace deterministic replay or search-provenance controls.

## Decision

TEST. No production or paper-trading behavior, strategy ranking, sizing, routing, or execution settings changed.

Trace: Research → H-Q007 → EXP-Q007 → PENDING → ADOPT / REJECT / REVISIT.
