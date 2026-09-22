# BOR-S22 Research Review — Versioned Report Archive

Date: 2026-09-22
Status: EXPERIMENT PENDING
Hypothesis: BOR-S22-H1
Experiment: BOR-S22-E1 = PENDING

## Research lineage
`REPORT_CONSISTENCY_V1 → BOR-S15 Alpha Read Model → BOR-S16 integrity gate → BOR-S19 resolver → BOR-S20 atomic persistence → BOR-S21 publish cycle → BOR-S22-H1/E1`

## Reviewed precedents
- `ALPHA_READ_MODEL_CONTRACT_V1` / S15: the model is a deterministic projection of versioned report/export parents and preserves citations, Bull/Base/Bear scenarios, unresolved disagreements and data gaps with all authority flags false.
- `BOR-S20-H1/E1 = ADOPT`: only an S16-valid canonical model may cross the BOR filesystem persistence boundary; crash-safe handoff must not weaken integrity.
- `BOR-S21-H1/E1 = ADOPT`: generation-to-runtime handoff is composition-only; S21 does not synthesize, repair, publish externally or grant authority.
- S8 thesis invariant remains binding: insufficient evidence cannot be laundered into directional thesis content.

## Hypothesis
A content-addressed append-only archive of already-verified Alpha read models can preserve reproducible report history while preventing silent historical replacement and without introducing publication/trading authority.

## Experiment design
Implement a narrow BOR-owned archive writer. It reuses the canonical S16 integrity gate, derives a deterministic archive ID from immutable report/projection/version/fingerprint identity, and creates the version artifact without overwrite. Exact replay is idempotent. A pre-existing path with different bytes is a collision/tamper failure. Unsafe or missing archive-root input fails closed. The archive layer does not alter the model, call providers, access BOT state, or publish externally.

## Adoption gate
E1 passes only if deterministic tests and CI demonstrate: archived JSON deep-equals the canonical model; citation IDs, three scenarios, disagreements/data gaps and fingerprint survive unchanged; all authority flags remain false; exact replay is idempotent; collision/tamper and invalid-root cases fail closed. Otherwise REJECT or revise without weakening upstream contracts.
