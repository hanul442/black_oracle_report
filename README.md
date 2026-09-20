# BLACK ORACLE REPORT

**Evidence-first AI research and market-intelligence engine.**

BLACK ORACLE REPORT (BOR) is the research product of the BLACK ORACLE project family. It is intentionally separated from BLACK ORACLE BOT so research, evidence synthesis, reports, and archives can evolve without inheriting execution authority.

> **Source → Evidence → Analysis → Challenge → Synthesis → Report → Archive**

## Alpha v0.1

**Target:** 2026-10-20

Alpha v0.1 is successful when BOR can ingest traceable sources, normalize evidence, run a reproducible research/challenge workflow, produce a versioned report with citations, and archive that report for later comparison.

### Alpha scope

- Source and NARS/news ingestion
- Canonical asset mapping
- Evidence Store
- Provenance, published/observed timestamps, content fingerprints
- Duplicate and stale-evidence controls
- Collector / Organizer / Research Analyst / Specialist agents
- Independent Red Team and Research Council
- Thesis + Bull / Base / Bear scenarios
- Catalysts, risks, and contradicting evidence
- Today / Markets / Research / Evidence / Oracle / Reports / Library / Watchlist surfaces
- Versioned report archive
- Citation integrity and PDF/export rendering

### Explicit non-scope

- Broker credentials
- Order placement
- Portfolio mutation
- Trading Risk bypass
- Any requirement that BLACK ORACLE BOT be online

BOR may publish evidence that BOT can consume through an explicit, versioned contract. It never grants trading authority.

## Product principles

1. **Evidence before prose.** Every material claim should have traceable source lineage.
2. **Unknown stays unknown.** Missing evidence is not filled with fabricated certainty.
3. **Challenge is first-class.** Counter-evidence and disagreement are preserved.
4. **Reports are versioned artifacts.** Historical reports are never silently rewritten.
5. **Research is evaluated.** Agent/Council changes require reproducible evaluation, not anecdotal demos.
6. **Independent product boundary.** BOR owns research/report concerns; execution belongs to BOT.

## Repository operating cycle

Every development cycle follows:

`PLAN → RESEARCH REVIEW → IMPLEMENT → TEST → VERIFY → DOCUMENT → PR/MERGE → SLACK REPORT`

The active plan is stored in `docs/automation/ACTIVE_SPRINT.md`. A cycle is not complete until the plan/status is updated and the result is reported to the BLACK ORACLE Slack channel.

See:
- `docs/automation/OPERATING_CYCLE.md`
- `docs/plans/2026-09-21-alpha-bootstrap.md`
- `docs/research/2026-09-21-bootstrap-review.md`

## Relationship to BLACK ORACLE BOT

| Product | Primary responsibility | Trading authority |
| --- | --- | --- |
| **BLACK ORACLE REPORT** | Evidence, research, synthesis, reports, archive | **None** |
| **BLACK ORACLE BOT** | Strategy validation, routing, deterministic risk, execution, outcomes | Controlled execution only |

**Reuse lineage, never authority.**
