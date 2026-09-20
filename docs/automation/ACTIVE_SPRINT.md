# ACTIVE SPRINT — BOR Alpha Bootstrap

Date: **2026-09-21**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **IN PROGRESS**

## Objective

Bootstrap BLACK ORACLE REPORT as an independent evidence/research/report product with no trading authority, then establish the first canonical Evidence ingestion contract.

## Active work package — BOR-S1 Application/runtime baseline

### Objective
Establish the smallest independently testable BOR runtime so future Evidence/NARS work lands in a product-owned boundary rather than drifting back into the legacy combined repository.

### Acceptance criteria
- Minimal TypeScript runtime/application structure owned only by BOR.
- Deterministic health/status contract that states `tradingAuthority: false`.
- Environment contract explicitly rejects broker/trading secret names.
- CI runs typecheck, unit tests, and build on BOR itself.
- Independent deploy target is documented, but this cycle does **not** provision credentials or deploy.

### Product / safety boundary
- BOR has no broker adapter, order path, portfolio mutation, or BOT runtime dependency.
- Runtime status must expose no secret values.
- Missing configuration must fail closed; forbidden broker/trading environment variables are treated as configuration errors.
- No production deployment or database mutation in BOR-S1.

### Rollback
BOR-S1 is additive on branch `bor-s1-runtime-baseline`. Rollback is closing the PR; main remains the merged BOR-S0 documentation baseline.

### Exact next gate
`npm test` equivalent must demonstrate: typecheck PASS + runtime unit tests PASS + build PASS in GitHub CI. Only then merge BOR-S1 and advance to BOR-S2 Evidence foundation.

## Research review for BOR-S1

- **DI-001** — runtime/build identity must be versionable so later research/report artifacts can record producer version.
- **DI-003** — point-in-time semantics require an injectable/explicit observation clock; avoid hiding time inside future evidence contracts.
- **DI-004** — replay requires deterministic boundaries and stable version identifiers.
- **AIML-005 / AIML-006** — agent expansion is intentionally deferred until an evaluation-capable baseline exists.
- **D-005** — no UI expansion in this work package; runtime foundation precedes presentation.

Research lineage: **Research → Hypothesis → Experiment → Result → Adopt/Reject** remains mandatory.

## Today — ordered plan

### BOR-S0 — Repository bootstrap — DONE
- BOR-only README.
- Persistent operating-cycle document.
- Active Alpha sprint stored in-repo.
- Research inputs for BOR recorded.
- Explicit no-trading-authority boundary.

### BOR-S1 — Application/runtime baseline — ACTIVE
See active work package above.

### BOR-S2 — Evidence foundation — NEXT
- Canonical source/evidence schema.
- `source_id`, canonical asset mapping, provenance.
- `published_at` and `observed_at`.
- Content fingerprint.
- Duplicate and stale-evidence controls.
- Versioned evidence contract suitable for later NARS ingestion.

### BOR-S3 — Research pipeline
- Collector → Organizer → Analyst → Specialist → Red Team → Research Council → Synthesizer responsibilities explicit.
- Agent outputs preserve evidence IDs and disagreement.
- No agent output can place or authorize a trade.

## Safety / product invariants

- BOR never holds broker credentials.
- BOR never submits orders or mutates BOT portfolio state.
- BOT availability is not required for BOR to operate.
- Missing or contradictory evidence remains explicit.
- Reports are immutable/versioned artifacts; later knowledge creates a new version rather than rewriting history.

## Cycle exit record

- Phase: **PLAN + RESEARCH REVIEW COMPLETE → IMPLEMENTING BOR-S1**
- Completed this cycle: plan and research constraints recorded before implementation
- Validation: pending
- PR: pending
- Deployment: none by design
- Blockers: none for local repository/runtime baseline; deploy target provisioning deferred
- Next checkpoint: implement minimal runtime + CI and verify all gates
