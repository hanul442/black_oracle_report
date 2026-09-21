# BOR Research Council Contract v1

Status: ALPHA EVALUATION CONTRACT

Schemas:
- `bor.specialist-review.v1`
- `bor.red-team-challenge.v1`
- `bor.research-council.v1`

## Purpose

Define grounded downstream evaluation artifacts on top of `bor.analyst-review.v1` before any provider-backed multi-agent runtime is enabled.

## Canonical flow

`ResearchBundle → AnalystReview → SpecialistReview(s) → RedTeamChallenge(s) → ResearchCouncilDecision`

## Specialist Review

A SpecialistReview:
- belongs to exactly one AnalystReview;
- carries versioned actor/method/prompt identity;
- cannot predate the AnalystReview;
- may cite only Evidence present in the upstream ResearchBundle;
- may cite only material-verified Evidence;
- preserves explicit data gaps;
- has no execution/publication authority.

## Red Team Challenge

A RedTeamChallenge:
- belongs to exactly one AnalystReview;
- records the strongest counterargument;
- cites only material-verified Evidence classified upstream as `CONTRADICTING`;
- preserves unresolved questions and invalidation conditions;
- cannot predate its parent review;
- has no execution/publication authority.

## Research Council

A Council decision:
- belongs to exactly one AnalystReview;
- accepts only valid Specialist/Red-Team schema versions with authority flags fixed false;
- rejects duplicate Specialist review IDs or Red Team challenge IDs;
- rejects members created after the Council timestamp or linked to a different parent review;
- preserves full member artifacts, unresolved disagreements and merged data gaps;
- may return `INSUFFICIENT_DATA`;
- if no Specialist or Red Team artifact exists, it must return `INSUFFICIENT_DATA`;
- has no execution/publication authority.

## Evaluation role

S9 is an evaluation boundary, not a claim that Council improves outcomes. AIML-005/AIML-006 must later compare:
- single grounded Analyst,
- uncoordinated Specialists,
- structured Council,
- Council + disagreement/NO_ACTION style abstention,

under matched evidence/budget with groundedness, calibration/abstention, cost, latency and downstream usefulness measured.

## Authority

All S9 artifacts fix:
- `executionAuthority=false`
- `reportPublicationAuthority=false`

No S9 artifact can submit an order, mutate BOT, bypass Risk, publish a final report or create capital authority.
