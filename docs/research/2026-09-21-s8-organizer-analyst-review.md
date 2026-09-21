# BOR-S8 Organizer / Research Analyst Research Review

Date: 2026-09-21  
Status: TEST

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **DI-001:** every research transformation should have explicit schema identity and stable Evidence lineage.
- **DI-003:** historical analysis may only use Evidence observable by the declared knowledge cutoff.
- **DI-004:** replay requires stable Evidence IDs, content fingerprints and provenance.
- **AIML-005:** financial-agent quality must be measured on grounded tasks; an analyst contract should make unsupported citations observable.
- **AIML-006:** Council topology is downstream; Organizer/Analyst correctness must work before adding more agents.
- Legacy BOT **#200** provides useful conceptual precedents for `AnalystReview`, explicit supporting/counterevidence, assumptions, data gaps and versioned analyst identity, but its combined-product runtime and commercial layers are not canonical for BOR.
- BOR-S2/S5/S6 are canonical for Evidence identity, ingestion and explicit partial failure.

### Key gap found
Current `bor.evidence.v1` preserves fingerprint/provenance but does not directly persist canonical text in the Evidence packet. Therefore the research layer must not accept arbitrary analysis text. Any material supplied to an analyst must prove that its canonical content hashes to the Evidence packet's stored fingerprint. Missing material must remain a visible data gap.

### Hypothesis — BOR-S8-H1
A deterministic Organizer boundary can bind analysis material to Evidence fingerprints and produce a research bundle where supporting, contradicting, contextual and unresolved Evidence remain explicit. An AnalystReview contract can then fail closed on invented/mismatched citations without granting publication or trading authority.

### Experiment — BOR-S8-E1
Implement:
1. `bor.research-bundle.v1`,
2. verified Evidence analysis material,
3. explicit Evidence disposition,
4. point-in-time knowledge cutoff validation,
5. automatic data-gap preservation for missing material,
6. `bor.analyst-review.v1`,
7. citation membership/material/disposition checks,
8. deterministic tests.

### Result
Pending implementation + BOR CI.

### Adopt / Reject gate
**ADOPT** only if fingerprint mismatch, future-knowledge use, unknown citations, missing material and authority escalation all fail closed while contradictory Evidence remains explicit. Otherwise **REVISE/REJECT**.

## Authority statement
No report-publication, trading, order, portfolio, BOT database, broker-secret or Risk authority is granted by S8.
