# Cycle 016 — Regime-Aware Forecast Uncertainty Calibration

Date: 2026-09-24
Status: TEST
ID: EV-010
Hypothesis: H-EV010
Experiment: EXP-EV010

## Research question

BLACK ORACLE already treats calibration and uncertainty as important outputs, but the repository-level research ledger does not yet define a falsifiable contract for whether forecast uncertainty remains calibrated when market regimes and error distributions shift. A confidence score can look numerically precise while becoming systematically overconfident during volatility, liquidity, or macro regime changes.

## New evidence reviewed

### Dynamic Regime-Aware Conformal Prediction (DRACP, 2026)

A 2026 preprint evaluates a regime-aware weighted conformal framework on 48 economic, energy, and daily financial series. It explicitly targets covariate shift, concept drift, local heterogeneity, and latent regimes. Reported nominal 90% coverage was 0.890 overall, and the method never fell below 0.80 on any tested series. The paper is useful because it separates coverage reliability from interval efficiency and includes ablations; however, it is a recent preprint rather than settled financial-trading evidence, and the datasets/tasks are not BLACK ORACLE's own forecasts. Classification: REFERENCE.

### FLIPR for time series (PMLR 2026)

FLIPR provides conformal joint prediction regions across multiple forecast horizons and explicitly controls a family-wise error notion rather than calibrating each horizon independently. This is relevant to BO if forecasts are emitted simultaneously at several horizons. Evidence quality is stronger than a preprint because it is a 2026 PMLR conference publication, but it is general time-series methodology, not evidence of trading profitability. Classification: REFERENCE.

### MAPIE / online conformal implementations

MAPIE is a mature scikit-learn-contrib uncertainty-quantification library and in 2026 exposes exchangeability checks and adaptive conformal methods. The Salesforce `online_conformal` reference implementation includes SAOCP, FACI, non-exchangeable conformal prediction and other shift-aware baselines. These are implementation/reference candidates, not reasons to add a dependency to BO. Classification: REFERENCE.

### Conformal Kelly (2026)

A recent preprint is especially useful as a negative control. Its development-window conformal position-sizing results looked strong, but a sealed, pre-registered 2022+ evaluation preserved calibration while growth underperformed passive benchmarks. This directly supports a BO hygiene rule: calibrated uncertainty is not evidence of alpha, and uncertainty calibration must be evaluated separately from trading utility. Classification: REFERENCE; the proposed trading/sizing rule is NOT ADOPTED.

## Comparison with current BLACK ORACLE architecture

BO already has point-in-time validation (DI-003), deterministic replay (DI-001), search-provenance/multiplicity control (Q-005), layered Decision → Why → Audit UX (D-005), and a broader calibration direction. What is missing is an explicit forecast-level calibration artifact that can answer:

1. Was nominal uncertainty actually calibrated out of sample?
2. Did coverage fail specifically during a regime shift?
3. Was calibration measured separately for horizon, asset/sector, direction, volatility/liquidity regime, and model version?
4. Was a calibration method selected after seeing the same OOS period?
5. Did a narrower interval improve decisions, or merely look more precise?

## Candidate contract — `bo.forecast_calibration.v1`

For every evaluated forecast family, record at minimum:

- `forecast_run_id`
- `model_version`
- `target_definition`
- `horizon`
- `issued_at` and `target_observed_at`
- `data_snapshot_id`
- `calibration_window_id`
- `calibrator_type` and version
- nominal coverage / risk level
- realized inclusion/miss
- lower/upper error and interval width
- regime labels known at forecast time
- post-hoc regime labels kept separately
- calibration method search/provenance ID when multiple calibrators were tried

This should reference existing canonical artifacts rather than duplicate data.

## Hypothesis H-EV010

A forecast-calibration layer evaluated by horizon and regime, with calibration-method search provenance and explicit coverage/width diagnostics, will detect overconfidence under distribution shift that aggregate confidence scores or pooled calibration metrics miss.

## Experiment EXP-EV010

Use the same point-in-time archived fixtures produced for DI-001/DI-003. Do not build a separate data path.

Compare:

A. raw model score / uncalibrated interval
B. static split-conformal baseline
C. established adaptive/online conformal baseline
D. regime-aware challenger

The experiment must use frozen model forecasts. Calibration methods may change the uncertainty wrapper, not the underlying forecast, so forecast skill and uncertainty calibration remain separable.

### Seeded failure cases

- abrupt volatility expansion
- volatility compression
- asymmetric downside-error burst
- horizon-specific degradation
- stale calibration window
- calibration leakage from future residuals
- regime label computed with future information
- pooled coverage that hides one badly undercovered regime
- calibrator cherry-picking on the same OOS period

### Metrics

Primary:
- empirical coverage vs nominal coverage
- worst-regime coverage gap
- horizon-wise coverage gap
- interval score / Winkler-style efficiency
- severe-miss frequency and downside miss rate
- calibration drift detection delay

Secondary:
- interval width
- turnover/NO-TRADE impact only in a shadow decision analysis
- computational overhead

Success is not defined as 'highest return'. A candidate is eligible for adoption only if it materially improves calibration reliability without leakage and without hiding failures behind pooled averages. Exact numeric promotion thresholds should be set only after baseline distributions are measured on BO fixtures.

## Implementation path

1. Finish DI-001 + DI-003 point-in-time replay fixture.
2. Emit immutable forecast/outcome pairs from that fixture.
3. Implement a small BO-native calibration evaluator first; use external libraries as reference adapters rather than a hard architectural dependency.
4. Add regime/horizon slices and seeded leakage checks.
5. Attach the resulting calibration artifact to `bo.audit_bundle.v1`/decision evidence when those contracts are implemented.
6. Only after EXP-EV010 passes should calibrated uncertainty affect model promotion or NO-TRADE policy; production trading behavior remains unchanged during research.

## Risks

- Conformal guarantees can weaken when exchangeability assumptions fail; adaptive methods trade sharpness, responsiveness and stability differently.
- Regime labels can themselves leak future information.
- Searching many calibration schemes creates another multiplicity problem and therefore must link to Q-005-style search provenance.
- Good coverage does not imply useful forecasts or profitable trades.
- Excessively wide intervals can achieve coverage while destroying decision usefulness.

## Decision

TEST. Create the evaluation contract and experiment, but do not adopt a calibrator, change forecast ranking, alter NO-TRADE thresholds, resize positions, or modify production/paper trading behavior until BO-specific replay evidence exists.
