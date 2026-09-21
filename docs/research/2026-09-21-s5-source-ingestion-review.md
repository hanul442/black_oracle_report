# BOR-S5 Source/NARS Ingestion Research Review

Date: 2026-09-21
Status: TEST

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research
- **DI-001**: canonical records must preserve transformation/version identity for replay.
- **DI-003**: point-in-time systems must distinguish publication/event time from observation/ingestion time.
- **DI-004**: replay and citation audit require stable provenance and snapshot-addressable references where available.
- **AIML-005 / AIML-006**: agent complexity must be evaluated later; ingestion correctness should not depend on LLM judgment.
- Legacy BOT PRs **#39/#41/#43**: NARS precedent for acquisition, canonicalization and cutover, used only as migration references.

### Hypothesis — BOR-S5-H1
A small deterministic ingestion boundary can safely convert source records into `bor.evidence.v1` while preserving point-in-time semantics, provenance, unresolved assets and duplicate lineage without importing the legacy combined runtime.

### Experiment — BOR-S5-E1
Implement `bor.source-record.v1` and `SourceEvidenceIngestor` with:
1. strict source/provenance/content/time validation,
2. deterministic Evidence IDs,
3. canonical Evidence creation through the existing evidence contract,
4. fingerprint lookup before append,
5. explicit duplicate lineage,
6. append-only persistence through `EvidenceStore`,
7. network-free deterministic tests.

### Result
Pending implementation + CI verification. No production behavior is adopted before the tests and repository CI pass.

### Adopt / Reject gate
**ADOPT** only if fresh append, replay idempotency, duplicate lineage, unresolved asset preservation and invalid-time/content fail-closed cases pass. Otherwise **REJECT/REVISE** without changing S0–S4.

## Authority statement
This experiment has no execution, portfolio, broker, BOT database, Risk or report-publication authority.
