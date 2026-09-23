# BLACK ORACLE R&D Cycle 014 — Evidence Transformation Lineage

Date: 2026-09-23
Status: TEST / REFERENCE
Research ID: DI-006
Hypothesis ID: H-DI006
Experiment ID: EXP-DI006

## Research question

Can BLACK ORACLE prove not only which source supported a report claim, but exactly which deterministic/AI transformations, code versions, prompts, models and intermediate artifacts produced that claim?

## New material reviewed

### OpenLineage 1.53 — lineage facets
**Evidence quality: HIGH (official open specification/documentation).**

OpenLineage models lineage around Run, Job and Dataset entities and supports explicit dataset/job/field-level dependency edges. Its current lineage facets avoid a dangerous shortcut: inferring that every input to a multi-output job caused every output. Custom facets are versioned and can carry project-specific metadata; source-code location can bind a run to Git coordinates.

Useful BOR implication: provenance should be a graph of actual transformations, not a flat list of citations attached to final prose.

### W3C PROV
**Evidence quality: HIGH (W3C Recommendation / conceptual standard).**

W3C PROV separates entities, activities and responsible agents and explicitly models derivation and provenance bundles. This is a strong conceptual match for BOR's source/evidence/report chain, but adopting the complete standard would be unnecessary complexity at the current stage.

### MLflow agent evaluation/tracing
**Evidence quality: HIGH for implementation reference (mature OSS official docs), MEDIUM for BOR-specific suitability until benchmarked.**

MLflow now evaluates multi-step agent behavior from traces, including tool-call correctness/efficiency, and uses OpenTelemetry-compatible tracing. This reinforces AIML-005/EV-009: final-answer quality alone is insufficient; intermediate trajectories must remain inspectable.

### Feast point-in-time retrieval
**Evidence quality: HIGH for feature-store semantics (official docs).**

Feast historical retrieval explicitly performs point-in-time joins relative to entity timestamps. This reinforces DI-003 but is not a reason to add Feast to BOR now.

### Quant / execution references
Existing Q-002/EV validation work already covers cost/fill realism; no sufficiently non-duplicative architecture change was found this cycle. **Classification: REFERENCE; no new ID.**

### Design/UX and Product/Competitor scan
No source reviewed this cycle justified a new design or competitor architecture item beyond D-005 progressive disclosure and AIML-005/EV-009 evaluation/observability. **Classification: REFERENCE / REJECT-AS-DUPLICATE.**

## Comparison with current BOR implementation

BOR already has `bor.evidence.v1`, deterministic ingestion goals, append-only EvidenceStore, fingerprints, duplicate lineage, point-in-time semantics and a three-layer Decision → Why → Audit presentation direction. The S5 research contract explicitly requires provenance, timestamps, deterministic Evidence IDs and duplicate lineage.

The gap is **transformation provenance after ingestion**. A citation can identify a source, but does not by itself prove:

1. which evidence subset entered a specific analysis;
2. which transformation or agent step produced an intermediate artifact;
3. which code/prompt/model/tool version produced that step;
4. whether a final claim can be traced to the exact upstream evidence edges rather than merely co-occurring sources;
5. whether replay used the same transformation graph.

## Proposed contract — `bor.lineage.v1`

Do **not** adopt OpenLineage wholesale. Use a thin BOR-native manifest whose semantics can later map to OpenLineage/W3C PROV.

Minimum fields:

- `lineage_id`
- `run_id`
- `activity_id` / `activity_type`
- `input_artifact_ids[]`
- `output_artifact_ids[]`
- `started_at` / `ended_at`
- `code_git_sha`
- `contract_version`
- `prompt_hash` when AI-mediated
- `model_provider` / `model_id` / `model_version` when available
- `tool_name` / `tool_version` when applicable
- `parameters_hash`
- `source_snapshot_ids[]`
- `parent_lineage_ids[]`
- `status` (`COMPLETE`, `FAIL`, `ABORT`)

Privacy rule: hashes/IDs are preferred over storing raw prompts, credentials, private tool payloads or licensed source content in lineage metadata.

## Hypothesis — H-DI006

If every material BOR transformation emits an immutable lineage edge tied to exact input/output artifact IDs and execution versions, then a blind auditor can reconstruct the dependency graph of a final claim and detect incorrect/missing source-to-claim edges without reading operator notes.

## Experiment — EXP-DI006

Use one archived BOR report fixture after DI-001/DI-003 foundations are executable.

Conditions:

A. Current flat provenance/citation metadata.
B. `bor.lineage.v1` run-level edges only.
C. `bor.lineage.v1` with claim/evidence edges for material report claims.

Seed faults:

1. valid source present in report bundle but not actually used for the claim;
2. wrong intermediate artifact linked to a claim;
3. prompt/model version changed during replay;
4. one transformation step omitted;
5. two outputs incorrectly inferred from all inputs (false Cartesian lineage);
6. stale snapshot substituted during replay;
7. failed/aborted run incorrectly treated as valid provenance.

### Success metrics

- seeded lineage fault detection: **100%** for hard positive controls;
- final material claims with a path to source snapshot(s): **100%**;
- replay version mismatch detection: **100%**;
- false provenance edges in clean fixture: **0**;
- lineage completeness check is deterministic and network-free;
- metadata overhead remains small enough that report generation p95 latency does not materially regress; measure first, set a production threshold only after baseline.

## Implementation path

1. Add a schema-only `bor.lineage.v1` contract and validator.
2. Instrument deterministic ingestion/transformation boundaries first.
3. Bind run metadata to Git SHA and contract version.
4. Add AI-step metadata only after AIML tracing privacy rules are settled.
5. Add claim-level edges only for material claims, not every token/sentence.
6. Expose lineage only in the Audit layer; do not increase default UI density.
7. Later evaluate an OpenLineage adapter. Do not make an external lineage service a runtime dependency yet.

## Risks

- lineage explosion / storage overhead;
- false confidence from mechanically complete but semantically wrong edges;
- leaking prompts or licensed/private source content;
- coupling BOR contracts to an external standard too early;
- instrumentation latency and developer burden.

Mitigation: thin immutable IDs/hashes, deterministic validators, explicit materiality boundary, no raw secret-bearing payloads, and an adapter rather than canonical dependency on OpenLineage.

## Decision

**TEST.** Adopt the experiment and schema candidate, not production behavior. OpenLineage/W3C PROV/MLflow/Feast remain **REFERENCE** until BOR-specific tests justify integration.

No production trading, paper-trading, model-routing, strategy-ranking or authority behavior changes are authorized by this research item.

## Traceability

`DI-006 → H-DI006 → EXP-DI006 → PENDING → ADOPT / REJECT / REVISIT`
