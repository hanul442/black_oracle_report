# REPORT CONSISTENCY CONTRACT V1

Schema: `bor.report-consistency.v1`

## Purpose
Fail closed before an S11 report artifact / S12 export pair is considered Alpha release-ready. The gate is read-only and never repairs, enriches, publishes or executes anything.

## Required invariants
- report schema is `bor.report-artifact.v1`; export schema is `bor.report-export.v1`
- both report and export fingerprints recompute exactly from their canonical cores
- report ID, series ID, version, asOf and report content fingerprint match the export parent fields exactly
- canonical citation Evidence ID sets match exactly
- scenarios match exactly, preserving Bull/Base/Bear payloads and contradicting Evidence references
- unresolved disagreements and data gaps match exactly
- execution and report-publication authority are false on both artifacts

## Result
The verifier returns deterministic `PASS` or `FAIL` plus explicit issue codes. A failure is evidence of inconsistency; it is not permission to mutate or repair either artifact.

## Safety boundary
No broker/exchange credential, order, BOT portfolio mutation, Risk bypass, provider call, public publication, database mutation, deployment mutation or BOT dependency.
