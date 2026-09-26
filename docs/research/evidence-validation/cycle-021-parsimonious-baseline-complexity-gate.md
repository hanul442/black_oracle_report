# Cycle 021 — Parsimonious Baseline & Complexity Gate

Status: **TEST / REFERENCE**  
ID: **EV-012**  
Trace: Research → H-EV012 → EXP-EV012 → PENDING → ADOPT / REJECT / REVISIT

## Research
Capera Romero & Opschoor (Journal of Applied Econometrics, 2026) compare sophisticated high-frequency multivariate volatility models with EWMA on more than two decades of 100 U.S. stocks. EWMA could not be consistently outperformed at daily/weekly horizons and could deliver higher transaction-cost-aware utility because of lower turnover. This is strong peer-reviewed evidence that added model complexity is not itself evidence of decision value.

Salcher (Journal of Forecasting, 2026) separately shows generic RMSE can fail to explain the economic value of return forecasts. FinToolBench, FinMCP-Bench and TSAG show that finance-agent evaluation increasingly relies on executable tools and task-specific metrics rather than model sophistication alone. IEEE VIS 2026 work shows interface evaluation can also change with practice, so apparent first-use superiority is not sufficient evidence for a more complex presentation.

## Gap vs BLACK ORACLE
BO already has Champion–Challenger, AIML-005/006 evaluation, Q-005 search provenance and Q-008 forecast/decision alignment. What is not yet explicit is a **simplicity control**: every more complex model/agent/Council/strategy should face a frozen parsimonious baseline under the same PIT data, budget, constraints and execution assumptions. Without this, complexity can win because the baseline is weak, stale, cheaper constraints are ignored, or evaluation budgets differ.

## Hypothesis H-EV012
A mandatory frozen parsimonious baseline evaluated under matched data, compute/tool budget, constraints and Q-007 execution assumptions will identify complex candidates whose apparent advantage disappears after costs, turnover, latency or instability are included, while retaining candidates with genuine incremental value.

## Experiment EXP-EV012
Reuse the existing evaluation fixtures; do not create a separate harness.

Conditions:
A. candidate-only evaluation;
B. candidate vs frozen simple baseline on statistical metrics;
C. B + matched compute/tool/data budget;
D. C + downstream decision metrics, Q-007 friction and regime/horizon slices.

Seed:
- complex model with lower RMSE but higher turnover;
- Council with better prose but no task gain;
- agent with more tool calls but equal executable accuracy;
- strategy with marginal gross alpha erased by costs;
- baseline deliberately made stale;
- candidate hyperparameter/search advantage not granted to baseline;
- regime-specific complexity win that reverses elsewhere.

### Metrics
- incremental decision value over baseline;
- rank reversals after costs/constraints;
- worst-regime/horizon incremental value;
- latency, tool-call and compute cost per incremental gain;
- turnover/slippage sensitivity;
- stability across seeds/checkpoints;
- baseline freshness/provenance completeness;
- false-complexity-promotion rate.

No universal numeric threshold is introduced before frozen-holdout evidence exists.

## Proposed implementation path
Add a baseline reference to Experiment Ledger / Champion–Challenger records: baseline_id, baseline_version, snapshot_id, budget_manifest, constraint_manifest, execution_assumption_version and comparison_result. Reuse DI-006 lineage and Q-005 search provenance. A candidate may remain research-worthy even if it fails the gate; failure must not silently alter production routing.

## Risks
Over-aggressive simplicity preference can suppress nonlinear models that genuinely help in rare regimes. Baseline selection itself can be gamed. Compute matching can be ambiguous across model classes. Therefore the gate measures incremental evidence and does not automatically force the simplest model into production.

## Decision
**TEST / REFERENCE.** No production/paper trading, model routing, Council topology, strategy ranking or sizing changes.
