# BOR-S12 Export Integrity Research Review

Date: 2026-09-21
Status: EXPERIMENT

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
PENDING implementation/test/CI.

### Adopt / Reject
PENDING.
