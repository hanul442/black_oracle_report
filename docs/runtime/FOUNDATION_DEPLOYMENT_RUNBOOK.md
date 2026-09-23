# BOR Foundation Deployment Runbook

Status: approved Foundation remediation deployment contract
Repository: `hanul442/black_oracle_report`

## Placement decision

The Railway workspace is on the Hobby plan with both project slots in use. `Black Oracle` contains four services and the separate `SOCIAL VEGAS` project contains one. Railway rejected an additional `black-oracle-report` service at the effective workspace ceiling, despite the project-level 4/5 display. No service or domain was created.

Deployment therefore requires Railway support/plan capacity for one additional workspace service, or separate explicit authority to remove an existing service. No existing service is authorized for removal. Once capacity exists, isolation is enforced at the repository, service-variable, volume, domain, and authority boundaries; BOR does not share BOT credentials or storage.

Protected existing Railway services and domains must not be removed, repointed, or reconfigured.

## Runtime boundary

Required surfaces:

- `GET /health` — runtime and forbidden-environment check;
- `GET /version` — product/version with `tradingAuthority=false` and `botDependency=false`;
- `GET /api/alpha/report` — integrity-gated read of `BOR_ALPHA_READ_MODEL_PATH`;
- `GET /` — the same canonical Alpha model rendered without creating a second truth source.

The service must not receive BOT Supabase credentials, broker/exchange credentials, PAPER variables, scheduler tokens, portfolio state, or trading authority.

## Build and configuration

Railway uses `railway.json`:

- build: `npm ci --ignore-scripts && npm run build`;
- start: `npm start`;
- health check: `/health`.

Required service variables:

- `PORT=3000`;
- `BOR_ALPHA_READ_MODEL_PATH=/data/alpha-read-model.json`;
- `BOR_FOUNDATION_ATTESTATION_SEED=true` for the explicit infrastructure-only seed.

Attach one BOR-owned volume at `/data`. Do not use an ephemeral filesystem as durable evidence and do not mount a BOT/PAPER volume. The empty diagnostic volume created during the failed attempt is staged for deletion and must be cleared with Railway dashboard 2FA before a clean retry.

## Artifact path

The verified path is:

`report/export parents -> consistency verification -> Alpha model generation -> atomic persistence -> mounted BOR volume -> file resolver -> integrity-gated read API`

When the seed flag is enabled and the target does not exist, startup publishes one deterministic Foundation attestation artifact through the production publish API. The artifact states that it is infrastructure-only and carries no market recommendation. If a file already exists, startup verifies and reuses it; invalid state fails startup rather than being overwritten.

`src/foundationRuntimeSeed.test.ts` covers first publish, resolver/API read, durable reuse semantics, disabled no-op, and invalid-existing-artifact failure.

## Deployment acceptance

1. deployment source is this repository and exact approved main SHA;
2. deployment reports `SUCCESS` and `/health` returns HTTP 200;
3. `/version` reports all authority flags false;
4. `/api/alpha/report` returns HTTP 200 with the Foundation attestation title and a stable content fingerprint;
5. redeploy or restart without deleting the volume and verify the same fingerprint with `seeded=false` in startup logs;
6. confirm service variables contain no forbidden BOT/trading credentials;
7. `npm run verify` and exact-head CI pass.

## Cost

Railway bills actual compute and storage use. Published rates at remediation time are $10/GB-month RAM, $20/vCPU-month CPU, $0.05/GB egress, and $0.15/GB-month used volume storage. Hobby's existing $5 monthly subscription counts toward resource usage. The failed attempt created no compute cost. Until dashboard 2FA applies the staged cleanup, the empty volume is the only possible incremental charge. Report observed service metrics and used storage after any later deployment; do not invent a fixed monthly total.

## Rollback

Stop or redeploy only the `black-oracle-report` service. Preserve the volume unless the user separately authorizes deletion. BOR rollback must not touch any BOT service, domain, scheduler, checkpoint, ledger, qualification cohort, database, or Risk configuration.
