# BOR-S9 Specialist / Red Team / Research Council Review

Date: 2026-09-21
Status: EXPERIMENT — pending CI

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- DI-001/003/004 require explicit schema identity, point-in-time lineage, stable Evidence fingerprints and provenance.
- AIML-005 requires grounded financial-agent evaluation where unsupported citations are observable.
- AIML-006 constrains Council topology to remain downstream of correct Organizer/Analyst grounding.
- BOR-S8-E1 is the adopted upstream precedent: verified canonical material, bundle-bound citations, explicit counterevidence/data gaps and zero execution/publication authority.
- Legacy BOT #200 remains conceptual migration precedent only; no BOT runtime, database, trading or commercial authority is imported.

### Hypothesis — BOR-S9-H1
A bounded evaluation layer can add Specialist review, adversarial Red Team challenge and Council synthesis while preserving grounded Evidence lineage, disagreement and data gaps, and while failing closed on invented citations, chronology errors and authority escalation.

### Experiment — BOR-S9-E1
Implemented deterministic contracts for:
1. `bor.specialist-review.v1`,
2. `bor.red-team-challenge.v1`,
3. `bor.research-council.v1`,
4. actor method/prompt identity,
5. bundle-bound verified Evidence references,
6. Red Team contradicting-Evidence enforcement,
7. upstream review lineage and chronology,
8. explicit unresolved disagreements and inherited data gaps,
9. `INSUFFICIENT_DATA` Council outcome,
10. invariant `executionAuthority=false` and `reportPublicationAuthority=false`.

### Result
Pending GitHub CI. Local/runtime-independent contract verification is represented by deterministic Node tests in `src/researchCouncil.test.ts`.

### Adopt / Reject
Pending CI and artifact verification. Do not adopt until green.

## Authority statement
S9 grants no report-publication, trading, order, portfolio, BOT database, broker-secret or Risk authority. It adds no LLM/provider call or production database mutation.
