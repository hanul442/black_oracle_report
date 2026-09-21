# BOR Report Artifact / Archive Contract v1

Status: ALPHA EXPERIMENT
Schema: `bor.report-artifact.v1`

## Canonical flow
`Evidence → ResearchBundle → AnalystReview → Specialist/RedTeam → ResearchCouncilDecision → ThesisScenarioArtifact → ReportArtifact → ReportArchive`

## Contract
A ReportArtifact is an immutable, versioned research/report artifact. It must preserve S10 thesis and Bull/Base/Bear scenarios, explicit catalysts/risks/invalidation conditions, unresolved disagreements and data gaps. Its citation set is mechanically derived as the canonical union of all scenario supporting and contradicting Evidence IDs; every citation must remain material-verified in the upstream ResearchBundle.

The artifact records stable bundle/review/council/thesis lineage, cannot predate its thesis, and receives a deterministic SHA-256 content fingerprint over the canonical report payload. `executionAuthority=false` and `reportPublicationAuthority=false` are invariant.

ReportArchive is append-only at the contract boundary. It rejects report-ID reuse, fingerprint tampering, and non-monotonic version/asOf progression inside a report series. Historical versions remain addressable.

## Safety / product boundary
This is a research/report integrity boundary, not a publisher or trading component. It cannot hold broker credentials, submit orders, mutate BOT portfolio state, bypass Risk, invoke providers, publish externally, or grant capital/publication authority.

## Evaluation
BOR-S11-E1 must pass deterministic lineage, citation, chronology, authority, fingerprint and archive-version tests before ADOPT.
