# BLACK ORACLE Research Ledger

Last updated: 2026-09-24

This file is the repository-level index for the R&D pipeline. Detailed sprint/research documents remain the evidence of record. Status changes require an explicit result; a proposed experiment is not an adoption.

## Status vocabulary

`DISCOVERED` → `REVIEWED` → `TEST` → `ADOPT | REJECT | REVISIT`

`REFERENCE` is supporting material that does not itself enter the adoption pipeline.

## Active ledger

| ID | Area | Item | Status | Hypothesis | Experiment | Result | Decision |
|---|---|---|---|---|---|---|---|
| DI-001 | Data Infrastructure | Canonical experiment / replay record | TEST | existing bootstrap research | repository implementation/replay validation | pending | pending |
| DI-003 | Data Infrastructure | Point-in-time availability semantics | TEST | existing bootstrap research | timestamp/leakage validation | pending | pending |
| DI-004 | Data Infrastructure | Snapshot-addressable replay | TEST / REFERENCE | existing bootstrap research | snapshot replay validation | pending | pending |
| AIML-005 | AI/ML | Financial-agent evaluation harness | TEST | fixed evaluation suite improves safe comparison | golden-task evaluation | pending | pending |
| AIML-006 | AI/ML | Council coordination ablation | TEST | multi-agent must outperform simpler baselines under matched budgets | matched-budget ablation | pending | pending |
| D-005 | Design/UX | Progressive disclosure: Decision → Why → Audit | REFERENCE / TEST | layered evidence improves decision usability without hiding auditability | UI evaluation pending | pending | pending |
| DI-006 | Data Infrastructure / Evidence | Evidence transformation lineage | TEST | H-DI006 | EXP-DI006 | pending | pending |
| Q-005 | Quant / Validation | Strategy search provenance & multiplicity control | TEST | H-Q005 | EXP-Q005 | pending | pending |

## DI-006 trace

**Research:** OpenLineage 1.53 lineage facets + W3C PROV + MLflow agent trace/evaluation patterns show that explicit input→activity→output edges are stronger than flat provenance lists for reconstructing how an artifact was produced.

**Hypothesis H-DI006:** immutable, version-bound lineage edges will let a blind auditor reconstruct source-to-claim dependencies and detect missing/incorrect transformation edges.

**Experiment EXP-DI006:** compare flat provenance vs run-level lineage vs material claim/evidence lineage on an archived BOR report with seeded provenance faults.

**Result:** PENDING.

**Decision:** TEST. No production integration or trading behavior change.

Detailed record: `docs/research/data-infrastructure/cycle-014-evidence-transformation-lineage.md`.

## Q-005 trace

**Research:** Peer-reviewed financial multiple-testing literature, DSR/backtest-overfitting research, and 2026 multiplicity-aware studies show that the evidential strength of a selected strategy depends on the search process that produced it, not only the winning backtest. Recent robustness-score work is useful as an audit pattern but its own unseen-market test did not establish forward predictability; BO therefore must not turn a composite robustness grade into an alpha score.

**Hypothesis H-Q005:** recording complete Strategy Factory search provenance and applying search-aware diagnostics will reduce false promotion of lucky winners from large candidate families while preserving candidates that remain stable on an untouched holdout.

**Experiment EXP-Q005:** compare winner-only reporting vs search-manifest reporting vs multiplicity-aware diagnostics vs a frozen-search + untouched-holdout condition using synthetic/archived fixtures with seeded hidden trials, best-seed selection, checkpoint cherry-picking, OOS reuse, dependent strategy mutations, and regime-specific winners.

**Result:** PENDING.

**Decision:** TEST. No production/paper strategy ranking, routing, or trading behavior change.

Detailed record: `docs/research/quant/cycle-015-strategy-search-provenance-and-multiplicity-control.md`.

## Current implementation priority

1. Close DI-001 + DI-003 deterministic replay / point-in-time validation.
2. Reuse that fixture for DI-006 lineage fault injection rather than building a separate harness.
3. Add Q-005 search provenance to Strategy Factory / Experiment Ledger design before automated strategy generation scales up; run EXP-Q005 on synthetic/archived fixtures before making it a promotion gate.
4. Keep AIML/Council changes behind fixed evaluation and traceability gates.
5. Do not add infrastructure products merely because they implement a useful standard; prefer BOR-native contracts plus adapters until experiments show operational value.

## Ledger hygiene

- Do not create a new ID when new material only reinforces an existing hypothesis.
- Preserve rejected/revisited items rather than deleting history.
- A source citation is not equivalent to a transformation edge.
- A passing LLM judge is not deterministic validation.
- A winning backtest is not sufficient evidence unless the search process that produced it is recorded.
- Composite robustness scores are reporting aids, not estimates of future-profit probability.
- Production/paper trading behavior cannot change from a research status transition alone.
