# Cycle 015 — Strategy Search Provenance and Multiplicity Control

Date: 2026-09-24
Status: TEST / REFERENCE
ID: Q-005
Hypothesis: H-Q005
Experiment: EXP-Q005

## Research question

BLACK ORACLE's Strategy Factory can generate, mutate, tune, compare, and retire many strategy candidates. That creates a statistical risk that is not captured by the performance of the final selected strategy: the winning backtest may partly be the maximum of a large hidden search process. The research question is therefore not only whether a strategy backtest is strong, but how much search was required to discover it and whether the reported evidence survives multiplicity-aware validation.

## New evidence reviewed

### 1. Santoni, Jouanne & Scullin (2026), *Equity Strategy Backtesting: Luck or Edge? The MinervaScore as a Statistical Robustness Grade*

Evidence quality: MEDIUM. Recent preprint with a large production-backtest calibration set and synthetic validation, but not sufficient as independent evidence of forward predictability. Importantly, its pre-registered unseen real-market test did not find a significant forward relationship. That negative result is useful: a robustness grade should be treated as an audit/reporting layer, not a profit predictor.

Useful contribution: combines Deflated Sharpe Ratio (DSR), Probability of Backtest Overfitting (PBO), Superior Predictive Ability (SPA), Minimum Track Record Length (MinTRL), and regime stability. The paper reports calibration on 359,062 production backtest records and explicitly separates statistical support from future-profit probability.

Decision: REFERENCE. Do not adopt the composite score or its thresholds as a BO ranking score.

### 2. Grądzki (2026), *Unstable Gains: Multiplicity-Aware Evaluation of Financial Deep Reinforcement Learning*, Journal of Finance and Data Science

Evidence quality: HIGH-MEDIUM. Peer-reviewed/open-access research directly relevant to stochastic strategy/model search. It demonstrates that multiple random seeds and checkpoint/model selection can create a winner's-curse problem analogous to multiple testing, and recommends multi-run evaluation, uncertainty quantification and multiplicity-aware performance measures.

Useful contribution: BO's trial count must include stochastic training/search branches, not merely manually edited strategy parameters.

Decision: REFERENCE / TEST INPUT.

### 3. Harvey/Liu-family multiple-testing literature and Oxford/SFS replication evidence

Evidence quality: HIGH. Peer-reviewed financial-econometrics literature. RFS evidence using millions of randomly generated strategies estimates materially higher hurdles when many hypotheses are searched; replication work on hundreds of anomalies shows that multiple-testing corrections sharply reduce apparent discoveries. The established Deflated Sharpe Ratio literature explicitly adjusts for selection bias under multiple testing and non-normal returns.

Useful contribution: the number and dependence structure of attempted strategies is part of the evidence supporting the selected strategy.

Decision: REFERENCE.

### 4. López de Prado & Fabozzi (2026), *The False Discovery Rate in Finance: Identification Failure and Search-Adjusted Estimation*

Evidence quality: MEDIUM-HIGH as methodological research; recent working paper, not treated as settled consensus. It argues that false-discovery inference based only on the cross-section of reported in-sample statistics can suffer an identification problem because the hidden search process matters.

Useful contribution: reinforces the need to record the actual BO search history rather than infer search intensity after the fact from winners alone.

Decision: REFERENCE / REVISIT after peer-reviewed follow-up.

## Comparison with current BLACK ORACLE architecture

BO already has or is researching:

- `bo.experiment.v1` / DI-001 for canonical experiments and replay;
- DI-003 for point-in-time semantics;
- DI-004 for snapshot-addressable replay;
- Q-002 for execution-cost stress;
- Strategy Factory / Genome / Incubator / Arbiter concepts for generating and selecting strategies;
- Experiment Ledger for preserving experiment history.

The missing contract is **search provenance**. An immutable experiment record can reproduce one candidate while still failing to reveal that the candidate was selected from hundreds or thousands of alternatives. Strategy Factory increases this risk because automated generation makes the effective number of trials easy to hide accidentally.

## Gap

A promoted strategy currently lacks a mandatory machine-readable answer to:

1. What search family did this candidate belong to?
2. How many candidate strategies, parameter variants, random seeds, checkpoints, feature sets, universes, windows, and selection-rule variants were attempted before promotion?
3. Which attempts shared data and therefore are statistically dependent?
4. Which metric and dataset were used to choose the winner?
5. Was a holdout/OOS segment inspected or reused during iteration?
6. Does the apparent edge survive a multiplicity-aware diagnostic?

Without this, the Experiment Ledger can be complete at the run level but incomplete at the discovery-process level.

## Candidate contract — `bo.search_provenance.v1`

