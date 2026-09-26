# Cycle 023 — Temporal Knowledge Boundary for Financial Agents

Date: 2026-09-27
Status: TEST
ID: AIML-007

## Research question

Can BLACK ORACLE replay a historical research/decision run without allowing the language model itself to leak facts learned after the decision timestamp?

## What is new

DI-003 governs point-in-time availability of retrieved market/evidence data, but a temporally unrestricted LLM may already encode future information in its parameters. Kelly, Malamud, Schwab and Xu (NBER Working Paper 35247, May 2026) explicitly identify this look-ahead channel and construct monthly point-in-time language-model checkpoints. Their results show that chronological training can substantially narrow, though not eliminate, the capability gap versus unrestricted models.

This creates a separate temporal boundary from data PIT semantics:

1. evidence/data availability time;
2. model knowledge/training boundary;
3. tool/query execution time.

A replay that freezes only (1) can still be temporally contaminated by (2).

## Evidence reviewed

### Scaling Point-in-Time Language Models — NBER WP 35247
Evidence quality: HIGH for problem formulation and controlled research evidence; working paper, not treated as production proof.
Classification: TEST / REFERENCE.
Use: motivates a model-knowledge-boundary manifest and leakage test.

### Replayable Financial Agents / DFAH
Evidence quality: MEDIUM-HIGH; 4,700+ agent runs across multiple models/providers, but preprint.
Classification: REFERENCE.
Use: supports measuring decision determinism separately from correctness. Deterministic replay is not evidence of temporal validity.

### FinToolBench
Evidence quality: MEDIUM; large runnable finance-tool benchmark, preprint.
Classification: REFERENCE.
Use: supports evaluating timeliness, tool selection and finance-specific execution rather than answer quality alone.

### FinStressTS
Evidence quality: MEDIUM; synthetic mechanism-aware benchmark, preprint.
Classification: REFERENCE.
Use: reinforces seeded-fault evaluation and simple baselines; no new BO ID because EV-012/Q-008 already cover that role.

### DARE / IEEE TVCG 2026
Evidence quality: HIGH; peer-reviewed visualization research.
Classification: REFERENCE to D-005/EV-011.
Use: reinforces agency-preserving progressive disclosure; no new UX architecture.

## Architecture comparison and gap

Existing BO:
- DI-003: point-in-time data/evidence semantics.
- DI-006: transformation lineage.
- AIML-005: financial-agent evaluation harness.
- EV-010/011: uncertainty calibration and cause-aware routing.

Gap:
No canonical field currently proves what temporal knowledge boundary the reasoning model had at the historical decision timestamp. Provider model names and prompt hashes are insufficient because a current model can answer a 2023 replay using facts learned in 2024–2026.

## Hypothesis H-AIML007

Adding an explicit model-knowledge-boundary manifest and temporal-leakage challenge set will detect historical replays that pass data PIT checks but rely on post-cutoff parametric knowledge.

## Experiment EXP-AIML007

Use archived historical BO-style research tasks with decision timestamps and a sealed answer key of post-cutoff facts.

Conditions:
A. current unrestricted model + PIT tools/evidence;
B. current unrestricted model + explicit “only use supplied evidence” instruction;
C. current model + evidence-grounded answer gate that requires every material historical claim to map to PIT evidence;
D. point-in-time model/checkpoint where available, using the same PIT evidence and task.

Seeded faults:
- ask about an issuer before a later earnings surprise;
- later corporate action encoded in model knowledge;
- post-cutoff macro revision;
- renamed/reclassified entity known only later;
- post-cutoff consensus narrative;
- tool results are clean PIT while the model supplies an unsupported future fact.

Metrics:
- seeded temporal-leak detection recall;
- unsupported post-cutoff material-claim rate;
- false rejection of valid PIT claims;
- claim-to-PIT-evidence coverage;
- decision/output divergence between unrestricted and PIT-model conditions;
- replay determinism measured separately from temporal validity;
- latency/cost overhead.

No pass threshold is invented before baseline distributions are measured.

## Proposed implementation path

Add a BOR-native manifest, not a new infrastructure product:

`bo.model_knowledge_boundary.v1`
- model/provider/version identifier;
- declared or experimentally bounded knowledge cutoff when available;
- checkpoint/build identifier;
- run timestamp;
- decision timestamp;
- PIT evidence snapshot IDs;
- material-claim evidence edges;
- temporal-boundary test result;
- limitations/unknown-cutoff flag.

If the provider does not expose a trustworthy cutoff, record UNKNOWN rather than infer one. In historical replay, UNKNOWN must remain visible and cannot be silently treated as PIT-safe.

## Risks

- Published provider cutoffs may be approximate.
- Retrieval grounding can reduce but not prove absence of parametric leakage.
- PIT model checkpoints may be expensive or unavailable.
- A strict evidence gate can reject useful background knowledge.
- The experiment must not turn temporal validity into a single opaque score.

## Trace

Research → H-AIML007 → EXP-AIML007 → PENDING → ADOPT / REJECT / REVISIT

Decision: TEST. No production/paper trading behavior, routing, sizing, NO-TRADE logic, or model promotion is changed.
