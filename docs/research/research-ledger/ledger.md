# BLACK ORACLE Research Ledger

Last updated: 2026-09-23

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

## DI-006 trace

**Research:** OpenLineage 1.53 lineage facets + W3C PROV + MLflow agent trace/evaluation patterns show that explicit input→activity→output edges are stronger than flat provenance lists for reconstructing how an artifact was produced.

**Hypothesis H-DI006:** immutable, version-bound lineage edges will let a blind auditor reconstruct source-to-claim dependencies and detect missing/incorrect transformation edges.

**Experiment EXP-DI006:** compare flat provenance vs run-level lineage vs material claim/evidence lineage on an archived BOR report with seeded provenance faults.

**Result:** PENDING.

**Decision:** TEST. No production integration or trading behavior change.

Detailed record: `docs/research/data-infrastructure/cycle-014-evidence-transformation-lineage.md`.

## Current implementation priority

1. Close DI-001 + DI-003 deterministic replay / point-in-time validation.
2. Reuse that fixture for DI-006 lineage fault injection rather than building a separate harness.
3. Keep AIML/Council changes behind fixed evaluation and traceability gates.
4. Do not add infrastructure products merely because they implement a useful standard; prefer BOR-native contracts plus adapters until experiments show operational value.

## Ledger hygiene

- Do not create a new ID when new material only reinforces an existing hypothesis.
- Preserve rejected/revisited items rather than deleting history.
- A source citation is not equivalent to a transformation edge.
- A passing LLM judge is not deterministic validation.
- Production/paper trading behavior cannot change from a research status transition alone.
