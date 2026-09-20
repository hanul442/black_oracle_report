# 2026-09-21 BOR Bootstrap Research Review

Purpose: translate the existing BLACK ORACLE R&D ledger into BOR-specific implementation constraints.

## Reviewed research

### DI-001 — Canonical experiment record
BOR implication: research transformations, prompts/models/tools and report generation should be versioned and replayable rather than stored only as final prose.

### DI-003 — Point-in-time availability
BOR implication: every evidence item needs both the event/publication timestamp and the observation/ingestion context needed to answer "what was knowable then?"

### DI-004 — Snapshot-addressable replay
BOR implication: source fingerprints and retrievable snapshot references should support later report replay and citation audits where licensing/storage allow.

### AIML-005 — Financial-agent evaluation harness
BOR implication: Collector/Analyst/Specialist/Red Team/Council changes require a fixed evaluation suite measuring groundedness, task accuracy, citation quality, cost, latency and failure modes.

### AIML-006 — Council coordination ablation
BOR implication: multi-agent research is not assumed superior. Single-agent, specialist and Council variants must be compared under matched information/tool/compute budgets.

### D-005 — Progressive disclosure
BOR implication:
1. **Conclusion / Decision surface**
2. **Why / Evidence + Counter-evidence**
3. **Audit / Sources + versions + experiment lineage**

## Decision for today's sprint

BOR begins with provenance and evidence contracts, not report styling and not agent headcount expansion.

First technical implementation after bootstrap:
`source → canonical evidence → provenance/timestamps → fingerprint → duplicate/stale control → Evidence Store`.

Trading authority impact: **None; BOR has no trading authority.**
