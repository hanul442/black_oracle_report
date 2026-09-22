# BOR-S22 Research Review — Versioned Report Archive

Date: 2026-09-22
Status: ADOPT
Hypothesis: BOR-S22-H1
Experiment: BOR-S22-E1 = ADOPT

## Research lineage
`REPORT_CONSISTENCY_V1 → BOR-S15 Alpha Read Model → BOR-S16 integrity gate → BOR-S19 resolver → BOR-S20 atomic persistence → BOR-S21 publish cycle → BOR-S22-H1/E1`

## Reviewed precedents
- `ALPHA_READ_MODEL_CONTRACT_V1` / S15: deterministic projection of versioned report/export parents preserving citations, Bull/Base/Bear scenarios, unresolved disagreements and data gaps with all authority flags false.
- `BOR-S20-H1/E1 = ADOPT`: only an S16-valid canonical model may cross the BOR filesystem persistence boundary; crash-safe handoff must not weaken integrity.
- `BOR-S21-H1/E1 = ADOPT`: generation-to-runtime handoff is composition-only; S21 does not synthesize, repair, publish externally or grant authority.
- Foundation PR #29: independent BOR runtime/build verification is separate from durable storage; the Railway capacity/storage blocker must remain explicit and BOT/PAPER infrastructure must not be borrowed.
- S8 thesis invariant remains binding: insufficient evidence cannot be laundered into directional thesis content.

## Hypothesis
A content-addressed append-only archive of already-verified Alpha read models can preserve reproducible report history while preventing silent historical replacement and without introducing publication/trading authority.

## Experiment design
Implement a narrow BOR-owned archive writer. Reuse the canonical S16 integrity gate, derive deterministic archive identity from immutable report/projection/version/fingerprint identity, and create each version without overwrite. Exact replay is idempotent. A pre-existing path with different bytes is collision/tamper failure. Unsafe or missing archive-root input fails closed. The archive layer does not alter the model, call providers, access BOT state, or publish externally.

## Result
- Original implementation head `6f8915f82931e89e907a7d558663cffc6601be11` passed BLACK ORACLE REPORT CI #99.
- Adoption-record head `ea5d7db389e26324c0dec9f255b687b3578a9008` passed docs-inclusive CI #101.
- PR #28 became non-mergeable after foundation PR #29 advanced `main` and independently changed `ACTIVE_SPRINT`.
- Recovery reapplied S22 onto foundation `main` without discarding its lockfile, runtime verification or deployment runbook.
- Current-main recovery head `2e6d4443f863c4b6279cf6ae98fb295d2a28f574` passed BLACK ORACLE REPORT CI #105.
- Deterministic tests verify archived JSON deep-equals the canonical model, citation IDs and all three scenarios survive unchanged, unresolved disagreements/data gaps and fingerprint survive unchanged, exact replay is idempotent, tamper/collision fails closed, unsafe identity/missing root fails closed, and authority escalation is rejected.
- Foundation regression boundary remains intact because S22 changes only the archive module/tests/research/control document and does not alter runtime build/deploy files.

## Decision
`BOR-S22-E1 = ADOPT`.

The evidence supports the hypothesis at repository/local-artifact scope. This decision does **not** claim production durability: independent Railway capacity and BOR-owned durable production storage remain blockers. No broker credentials, order submission, BOT portfolio/database/runtime dependency, Risk bypass, execution authority or publication authority were introduced.
