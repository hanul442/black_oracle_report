# BOR-S22 Research Review — Versioned Report Archive

Date: 2026-09-22
Status: ADOPT
Hypothesis: BOR-S22-H1
Experiment: BOR-S22-E1 = ADOPT

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

## Result
- Implementation head `6f8915f82931e89e907a7d558663cffc6601be11` passed BLACK ORACLE REPORT CI #99.
- Deterministic tests verify archived JSON deep-equals the canonical model and preserve citation IDs, Bull/Base/Bear scenarios, unresolved disagreements, data gaps, and content fingerprint.
- Exact replay returns the same archive identity without replacing bytes.
- Pre-existing different bytes fail closed as collision/tamper; unsafe identity, authority escalation, and missing archive root fail closed.
- Archive result keeps `executionAuthority=false`, `reportPublicationAuthority=false`, and `botDependency=false`.
- No broker credentials, orders, BOT state/database/runtime dependency, Risk bypass, provider/network calls, execution authority, or publication authority were introduced.

## Decision
**ADOPT — BOR-S22-E1.** The immutable versioned archive satisfies the Alpha acceptance gate without weakening canonical integrity or BOR's no-authority boundary. Final merge remains gated on docs-inclusive GREEN CI for the adoption-record head.
