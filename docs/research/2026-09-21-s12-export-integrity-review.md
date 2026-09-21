# BOR-S12 Export Integrity Research Review

Date: 2026-09-21
Status: ADOPTED

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **DI-001:** downstream artifacts require explicit schema and stable parent/version identity.
- **DI-003:** downstream representations cannot expand the point-in-time knowledge state.
- **DI-004:** canonical Evidence IDs remain citation lineage through transformations.
- **AIML-005:** unsupported citations must remain mechanically detectable.
- **AIML-006:** disagreement, abstention and uncertainty must survive presentation transformations.
- **BOR-S8-E1:** verified material, chronology and no-authority are upstream invariants.
- **BOR-S9-E1:** counterevidence, disagreement and data gaps survive Council evaluation.
- **BOR-S10-E1:** Bull/Base/Bear, catalysts, risks and invalidation are explicit report inputs.
- **BOR-S11-E1:** `bor.report-artifact.v1` is the canonical immutable/versioned report source; its fingerprint, citations and uncertainty are verified before archive acceptance.

### Hypothesis — BOR-S12-H1
A deterministic export artifact derived only from a valid S11 ReportArtifact can make BOR render-ready while preventing presentation code from silently changing citations, uncertainty, report identity, or authority.

### Experiment — BOR-S12-E1
Implement `bor.report-export.v1` with:
1. exact S11 parent report ID/series/version/asOf/content fingerprint,
2. canonical copied research payload including scenarios, citations, disagreement and data gaps,
3. deterministic export fingerprint,
4. explicit HTML/PDF format identity without performing external rendering,
5. fail-closed verification of parent fingerprint and authority,
6. export/publication/execution authority fixed false,
7. deterministic negative tests.

### Production boundary
No broker credential, order, BOT dependency, Risk bypass, provider call, public publication, external renderer, database mutation or deployment mutation.

### Result
Implemented `bor.report-export.v1`. PR #17 head `8bcc5b02ab9a3f706b67601ae1af7f957e3436fc` passed GitHub Actions CI #53: dependency install, typecheck, build and full deterministic Node test suite all succeeded. Verification confirms the export derives only from a fingerprint-valid S11 parent and preserves report ID/series/version/asOf, parent content fingerprint, canonical citation IDs, thesis/scenarios, contradictory-evidence references embedded in scenarios, unresolved disagreements and data gaps. Authority remains fixed false and the contract performs no external rendering or publication.

### Adopt / Reject
**ADOPT — BOR-S12-E1.** The deterministic export boundary is suitable as the canonical input to later HTML/PDF rendering. Actual renderer bytes, archive persistence and public publication remain separate gates and must not infer authority from this adoption.
