# ACTIVE SPRINT — Foundation Remediation

Date: **2026-09-23**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **FEATURE FREEZE / FOUNDATION RUNTIME REMEDIATION**

## Repository truth

- Current main: `71a8bf1c5f267497aad32da2a9c6f4029bfcb8e0`.
- BOR-S22 immutable archive, S23 verified archive catalog, S24 deterministic HTML renderer, and S25 deterministic PDF manifest gate are merged.
- BOR-S26 PDF byte rendering remains isolated in open PR #34. It is not part of Foundation remediation and must not merge until the freeze is lifted.
- No S22–S26 repository result by itself proves a deployed runtime or durable production storage.

## Active objective

Use the one approved remaining Railway service slot for one BOR-only service and volume, then verify:

`canonical report/export -> verified publish -> BOR-owned durable artifact -> file resolver -> integrity-gated runtime read`

## Required boundaries

- source only `hanul442/black_oracle_report`;
- no BOT Supabase, PAPER, scheduler, broker, exchange, trading, Risk, or portfolio credentials;
- `tradingAuthority=false`, `reportPublicationAuthority=false`, and `botDependency=false` remain fixed;
- no existing Railway service, domain, scheduler target, qualification cohort, or trading state may be changed;
- Foundation attestation seed is infrastructure-only and explicitly contains no production market recommendation.

## Railway truth

- Workspace plan: **Hobby**, not Free.
- Workspace project capacity: **2/2 projects**.
- `Black Oracle` project service capacity: **4/5 services** before BOR provisioning.
- Workspace volume usage observed by the Astra audit: **0/3 volumes** before BOR provisioning.
- The final service slot is reserved for the approved isolated BOR service. No independent third Railway project is available on the current plan.

## Cost boundary

Railway remains usage-based. Hobby includes the existing $5 monthly usage credit; additional BOR cost is actual compute plus volume usage. Published rates at remediation time are $10/GB-month RAM, $20/vCPU-month CPU, $0.05/GB egress, and $0.15/GB-month used volume storage. No database or additional paid project is authorized.

## Freeze

No new BOR feature package begins during this sprint. PR #34 and research-only PR #16 remain isolated. Only deployment safety, durable artifact verification, governance correction, tests, and evidence capture are active.

## Exit gate

1. exact deployed BOR revision attested;
2. `/health` and `/version` return ready, authority-free state;
3. mounted BOR-owned volume persists the verified Foundation artifact across redeploy/restart;
4. `/api/alpha/report` returns the same integrity-gated fingerprint;
5. no forbidden BOT/trading environment variable is present;
6. repository CI remains green;
7. runtime evidence and cost are recorded without claiming production research freshness.
