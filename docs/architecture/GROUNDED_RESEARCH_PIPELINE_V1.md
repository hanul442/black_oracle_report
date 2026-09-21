# BOR Grounded Research Pipeline Contract v1

Status: ALPHA CONTRACT
Schemas:
- `bor.research-bundle.v1`
- `bor.analyst-review.v1`

## Purpose

Create the deterministic trust boundary between canonical Evidence and later AI research agents. This contract intentionally precedes Specialist, Red Team, Council and report-publication runtimes.

## Organizer boundary

The Organizer receives canonical BOR Evidence plus optional analysis material.

For each Evidence item it preserves:
- Evidence ID,
- source identity/version,
- publisher,
- published/observed timestamps,
- retrieval URI and snapshot reference,
- asset resolution state,
- content fingerprint,
- explicit disposition: `SUPPORTING | CONTRADICTING | CONTEXT | UNRESOLVED`.

### Material verification

An Evidence item is `materialVerified=true` only when:
1. the material Evidence ID matches the packet,
2. the declared material fingerprint equals the stored Evidence fingerprint,
3. recomputing SHA-256 from canonical analysis content equals the stored Evidence fingerprint.

If material is absent, the Organizer retains the Evidence but adds:
`MISSING_CANONICAL_CONTENT:<evidenceId>`

No synthetic content is created.

## Point-in-time boundary

`knowledgeCutoff <= asOf`.

Any Evidence whose `observedAt` is after the knowledge cutoff is rejected. This prevents later knowledge from entering a historical research bundle.

## Analyst Review boundary

A review:
- references exactly one research bundle,
- has versioned analyst identity/method/prompt metadata,
- preserves facts, inferences and assumptions separately,
- preserves supporting Evidence, counterevidence, context Evidence and data gaps separately,
- may cite only Evidence already present in the bundle,
- may cite only material-verified Evidence,
- cannot cite CONTRADICTING Evidence as supporting or vice versa,
- cannot cite one Evidence ID in multiple citation classes.

Missing or contradictory Evidence therefore remains inspectable instead of being collapsed into prose.

## Authority

Both contracts fix:
- `executionAuthority=false`
- `reportPublicationAuthority=false`

They do not call an LLM, publish a report, submit an order, mutate BOT, access broker secrets or grant Risk authority.

## Downstream

Specialist / Red Team / Research Council contracts must consume these grounded AnalystReview artifacts rather than raw unverified text.
