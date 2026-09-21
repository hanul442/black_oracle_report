# BOR Thesis / Scenario Contract v1

Status: ALPHA EXPERIMENT
Schema: `bor.thesis-scenario.v1`

## Purpose
Convert a bounded Research Council decision into a versioned research/report artifact without creating trading or final-publication authority.

## Canonical flow
`ResearchBundle → AnalystReview → Specialist/RedTeam → ResearchCouncilDecision → ThesisScenarioArtifact`

## Contract
A ThesisScenarioArtifact:
- belongs to exactly one ResearchBundle, AnalystReview and ResearchCouncilDecision;
- cannot predate its Council;
- contains exactly one `BULL`, one `BASE`, and one `BEAR` scenario;
- cites only material-verified Evidence from its upstream ResearchBundle;
- restricts `contradictingEvidenceIds` to upstream `CONTRADICTING` Evidence;
- records catalysts, risks and invalidation conditions explicitly per scenario;
- carries Council unresolved disagreements and merged data gaps forward;
- cannot turn an `INSUFFICIENT_DATA` Council decision into a directional thesis;
- is immutable at the artifact/scenario-array boundary;
- fixes `executionAuthority=false` and `reportPublicationAuthority=false`.

## Safety / product boundary
This contract structures research. It cannot hold broker credentials, submit orders, mutate BOT portfolio state, bypass Risk, invoke a provider, publish a final report, or grant capital authority.

## Evaluation
BOR-S10-E1 must pass deterministic citation-membership, contradictory-disposition, chronology, scenario-cardinality and authority-escalation tests before ADOPT.
