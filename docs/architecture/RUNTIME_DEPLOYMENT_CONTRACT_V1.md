# BOR Independent Runtime Deployment Contract v1

Status: ALPHA CONTRACT
Product: BLACK ORACLE REPORT
Runtime: BOR-ALPHA-v0.1

## Purpose

Define the minimum independently deployable BOR runtime without inheriting the legacy BLACK ORACLE/BOT runtime, database, broker credentials, order authority, portfolio state or deterministic Risk authority.

## Runtime surfaces

### GET /health
Backed by `getBorRuntimeStatus`.

- HTTP 200 when runtime status is `READY`.
- HTTP 503 when runtime status is `BLOCKED`.
- Blocked when forbidden trading/broker environment variable names are present.
- Response may expose blocker *names* but never environment values/secrets.

### GET /version
Returns only product/version and fixed authority flags.

- `tradingAuthority=false`
- `botDependency=false`

Unknown routes return 404. Non-GET methods return 405.

## Deployment identity

The deploy source is exclusively `hanul442/black_oracle_report`.
The Railway project/service must be independent from the legacy combined `Black Oracle` project.
The deployed Git revision is recorded in the cycle exit report.

## Database boundary

The runtime may later receive BOR-owned database credentials, but:
- no BOT/legacy database reference is allowed;
- no broker/private exchange credential is allowed;
- Evidence writes must go through the BOR append-first persistence contract;
- database rollback is stop-writes/roll-forward, never destructive deletion of historical Evidence;
- an ephemeral unmounted database container is not accepted as canonical Evidence storage.

## Rollback

Disable/remove the isolated BOR service or redeploy a prior BOR commit. Legacy Black Oracle services remain untouched.
