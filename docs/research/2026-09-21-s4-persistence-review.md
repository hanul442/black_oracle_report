# BOR-S4 Persistence Research Review — 2026-09-21

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **DI-001**: canonical records need explicit schema/producer/version identity for reproducibility.
- **DI-003**: publication time and observation time are separate point-in-time facts.
- **DI-004**: provenance and snapshot-addressable identity are prerequisites for replay and citation audit.

### Hypothesis
A thin SQL adapter can preserve BOR's immutable Evidence semantics without coupling domain code to a database SDK or requiring live infrastructure in CI.

### Experiment
Implement an injected `SqlEvidenceDriver`, a `SqlEvidenceStore` conforming to the S3 port, and an additive SQL schema whose constraints independently enforce BOR identity, no trading authority, point-in-time ordering and non-self-duplicate lineage.

### Result
Implementation prepared on BOR-S4 branch. Deterministic tests verify parameterized append, conflict fail-closed behavior, deterministic fingerprint lookup and static schema safety invariants. GitHub CI is the merge gate.

### Decision
**TEST / candidate for ADOPT after CI green.** No production database is provisioned and no runtime behavior is promoted by this research note alone.

## Constraints carried forward
- Persistence must never grant trading authority.
- Historical Evidence is preserved; rollback is stop-writes/roll-forward rather than destructive table deletion.
- Agent/NARS work consumes this boundary only after it is merged and independently verified.
