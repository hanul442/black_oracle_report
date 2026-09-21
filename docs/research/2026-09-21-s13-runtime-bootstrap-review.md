# BOR-S13 Independent Runtime Bootstrap Research Review

Date: 2026-09-21
Status: EXPERIMENT

## Research → Hypothesis → Experiment → Result → Adopt/Reject

### Research / precedents
- **DI-001:** deployment/runtime identity must be versioned and auditable.
- **DI-003:** point-in-time evidence semantics require an independently controlled BOR runtime/storage boundary.
- **DI-004:** replay depends on stable revision/snapshot identity; deployed revision must be recorded.
- **AIML-005/006:** agent/runtime changes require deterministic evaluation; deployment does not grant research truth or trading authority.
- **BOR bootstrap review:** provenance/evidence contracts precede presentation and BOR has no trading authority.
- **RUNTIME_DEPLOYMENT_CONTRACT_V1:** BOR deploy source is exclusively `hanul442/black_oracle_report`; `/health` and `/version` are the minimum runtime surfaces; legacy BOT runtime/database/broker credentials are forbidden.
- **BOR-S11-E1 / BOR-S12-E1:** report/export artifacts are immutable, fingerprinted representations with execution/publication authority fixed false.

### Hypothesis — BOR-S13-H1
The existing authority-free HTTP runtime can be made independently deployable with deterministic repository configuration and isolated Railway identity, while failing closed on broker/trading environment names and without depending on BOT infrastructure.

### Experiment — BOR-S13-E1
1. verify existing runtime/startup and tests,
2. add deterministic Railway deployment configuration where missing,
3. run full CI,
4. provision an isolated BOR Railway project/service only if account capacity permits,
5. verify deployed `/health` and `/version` plus source revision,
6. keep durable database provisioning explicit and separate if capacity/credential constraints block it.

### Safety boundary
No broker/exchange credentials, orders, BOT portfolio mutation, Risk bypass, BOT database reuse, destructive migration, or publication authority. Existing legacy Railway services are read-only context and must remain untouched.

### Result
- Added deterministic Railway build/start/`/health` configuration and CI validation.
- CI #57 passed dependency install, typecheck, build, full deterministic tests, and Railway config verification.
- Attempted to create a new isolated `BLACK ORACLE REPORT` Railway project in the existing workspace.
- Railway rejected provisioning with: `Free plan resource provision limit exceeded. Please upgrade to provision more resources!`
- No legacy `Black Oracle` service/project was modified or reused.
- Therefore repository deployability controls are verified, but actual isolated deployment, endpoint verification, and durable BOR database provisioning remain externally blocked by account capacity.

### Adopt / Reject
**ADOPT repository-side S13 deployment contract; HOLD runtime deployment verification.** The code/config boundary is safe to merge because it changes no live infrastructure and preserves zero authority. Do not claim BOR runtime/database is deployed until an isolated project can actually be provisioned and `/health` + `/version` are verified.
