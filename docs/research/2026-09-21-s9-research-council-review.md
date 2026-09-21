# BOR-S9 Specialist / Red Team / Research Council Research Review

Date: 2026-09-21
Status: TEST

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **DI-001:** every downstream research artifact needs explicit schema/method identity and stable parent lineage.
- **DI-003:** downstream artifacts may not introduce evidence later than the upstream knowledge state.
- **DI-004:** Evidence IDs/fingerprints/provenance remain the canonical citation lineage through Specialist, Red Team and Council stages.
- **AIML-005:** grounded-agent evaluation requires unsupported or invented citations to remain mechanically detectable.
- **AIML-006:** Council topology is an experimental variable. More agents are not assumed to be better; Council artifacts must remain bounded, comparable and authority-free.
- **BOR-S8-E1:** verified canonical material, citation membership/disposition, point-in-time and no-authority checks are adopted upstream invariants.
- Legacy BOT **#200** is useful only as a precedent for AnalystReview/Debate/Lead synthesis structure. Combined-product runtime, commercial logic and any implicit publication authority are not canonical for BOR.

### Hypothesis — BOR-S9-H1
Deterministic Specialist, Red Team and Council artifacts can preserve disagreement and counterevidence while enforcing upstream citation/chronology/authority constraints, providing a stable evaluation surface for later AIML-005/006 ablation before any live multi-agent orchestration is enabled.

### Experiment — BOR-S9-E1
Implement:
1. `bor.specialist-review.v1`,
2. `bor.red-team-challenge.v1`,
3. `bor.research-council.v1`,
4. verified Evidence citation membership,
5. Red Team citations restricted to CONTRADICTING Evidence,
6. unique member/review IDs and parent chronology,
7. forged member schema/authority rejection,
8. explicit data-gap/disagreement preservation,
9. empty Council allowed only as `INSUFFICIENT_DATA`,
10. deterministic tests.

### Production boundary
No LLM/provider call, report publication, trading/order/portfolio authority, BOT DB dependency, Risk bypass, database migration or deployment mutation.

### Result
Pending final CI verification.

### Adopt / Reject gate
**ADOPT** only if typecheck/build/full tests pass and forged/invented/mis-timed artifacts fail closed while disagreement, counterevidence and data gaps remain inspectable.
