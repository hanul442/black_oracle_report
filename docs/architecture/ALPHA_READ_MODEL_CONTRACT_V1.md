# Alpha Read Model Contract v1

Schema: `bor.alpha-read-model.v1`

## Purpose
Provide one deterministic, read-only consumer contract for Alpha UI/API surfaces downstream of canonical report/export artifacts. The projection is presentation-ready metadata, not a new research synthesis layer.

## Required gate
Creation requires a `bor.report-consistency.v1` PASS matching the supplied report/export pair. The implementation independently re-runs S14 consistency verification before projection so a stale PASS cannot authorize changed parents.

## Preserved invariants
- report ID, series ID, version, asOf
- canonical report content fingerprint and export fingerprint
- title, summary, thesis
- exact canonical Evidence citation IDs
- exact Bull/Base/Bear scenarios including contradicting Evidence IDs, catalysts, risks, and invalidation conditions
- unresolved disagreements and data gaps
- deterministic projection content fingerprint

## Authority boundary
`executionAuthority=false`, `reportPublicationAuthority=false`, and `botDependency=false` are fixed. The read model cannot hold broker/exchange credentials, submit orders, mutate BOT state, bypass Risk, publish reports, repair Evidence, or manufacture certainty.

## Consumer rule
Today/Research/Evidence/Oracle/Reports/Library UI/API consumers may render this projection, but must not infer missing Evidence or suppress contradictory Evidence, disagreements, or data gaps. Markets/Watchlist surfaces that require additional market/watchlist contracts remain separate Alpha work packages.
