# Cycle 017 — Uncertainty Decomposition & Action Routing

Date: 2026-09-24
Status: TEST / REFERENCE
Primary ID: EV-011
Hypothesis: H-EV011
Experiment: EXP-EV011

## Research question

BLACK ORACLE increasingly records forecast confidence, calibration, regime state, evidence disagreement, agent disagreement, and data freshness. A single scalar `confidence` or `uncertainty` field can collapse materially different failure modes into the same number. The R&D question is whether BO should represent uncertainty by cause and route different causes to different actions, while keeping any effect on trading disabled until a controlled experiment succeeds.

## New material reviewed

### 1. Maenhout, Xing & Balter — Model Ambiguity versus Model Misspecification in Dynamic Portfolio Choice, Journal of Finance (2026)
Evidence quality: HIGH. Peer-reviewed Journal of Finance article.

The paper separates model ambiguity from model misspecification and shows that they can imply different portfolio behavior. For BO the useful result is conceptual rather than an immediately adoptable allocation rule: uncertainty about which model is right is not the same object as ordinary return risk or a known model's predictive variance.

Classification: REFERENCE.

### 2. Heal & Lucchetta — Ambiguity vs. Risk in Investment Decisions, NBER Working Paper 35488 (July 2026)
Evidence quality: MEDIUM-HIGH. NBER working paper; strong institutional source but not treated as a production rule.

The paper explicitly decomposes baseline risky valuation from the structural cost of ambiguity and shows ambiguity aversion can depress optimal asset demand. This reinforces the need not to encode all uncertainty as one calibrated probability.

Classification: REFERENCE.

### 3. Eggen — Financial Time Series Uncertainty: A Review of Probabilistic AI Applications, Journal of Economic Surveys (2025/2026 volume)
Evidence quality: HIGH for taxonomy/synthesis, not evidence for a specific BO implementation.

The review distinguishes epistemic uncertainty (limited knowledge/model uncertainty) and aleatoric uncertainty (irreducible randomness) and identifies weak standardization/evaluation as an open problem in financial probabilistic ML.

Classification: REFERENCE.

### 4. Subjective Risk Decomposition (2026)
Evidence quality: MEDIUM. Recent methodological preprint.

It argues that epistemic/aleatoric measures should be induced by the modelling scenario and proper loss rather than treated as universal primitive scores. BO should therefore avoid inventing a universal uncertainty decomposition and must validate any decomposition against the decision task.

Classification: REVIEWED / REFERENCE.

### 5. FinAbstain (2026)
Evidence quality: LOW-MEDIUM for outcome claims; useful as a design blueprint only. The paper explicitly labels its reported results as simulated rather than empirical.

It combines point-in-time retrieval, evidence contradiction, repeated-sample consistency, historical calibration and selective prediction, routing high-uncertainty cases to abstention, evidence requests, reduced exposure or human review. This overlaps BO's Evidence/Council/NO-TRADE architecture, but it does not establish that its composite score improves real trading outcomes.

Classification: REFERENCE; composite score NOT ADOPTED.

## Comparison with current BLACK ORACLE

Existing relevant controls:

- DI-003: point-in-time availability semantics.
- AIML-006/related Council work: disagreement and simpler-baseline comparison.
- EV-010: regime- and horizon-aware calibration of forecast uncertainty.
- Evidence system: source quality, freshness, contradiction and provenance.
- NO-TRADE / escalation concepts exist at the strategy/router layer.

Gap:

BO can measure several uncertainty signals but does not yet have a canonical contract that says *what kind of uncertainty is present, what evidence produced that classification, and what action is permitted for that cause*. A scalar confidence can hide the difference between:

1. market/process risk that remains even with a well-known model;
2. epistemic/model uncertainty that may shrink with more/better evidence;
3. model ambiguity/disagreement between plausible models;
4. data/evidence uncertainty caused by stale, sparse, conflicting or low-quality inputs;
5. regime/shift uncertainty indicating calibration may no longer transport;
6. operational uncertainty such as failed tools or incomplete execution traces.

These categories are deliberately provisional. EXP-EV011 must test whether they are distinguishable and decision-useful; the taxonomy is not adopted merely because it is intuitive.

## Proposed contract — `bo.uncertainty_state.v1`

Candidate fields:

- `uncertainty_state_id`
- `decision_id` / `forecast_run_id`
- `issued_at`
- `horizon`
- `aleatoric_measure` + method/version
- `epistemic_measure` + method/version
- `model_ambiguity_measure` + ensemble/model-set identity
- `evidence_quality_state` (freshness, sparsity, contradiction, provenance completeness)
- `regime_shift_state`
- `operational_integrity_state`
- `calibration_reference_id` (EV-010)
- `evidence_snapshot_ids`
- `dependency/model manifest IDs`
- `recommended_action_class`
- `action_reason_codes`
- `policy_version`