Proposed minimum fields:

- `search_id`
- `parent_research_id`
- `strategy_family_id`
- `candidate_id`
- `generation_method` (manual / grid / Bayesian / evolutionary / LLM / RL / other)
- `parent_candidate_ids`
- `data_snapshot_ids`
- `feature_set_id`
- `universe_id`
- `objective_metric`
- `selection_rule_version`
- `parameter_space_hash`
- `seed`
- `checkpoint_id`
- `trial_index`
- `trial_count_observed`
- `search_started_at`
- `search_closed_at`
- `holdout_access_count`
- `oos_reuse_count`
- `candidate_status` (generated / tested / shortlisted / promoted / rejected / retired)
- `experiment_id`
- `result_artifact_id`

The contract should reference, not duplicate, DI-001 experiment artifacts and DI-006 lineage edges.

## H-Q005

If Strategy Factory records complete search provenance and promotion reports include multiplicity-aware diagnostics, then deliberately selected lucky winners from large candidate families will be identified or downgraded more reliably than under winner-only Sharpe/return reporting, without preventing genuinely stable candidates from reaching further paper validation.

## EXP-Q005 — Hidden Search / Winner's Curse Fixture

Use synthetic and archived market fixtures; do not alter production or paper trading behavior.

### Conditions

A. Winner-only report: best Sharpe/return from the candidate family.

B. Search-aware report: full `bo.search_provenance.v1` plus trial count/search family.

C. Search-aware + multiplicity diagnostics: B plus DSR and at least one family-level overfitting/multiple-testing diagnostic appropriate to the search design; PBO/CSC-style or SPA/multiple-testing methods may be evaluated rather than assumed.

D. C + untouched final holdout / forward paper slice.

### Seeded cases

- 1 true weak signal among many noise candidates;
- all-noise family with winner selected by maximum Sharpe;
- repeated parameter tuning on the same OOS window;
- many random seeds with only the best seed reported;
- checkpoint cherry-picking;
- feature-family search where trials are strongly dependent;
- strategy mutation chain where parent/child trials are incorrectly counted as independent;
- low-turnover winner that loses after Q-002 cost stress;
- regime-specific winner that fails outside its discovery regime.

### Metrics

Primary:

- false-promotion rate for all-noise families;
- true-signal retention rate;
- search-provenance completeness;
- hidden-trial detection rate;
- holdout contamination detection rate;
- promotion-rank stability after multiplicity adjustment.

Secondary:

- DSR / candidate-family diagnostic values;
- OOS and forward-paper degradation;
- regime stability;
- cost-adjusted performance;
- implementation/runtime overhead.

### Initial engineering acceptance criteria

- seeded missing/hidden trials: 100% provenance validation failure when the manifest is intentionally incomplete;
- holdout reuse seeded into metadata: 100% surfaced to the promotion report;
- no strategy can receive an `ADOPT` decision from this experiment solely because a composite robustness score exceeds a threshold;
- final untouched holdout remains inaccessible to Strategy Factory search until the search family is frozen.

Statistical pass/fail thresholds for DSR/PBO/SPA are **not** hard-coded at research time. They must be justified for the actual BO search design, dependence structure, sample length, and asset class.

## Implementation path

1. Extend the Experiment Ledger with `search_id` and parent/child candidate links.
2. Emit `bo.search_provenance.v1` from Strategy Factory before any candidate evaluation begins.
3. Make candidate generation append-only; rejected candidates remain represented by IDs and result references.
4. Freeze the search family before opening the final holdout.
5. Build a promotion report that displays raw performance separately from search-adjusted diagnostics.
6. Attach the search manifest to `bo.audit_bundle.v1` when that bundle is implemented.
7. Only after EXP-Q005 passes should multiplicity diagnostics become a Strategy Factory promotion gate.

## Risks

- Effective trial count is difficult when candidates are dependent; naive counting can over- or under-penalize.
- PBO/DSR/SPA assumptions differ and none should become a magic scalar.
- Recording every generated candidate can increase storage and operational complexity.
- Researchers can still leak information through manual observation of the holdout unless access itself is controlled and logged.
- A conservative multiplicity gate can reject weak but genuine signals; therefore this is evidence weighting, not an automatic profit oracle.

## Decision

**Q-005 = TEST.**

Adopt the *requirement to test search provenance*, not any specific statistical score or threshold. No production/paper strategy ranking, routing, or trading behavior changes in this cycle.

## Traceability

`Q-005 Research → H-Q005 → EXP-Q005 → PENDING → ADOPT / REJECT / REVISIT`

Related: DI-001, DI-003, DI-004, DI-006, Q-002, Strategy Factory, Experiment Ledger.
