# Cycle 030 — Vintage-Sensitive Reference Data & Stochastic Policy Evaluation

Date: 2026-09-29
Status: TEST reinforcement / REFERENCE
Production trading change: NONE

## Scope

This cycle deliberately adds no new research ID. New evidence materially strengthens existing DI-003 (point-in-time availability semantics) and Q-005 (strategy-search provenance / multiplicity control), while also informing Q-007 and DI-006. The goal is to reduce research debt and move existing hypotheses toward executable tests.

## 1. DI-003 — reference-data vintage sensitivity

### Research

Akey, Robertson & Simutin, *Review of Finance* 30(5), 2026, “Noisy factors? The retroactive impact of methodological changes on the Fama–French factors” studies archived vintages of Fama–French factor data. Factor returns differ materially depending on download vintage, much of the change is attributable to methodology revisions rather than only corrections to underlying observations, and newer vintages do not consistently dominate older vintages in model-evaluation tests. The paper recommends disclosing dataset vintages and testing robustness across vintages.

SEC EDGAR documentation independently reinforces the temporal distinction relevant to BO: filing acceptance time is not the timestamp at which content first became publicly available on sec.gov; SEC notes filings are often available 1–3 minutes after acceptance and that no timestamp records first web availability.

Evidence quality: HIGH. Peer-reviewed finance journal + primary regulator documentation.

### Comparison with BLACK ORACLE

DI-003 already requires point-in-time availability semantics. DI-006 records transformation lineage. The remaining gap is explicit treatment of *reference-data vintage* and *methodology version* as first-class replay inputs. A dataset can have historically dated observations yet still be retrospectively rewritten by a later vendor/methodology revision.

### Hypothesis H-DI003-VINTAGE

If dataset vintage/methodology identity is frozen alongside event/release/observed time, BO will detect historical-replay conclusions that change solely because a later reference-data vintage was substituted, even when observation dates are unchanged.

### Experiment EXP-DI003-VINTAGE

Reuse the DI-001/DI-003 executable PIT fixture.

Conditions:
1. frozen historical vintage;
2. latest available vintage substituted retrospectively;
3. fixed-code reconstruction where feasible;
4. intentionally missing vintage/methodology metadata.

Seed faults:
- retroactive factor revision;
- methodology change with unchanged observation date;
- corrected vendor record backfilled to original period;
- acceptance-time/public-availability conflation;
- latest-vintage benchmark used in a historical evaluation;
- derived alpha/beta recalculated from an unrecorded factor vintage.

Metrics:
- seeded vintage-leak detection recall;
- false-positive rate on genuinely immutable data;
- replay conclusion reversal rate across vintages;
- alpha/beta/risk-metric sensitivity by vintage;
- source→vintage→transformation→claim reconstruction success;
- deterministic replay equality under a frozen vintage;
- storage/runtime overhead.

Decision: TEST reinforcement under DI-003. Do not create DI-008.

Candidate implementation path:
- extend dataset/snapshot manifest with dataset_id, vintage_id or retrieval snapshot, methodology_version/hash where available, observed_at, source_hash, and lineage_ref;
- fail closed for historical validation when a mutable reference dataset has no reconstructable vintage;
- do not require this metadata for sources demonstrated to be immutable; avoid blanket complexity.

Risks:
- vendors may not expose historical vintages;
- archival storage cost;
- false precision when methodology version is unknown;
- reconstructed vintages can differ from what a historical user actually observed.

## 2. Q-005 — stochastic policy multiplicity

### Research

Grądzki, *Journal of Finance and Data Science* (available online 2026-09-23), “Unstable Gains: Multiplicity-Aware Evaluation of Financial Deep Reinforcement Learning” repeats financial DRL training across independent seeds and shows substantial Sharpe and allocation instability. Apparent algorithm outperformance often weakens after multi-run uncertainty quantification, permutation/family-wise-error controls and deflated-performance diagnostics. The paper explicitly treats a trained policy as a random draw from an optimization-induced distribution rather than a deterministic backtest result.

Evidence quality: HIGH. Peer-reviewed, open-access finance/data-science journal with reproducibility details; applicability is strongest for stochastic/non-convex learners and should not be generalized mechanically to deterministic strategies.

### Comparison with BLACK ORACLE

Q-005 already records search provenance and multiplicity. EV-012 requires complex challengers to beat simple controls. The gap is to make optimization randomness itself part of the candidate family: seed, checkpoint and retraining realization are trials, not innocuous implementation details.

### Hypothesis H-Q005-STOCH

For stochastic/non-convex strategy learners, recording the complete seed/checkpoint/retraining family and evaluating the distribution of policies will reduce false promotion of favorable optimization realizations compared with winner-only reporting.

### Experiment EXP-Q005-STOCH

On one frozen PIT dataset and fixed hyperparameters:
- run repeated independent seeds;
- preserve every checkpoint considered by the selector;
- compare final-policy reporting, best-seed reporting, distributional reporting, and multiplicity-aware reporting;
- repeat across at least one calm and one high-volatility historical regime without reusing the final untouched holdout for tuning.

Metrics:
- cross-seed Sharpe/return dispersion;
- pairwise allocation distance;
- exposure and turnover dispersion;
- rank stability;
- best-run vs median/mean performance gap;
- family-wise adjusted comparison result;
- DSR or other pre-specified multiplicity diagnostic where assumptions are satisfied;
- retraining policy drift;
- cost-adjusted outcome stability.

Decision: TEST reinforcement under Q-005. No strategy promotion gate changes until results exist.

## 3. Cross-area review

### Design/UX
No new ID. Existing D-005 remains the correct home for exposing provenance progressively. Candidate UI behavior: show “data vintage / methodology changed” as an audit-layer warning rather than adding raw metadata to the primary decision surface. Classification: REFERENCE.

### AI/ML
No new ID. AIML-005/006 should treat model seed/checkpoint/harness versions as evaluation provenance where stochasticity exists. Classification: REFERENCE.

### Market & Data Infrastructure
SEC EDGAR timing semantics reinforce the existing requirement that accepted_at, observed_at and publicly-available time are not silently collapsed. Classification: REFERENCE → DI-003/DI-006.

### Product/Competitor
Current institutional finance-AI products continue to emphasize citations, connected data and auditability, but no new product evidence reviewed this cycle justifies a BO architecture change. Classification: REVIEWED / no action.

### Evidence & Validation
Vintage sensitivity creates a distinct uncertainty source from forecast calibration: the benchmark/reference series itself can move retrospectively. Keep this as data provenance evidence, not as an EV-010 calibration score. Classification: REFERENCE.

## Traceability

Research (Akey et al.; SEC) → H-DI003-VINTAGE → EXP-DI003-VINTAGE → PENDING → ADOPT / REJECT / REVISIT

Research (Grądzki) → H-Q005-STOCH → EXP-Q005-STOCH → PENDING → ADOPT / REJECT / REVISIT

## Cycle decision

- New IDs: 0
- New ADOPT: 0
- New REJECT: 0
- DI-003: TEST strengthened
- Q-005: TEST strengthened
- Production/paper trading behavior: unchanged
- Highest-priority next action: implement/close the DI-001 + DI-003 executable PIT fixture, including a mutable-reference-data vintage fault, then use the same frozen fixture for Q-005 stochastic-policy evaluation.
