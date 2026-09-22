# BOR Foundation Deployment Runbook

Status: Foundation closure deployment contract
Repository: `hanul442/black_oracle_report`

Current provisioning status (2026-09-22): **BLOCKED**. Creation of the required independent Railway project was rejected because the workspace free-plan resource provision limit was exceeded. Do not place BOR inside the BOT project merely to bypass this isolation gate.

## Boundary

BOR deploys as an independent Railway project and service sourced only from this repository. It must not receive BOT Supabase credentials, broker/exchange credentials, PAPER runtime variables, scheduler tokens, or trading authority.

Required runtime surfaces:

- `GET /health` — runtime boundary and forbidden-environment check
- `GET /version` — product/version with `tradingAuthority=false` and `botDependency=false`
- `GET /api/alpha/report` — integrity-gated read of `BOR_ALPHA_READ_MODEL_PATH`; an absent artifact remains an explicit `404 ALPHA_READ_MODEL_UNAVAILABLE`

## Build and deploy

Railway uses `railway.json`:

- build: `npm ci --ignore-scripts && npm run build`
- start: `npm start`
- health check: `/health`

The committed lockfile is mandatory. A deployment is accepted only when Railway metadata reports the exact Git SHA intended for release; `SUCCESS` alone is insufficient.

## Artifact boundary

The verified path is:

`report/export parents -> consistency verification -> Alpha model generation -> atomic file persistence -> file resolver -> integrity-gated read API`

`src/alphaReadModelPublishCycle.test.ts` exercises this complete handoff. The runtime never synthesizes a report when the configured artifact is missing or invalid.

Canonical persistence is not yet claimed from an unmounted Railway filesystem. Until BOR-owned durable storage is provisioned, the deployed read endpoint may truthfully return `ALPHA_READ_MODEL_UNAVAILABLE`; this is a Foundation blocker, not a reason to borrow BOT storage.

## Rollback

Redeploy the previous BOR service deployment or stop the isolated BOR service. No BOT service, database, scheduler, checkpoint, ledger, or qualification cohort is changed by BOR rollback.

## Smoke checks

1. confirm deployment repository and exact SHA in Railway metadata;
2. require `/health` HTTP 200 and no forbidden environment blockers;
3. require `/version` authority flags to remain false;
4. query `/api/alpha/report` and accept only:
   - HTTP 200 with a valid fingerprint and all authority flags false; or
   - HTTP 404 `ALPHA_READ_MODEL_UNAVAILABLE` while durable artifact persistence remains explicitly blocked;
5. run `npm run verify` against the exact repository head.
