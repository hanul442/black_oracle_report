# BOR-S7 Independent Runtime / Database Infrastructure Review

Date: 2026-09-21
Status: ADOPT-RUNTIME / DB-PENDING

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research / precedent
- **DI-001:** deployed runtime identity and artifact revision must be explicit enough to reproduce what code was running.
- **DI-003:** infrastructure must not rewrite Evidence knowledge-time semantics.
- **DI-004:** provenance and snapshot references must survive runtime/database migration.
- **BOR-S1:** runtime is independently ready only when no forbidden broker/trading environment names exist; `tradingAuthority=false`, `botDependency=false`.
- **BOR-S4:** persistence is behind an injected SQL driver and append-first Evidence contract; infrastructure must not bypass this boundary.
- **BOR-S6:** collector ingestion is deterministic and authority-free; deployment cannot silently grant new publication/trading authority.
- **Railway persistence:** Postgres canonical storage must be durable/volume-backed; an ephemeral image service is not accepted.

### Hypothesis — BOR-S7-H1
BOR can become independently deployable with a small HTTP health/readiness runtime and isolated Railway project while preserving all existing authority boundaries. Database provisioning can remain separately gated until durable persistence is verifiably available.

### Experiment — BOR-S7-E1
Implemented:
1. authority-safe `GET /health`,
2. authority-safe `GET /version`,
3. fail-closed health when forbidden trading env names exist,
4. no secret values in responses,
5. production `start` command,
6. deterministic unit tests.

### Result
**PASS for repository runtime.**

BOR CI #20:
- typecheck PASS,
- build PASS,
- full repository tests PASS.

Railway deployment verification remains the next gate.

### Adopt / Reject
**ADOPT runtime contract for Alpha deployment after final documentation-head CI passes.**
Database remains **PENDING** until durable independent persistence can be provisioned and verified without BOT/legacy coupling.

## Authority statement
This work cannot create trading, order, portfolio, BOT database, broker-secret or Risk authority.