The contract should store method provenance and raw component evidence rather than only a final blended score.

## Action-routing candidate

Candidate mapping for testing only:

- high aleatoric / low epistemic -> uncertainty may be irreducible; widening intervals or reducing decisiveness can be evaluated;
- high epistemic / weak evidence -> request additional evidence or defer;
- high model ambiguity -> Council/challenger comparison or human review;
- stale/conflicting evidence -> fail evidence-quality gate and refresh/reconcile;
- regime-shift alert -> invalidate/recalibrate relevant calibration state before trusting nominal confidence;
- operational-integrity failure -> fail closed; do not reinterpret as market uncertainty.

No mapping is authorized to change position size, strategy promotion, NO-TRADE threshold or live/paper orders in Cycle 017.

## H-EV011

A cause-aware uncertainty state with action-specific routing will detect and route seeded failure modes more appropriately than a single scalar confidence threshold, without materially increasing false abstention on clean fixtures.

## EXP-EV011

Reuse frozen DI-001/DI-003 replay fixtures and EV-010 forecast/outcome pairs. Do not create a separate data harness.

Compare:

A. scalar raw confidence;
B. calibrated scalar uncertainty (EV-010 baseline);
C. decomposed uncertainty state without action routing;
D. decomposed state + deterministic reason-coded routing policy.

Seed cases:

- high irreducible volatility with stable models/data;
- model disagreement with otherwise clean data;
- sparse evidence;
- stale evidence;
- contradictory high-quality evidence;
- distribution/regime shift;
- tool/data-provider failure;
- apparently high confidence caused by correlated models;
- calibration that is good in aggregate but broken in one regime/horizon;
- extra evidence that genuinely resolves an epistemic case;
- extra evidence that should not reduce aleatoric uncertainty.

Primary metrics:

- failure-cause classification accuracy on seeded fixtures;
- wrong-action routing rate;
- false-abstention rate on clean/easy fixtures;
- selective error / risk-coverage curves where applicable;
- resolution rate after additional evidence for epistemic cases;
- inappropriate confidence reduction for aleatoric-only cases;
- worst-regime/horizon behavior;
- reason-code completeness and replayability;
- latency and compute overhead.

Success gate:

- all seeded hard operational/data-integrity faults must fail closed;
- cause-aware routing must reduce wrong-action routing versus calibrated scalar baseline;
- any gain must survive frozen holdout evaluation and not depend on post-hoc threshold tuning;
- component measures must retain method/version provenance and be replayable;
- no adoption if decomposition labels are unstable across reasonable implementations or add complexity without decision benefit.

Exact quantitative thresholds beyond hard-fault detection are intentionally not invented before baseline distributions are measured.

## Risks / falsification conditions

1. Epistemic/aleatoric decomposition may be model-dependent and not empirically identifiable enough for routing.
2. Multiple correlated models can create false apparent consensus; AIML common-mode dependency controls remain necessary.
3. A richer uncertainty UI can create false precision and user over-trust.
4. Composite uncertainty scores can double-count correlated components.
5. Better calibration or abstention does not establish alpha or improved realized P&L.
6. Human-review routing can become a latency bottleneck and must be measured.

Reject or revisit if decomposed states do not improve routing on frozen holdouts, are too unstable to reproduce, or materially worsen clean-case coverage/latency without compensating safety value.

## Design/UX implication — REFERENCE only

If EV-011 survives testing, D-005 should not present only a confidence percentage. The Decision → Why → Audit hierarchy should expose a compact reason such as `MODEL DISAGREEMENT`, `EVIDENCE STALE`, `REGIME SHIFT`, or `HIGH MARKET NOISE`, with deeper component evidence behind progressive disclosure. This is a UI hypothesis, not an adopted design change.

## Implementation path if experiment succeeds

1. Add BOR-native `bo.uncertainty_state.v1` schema referencing existing EV-010 calibration, evidence snapshots and dependency manifests.
2. Emit uncertainty states in shadow/replay mode only.
3. Add deterministic reason-coded router as a challenger to the scalar baseline.
4. Evaluate on frozen fixtures and untouched holdout.
5. Only after explicit ADOPT decision may downstream NO-TRADE, human escalation or sizing policies consume the contract.

## Decision

EV-011: TEST.

No production or paper trading behavior, strategy ranking, model routing, position sizing, NO-TRADE threshold, or user-facing confidence display is changed by this research entry.
