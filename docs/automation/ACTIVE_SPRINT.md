# ACTIVE SPRINT — Foundation Remediation

Date: **2026-09-23**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **FEATURE FREEZE / FOUNDATION RUNTIME REMEDIATION**

## Repository truth

- S25 base: `71a8bf1c5f267497aad32da2a9c6f4029bfcb8e0`; Foundation runtime preparation merged at `8ae39ea4a7e6e556ebc250555fd2f09bdab11cfa`.
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
- `Black Oracle` contains four services; the separate `SOCIAL VEGAS` project contains one, for five services across the workspace.
- Railway rejected a sixth workspace service with provider error text `Free plan resource provision limit exceeded`; this does not change the observed Hobby plan.
- A temporary empty, unattached 0.5 GB BOR volume was created during diagnosis. Its deletion is staged and requires Railway dashboard 2FA to apply.
- No BOR service or domain was created and no protected existing resource was changed.

## Cost boundary

Railway remains usage-based. Hobby includes the existing $5 monthly usage credit. No BOR compute was provisioned, so incremental service compute is $0. Until the staged cleanup is applied, only the empty volume can accrue storage at $0.15/GB-month of used space. No database or additional paid project is authorized.

## Freeze

No new BOR feature package begins during this sprint. PR #34 and research-only PR #16 remain isolated. Only deployment safety, durable artifact verification, governance correction, tests, and evidence capture are active.

## Exit gate

1. Railway capacity/support permits one additional service and exact deployed BOR revision is attested;
2. `/health` and `/version` return ready, authority-free state;
3. mounted BOR-owned volume persists the verified Foundation artifact across redeploy/restart;
4. `/api/alpha/report` returns the same integrity-gated fingerprint;
5. no forbidden BOT/trading environment variable is present;
6. repository CI remains green;
7. the staged empty-volume cleanup is applied with dashboard 2FA;
8. runtime evidence and cost are recorded without claiming production research freshness.
