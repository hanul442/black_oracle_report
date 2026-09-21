# ACTIVE SPRINT — BOR Alpha Read API Boundary

Date: **2026-09-22**
Target release: **2026-10-20 — Alpha v0.1**
Repository: `hanul442/black_oracle_report`
Status: **S16 VERIFIED / ADOPT — FINAL CI + S15 DEPENDENCY GATE**

## Completed
- BOR-S0–S14 complete and merged.
- BOR-S15 implementation/research is verified and ADOPT on PR #20; final CI #67 is green, but its merge action remains externally blocked.
- BOR-S16 implementation is verified on PR #21 and **BOR-S16-E1 ADOPT**.
- CI #68 passed typecheck, build, full deterministic tests, and independent Railway runtime-config verification.

## Active — BOR-S16 Alpha read-only HTTP API boundary

### Objective
Expose the S15 `bor.alpha-read-model.v1` through a deterministic read-only HTTP response contract so frozen-Alpha UI surfaces can consume one canonical integrity-preserving payload without reconstructing evidence or acquiring authority.

### Acceptance criteria
- explicit versioned `bor.alpha-read-api.v1` response envelope
- only accepts a canonical S15 AlphaReadModel whose deterministic content fingerprint recomputes correctly
- preserves projection/report/export identity, report version/asOf, canonical citations, Bull/Base/Bear scenarios/counterevidence, disagreements and data gaps exactly
- `executionAuthority=false`, `reportPublicationAuthority=false`, `botDependency=false`
- GET-only; unsupported methods fail closed
- missing model returns explicit unavailable response rather than invented/empty research state
- deterministic tests cover valid response, tampered fingerprint, authority escalation, unavailable state and unsupported method

### Product / safety boundary
Read-only BOR presentation/API boundary only. No broker/exchange credentials, orders, BOT portfolio mutation, Risk bypass, provider calls, public publishing, database writes, deployment mutation, evidence synthesis/repair, or BOT dependency. API serialization may reject state; it may never manufacture or suppress Evidence or uncertainty.

### Rollback
Repository-only revert of S16 branch/PR. S11–S15 canonical artifacts and gates remain unchanged. S16 remains dependent on verified S15 until PR #20 lands safely.

### Research review / constraints
DI-001/003/004, AIML-005/006 and BOR-S8-E1 through BOR-S15-E1 constrain S16. BOR-S16-H1/E1 is now **ADOPT** after CI #68 and manual contract verification. Preserve Research → Hypothesis → Experiment → Result → Adopt/Reject lineage.

### Exact next gate
Run docs-inclusive final CI on PR #21 → if green, keep S16 ready but do not merge ahead of S15 → land PR #20 when connector safety gate permits → retarget/merge PR #21 only after S15 is on `main`. If merge remains externally blocked, continue only safe repository work without collapsing dependency or authority boundaries.

## Current blockers
- **CONFIRMED external:** GitHub merge action for green/mergeable PR #20 remains blocked by connector safety checks; no bypass attempted.
- **CONFIRMED external:** Railway free-plan resource provision limit blocks independent BOR runtime/database provisioning.
- Existing Railway `Black Oracle` services remain legacy BOT/paper/web infrastructure and forbidden for BOR reuse.

## Cycle exit record
- Phase: **VERIFY / DOCUMENT COMPLETE → FINAL CI / DEPENDENCY GATE**
- Verification: CI #68 green; API contract manually reviewed for fingerprint and no-authority preservation.
- Research result: **BOR-S16-E1 ADOPT**.
- Single next priority: final CI for PR #21, then resolve S15 merge dependency safely before any S16 merge.
