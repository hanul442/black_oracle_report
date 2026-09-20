# BOR Runtime Boundary

Status: **Alpha v0.1 baseline**

## Ownership

BLACK ORACLE REPORT owns its own application/runtime, future database, Evidence Store, report artifacts, research-agent orchestration, and presentation surfaces.

It does **not** own:
- broker credentials,
- exchange private APIs,
- order submission,
- trading positions,
- deterministic trading Risk,
- BOT runtime health or availability.

## Runtime contract

The minimal runtime exports a deterministic status object containing product/version identity, readiness, an explicit `tradingAuthority: false`, `botDependency: false`, timestamp, and blocker codes.

Configuration validation rejects environment-variable **names** that imply broker/trading credentials. Values are never copied into runtime status or logs by this contract.

## Deployment target

BOR will be deployed as an independent service after repository CI is green and a deploy target/database are provisioned explicitly. BOR-S1 does not reuse or mutate the legacy BLACK ORACLE deployment and does not provision secrets.

## Future database boundary

BOR-S2 will define the canonical Evidence contract before choosing/binding persistence. The database must be independently owned by BOR and must preserve source provenance, point-in-time timestamps, fingerprints, versioning, and report lineage.

## Inter-product contract

BOR may later publish versioned Evidence/Research packets for BOT. That interface is evidence-only: `execution_authority=false`. BOT must remain safe and operable if BOR is unavailable.
