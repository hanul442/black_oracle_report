# BOR-S7 Independent Runtime / Database Infrastructure Review

Date: 2026-09-21
Status: ADOPT-RUNTIME / INFRA-BLOCKED

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research / precedent
- **DI-001:** deployed runtime identity and artifact revision must be explicit.
- **DI-003:** infrastructure must not rewrite Evidence knowledge-time semantics.
- **DI-004:** provenance/snapshot references survive runtime/database migration.
- **BOR-S1:** no broker/trading env authority; `tradingAuthority=false`, `botDependency=false`.
- **BOR-S4:** persistence stays behind append-first SQL Evidence adapter.
- **BOR-S6:** collector ingestion remains deterministic and authority-free.
- Railway persistence requires durable storage; ephemeral Postgres is not canonical Evidence storage.

### Hypothesis — BOR-S7-H1
BOR can be made independently deployable without weakening authority boundaries.

### Experiment — BOR-S7-E1
Implemented and verified:
1. `GET /health`,
2. `GET /version`,
3. fail-closed forbidden trading environment names,
4. no secret values in responses,
5. production start command,
6. deterministic unit tests,
7. isolated Railway project creation attempt after merge.

### Result
**Repository/runtime PASS; infrastructure provisioning BLOCKED.**

Verification:
- BOR CI #20 PASS,
- final BOR CI #23 PASS,
- PR #9 merged as `54056741c7c1bfe6f2636d7706c2f31a807ab35a`.

Railway project creation returned:
`Free plan resource provision limit exceeded`.

No legacy project/service was mutated and no shared database fallback was used.

### Adopt / Reject
- **ADOPT runtime contract** for Alpha.
- **DEFER infrastructure activation** until independent capacity/provider is available.
- **REJECT** using legacy BOT/combined infrastructure as a shortcut.

## Authority statement
No trading, order, portfolio, BOT database, broker-secret or Risk authority was created.
