# BOR-S8 Organizer / Research Analyst Research Review

Date: 2026-09-21
Status: ADOPT

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **DI-001:** every research transformation should have explicit schema identity and stable Evidence lineage.
- **DI-003:** historical analysis may only use Evidence observable by the declared knowledge cutoff.
- **DI-004:** replay requires stable Evidence IDs, content fingerprints and provenance.
- **AIML-005:** financial-agent quality must be measured on grounded tasks; unsupported citations must be observable.
- **AIML-006:** Council topology is downstream; Organizer/Analyst correctness must work before adding more agents.
- Legacy BOT **#200** provided conceptual precedents for AnalystReview, supporting/counterevidence, assumptions, data gaps and versioned analyst identity, but its combined-product runtime/commercial layers were not imported.
- BOR-S2/S5/S6 remain canonical for Evidence identity, ingestion and explicit partial failure.

### Key gap found
Current `bor.evidence.v1` preserves fingerprint/provenance but does not directly persist canonical text in the Evidence packet. Therefore S8 does not accept arbitrary analysis text. Supplied material must hash to the stored Evidence fingerprint. Missing material stays a visible data gap.

### Hypothesis — BOR-S8-H1
A deterministic Organizer boundary can bind analysis material to Evidence fingerprints and preserve supporting, contradicting, contextual and unresolved Evidence explicitly. An AnalystReview contract can then fail closed on invented/mismatched citations without publication or trading authority.

### Experiment — BOR-S8-E1
Implemented:
1. `bor.research-bundle.v1`,
2. verified Evidence analysis material,
3. explicit Evidence disposition,
4. point-in-time knowledge cutoff validation,
5. automatic data-gap preservation for missing material,
6. `bor.analyst-review.v1`,
7. citation membership/material/disposition checks,
8. deterministic tests.

### Result
**PASS.**

BOR CI #28:
- TypeScript typecheck PASS,
- build PASS,
- full repository tests PASS.

Tests verify:
- canonical-content fingerprint mismatch fails closed,
- Evidence observed after knowledge cutoff fails closed,
- missing canonical material becomes a data gap and cannot support a citation,
- invented Evidence citations fail closed,
- counterevidence remains explicit,
- disposition relabeling fails closed,
- execution/report-publication authority escalation fails closed.

### Adopt / Reject
**ADOPT for Alpha research-pipeline contract use.**

This adoption does not activate an LLM, Specialist, Red Team, Council, report publication, trading behavior or infrastructure authority.

## Authority statement
No report-publication, trading, order, portfolio, BOT database, broker-secret or Risk authority is granted by S8.
