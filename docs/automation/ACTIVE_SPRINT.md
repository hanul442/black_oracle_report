# ACTIVE SPRINT — BOR Alpha Bootstrap

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Objective

Bootstrap BLACK ORACLE REPORT as an independent evidence/research/report product with no trading authority, then establish the first canonical Evidence ingestion contract.

## Today — ordered plan

### BOR-S0 — Repository bootstrap
Acceptance criteria:
- BOR-only README.
- Persistent operating-cycle document.
- Active Alpha sprint stored in-repo.
- Research inputs for BOR recorded.
- Explicit no-trading-authority boundary.

### BOR-S1 — Application/runtime baseline
Acceptance criteria:
- Minimal application/runtime structure.
- CI smoke test.
- Environment contract with no BOT/broker secrets.
- Independent deploy target documented.

### BOR-S2 — Evidence foundation
Acceptance criteria:
- Canonical source/evidence schema.
- `source_id`, canonical asset mapping, provenance.
- `published_at` and `observed_at`.
- Content fingerprint.
- Duplicate and stale-evidence controls.
- Versioned evidence contract suitable for later NARS ingestion.

### BOR-S3 — Research pipeline
Acceptance criteria:
- Collector → Organizer → Analyst → Specialist → Red Team → Research Council → Synthesizer responsibilities explicit.
- Agent outputs preserve evidence IDs and disagreement.
- No agent output can place or authorize a trade.

## Research inputs reviewed

- **DI-001 / DI-003 / DI-004** — versioned experiment, point-in-time knowledge and snapshot replay inform Evidence provenance and report reproducibility.
- **AIML-005 / AIML-006** — agent/Council changes require regression tasks and matched-budget ablation.
- **D-005** — research UI should expose Decision/Conclusion → Why/Evidence → Audit/Lineage progressively.
- Research lineage remains Research → Hypothesis → Experiment → Result → Adopt/Reject.

## Safety / product invariants

- BOR never holds broker credentials.
- BOR never submits orders or mutates BOT portfolio state.
- BOT availability is not required for BOR to operate.
- Missing or contradictory evidence remains explicit.
- Reports are immutable/versioned artifacts; later knowledge creates a new version rather than rewriting history.

## Cycle exit record

- Phase: **BOR-S0 DONE → BOR-S1 NEXT**
- Completed this cycle: independent BOR README, persistent operating cycle, 2026-09-21 sprint plan, research review
- Research reviewed: DI-001, DI-003, DI-004, AIML-005, AIML-006, D-005
- Validation: documentation and merged-repository verification complete; CI does not exist yet
- PR: **#1 MERGED**
- Main commit: `632b1b2ac6b2634b008bd0d62451ac79a215c8af`
- Deployment: none
- Slack report: https://hanullab.slack.com/archives/C0C2Y1RJJP3/p1789945496607259
- Blockers: app/runtime/CI/database not bootstrapped yet
- Next checkpoint: **BOR-S1 — minimal independent runtime + CI baseline**
