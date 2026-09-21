# BOR-S11 Report Artifact / Archive Research Review

Date: 2026-09-21
Status: EXPERIMENT

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **DI-001:** every downstream artifact needs explicit schema identity, stable parent lineage and version identity.
- **DI-003:** downstream artifacts cannot cite outside the upstream point-in-time knowledge state.
- **DI-004:** canonical Evidence IDs remain the citation lineage across transformations.
- **AIML-005:** invented/unsupported citations must remain mechanically detectable.
- **AIML-006:** Council output is evaluation, not truth; disagreement, abstention and uncertainty must survive report transformation.
- **BOR-S8-E1:** verified material, citation membership/disposition, chronology and no-authority checks are upstream invariants.
- **BOR-S9-E1:** Council counterevidence, unresolved disagreement/data gaps and `INSUFFICIENT_DATA` survive downstream; no execution/publication authority.
- **BOR-S10-E1:** thesis/scenario artifact constrains report-ready synthesis to exactly Bull/Base/Bear, explicit catalysts/risks/invalidation, verified citations and contradictory Evidence.

### Hypothesis — BOR-S11-H1
A deterministic versioned report artifact plus append-only archive can make S10 synthesis render/export-ready while mechanically preserving point-in-time evidence lineage, uncertainty and version history without granting publication or trading authority.

### Experiment — BOR-S11-E1
Implement `bor.report-artifact.v1` and archive contract with:
1. stable bundle/review/council/thesis lineage and chronology,
2. canonical citation union derived from scenario evidence/counterevidence,
3. preserved thesis/scenarios/catalysts/risks/invalidation/disagreements/data gaps,
4. deterministic content fingerprint over canonical payload,
5. immutable artifacts and append-only version series,
6. rejection of artifact-ID reuse, fingerprint tampering and non-monotonic version/asOf updates,
7. authority flags fixed false,
8. deterministic negative tests.

### Production boundary
No provider call, broker credential, order, portfolio mutation, BOT dependency, Risk bypass, public publishing, PDF side effect, migration or deployment mutation.

### Result
Implemented `bor.report-artifact.v1` and append-only `ReportArchive`. During verification, deterministic tests exposed the existing S9 abstention constraint in the fixture and manual review exposed a fingerprint-domain mismatch between artifact creation and archive verification. Both were corrected. CI #48 passed typecheck, build, and the full test suite, including S11 authority, chronology, lineage, fingerprint tamper, duplicate-ID, and monotonic version/asOf checks.

### Adopt / Reject
**ADOPT — BOR-S11-E1.** The report artifact/archive contract preserves canonical citation lineage, uncertainty, immutable version history, and zero execution/publication authority. PDF/UI/database persistence remain separate later gates.
