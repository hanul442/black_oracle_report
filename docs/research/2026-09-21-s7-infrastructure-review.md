# BOR-S7 Independent Runtime / Database Infrastructure Review

Date: 2026-09-21  
Status: REFERENCE / TEST

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research / precedent
- **DI-001:** deployed runtime identity and artifact revision must be explicit enough to reproduce what code was running.
- **DI-003:** infrastructure must not rewrite Evidence knowledge-time semantics.
- **DI-004:** provenance and snapshot references must survive runtime/database migration.
- **BOR-S1:** runtime is independently ready only when no forbidden broker/trading environment names exist; `tradingAuthority=false`, `botDependency=false`.
- **BOR-S4:** persistence is behind an injected SQL driver and append-first Evidence contract; infrastructure must not bypass this boundary.
- **BOR-S6:** collector ingestion is deterministic and authority-free; deployment cannot silently grant new publication/trading authority.
- **Railway database persistence precedent:** Postgres data requires durable volume-backed storage. A bare image service without durable storage is not acceptable as BOR's canonical Evidence database.

### Hypothesis — BOR-S7-H1
BOR can become independently deployable with a small HTTP health/readiness runtime and isolated Railway project while preserving all existing authority boundaries. Database provisioning can remain separately gated until durable persistence is verifiably available.

### Experiment — BOR-S7-E1
1. Add health/version HTTP server backed by `getBorRuntimeStatus`.
2. Add production start command and deterministic tests.
3. Pass BOR CI.
4. Deploy the merged artifact to a new Railway project/service sourced only from `hanul442/black_oracle_report`.
5. Verify health/status and service environment names.
6. Provision a durable independent database only if persistence and provider authorization can be verified safely.

### Adopt / Reject gate
- **ADOPT runtime** only after CI + Railway health success.
- **ADOPT database** only after durable persistence is verified and the schema can be applied/tested without BOT/legacy coupling.
- Otherwise keep DB as explicit blocker and continue with runtime-only Alpha infrastructure.

## Authority statement
This work cannot create trading, order, portfolio, BOT database, broker-secret or Risk authority.
