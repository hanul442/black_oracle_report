# REPORT EXPORT CONTRACT V1

Schema: `bor.report-export.v1`

## Purpose
Provide a deterministic, renderer-ready representation of one verified `bor.report-artifact.v1` without changing research meaning, citations, version identity, uncertainty, or authority.

## Parent integrity
Before export, BOR recomputes the S11 canonical report fingerprint excluding only `contentFingerprint` and the fixed authority fields. A mismatch fails closed.

The export records the exact parent `reportId`, `seriesId`, report `version`, `asOf`, and `contentFingerprint`.

## Preserved research payload
The export carries title/summary, thesis, Bull/Base/Bear scenarios, canonical citation Evidence IDs, unresolved disagreements, and data gaps. Contradicting Evidence references remain embedded in the scenarios.

## Formats
Alpha contract permits `HTML` and `PDF` format identities. S12 does not invoke an external renderer or publish an artifact; it establishes the integrity boundary consumed by later deterministic rendering.

## Authority
`executionAuthority=false` and `reportPublicationAuthority=false` are mandatory. Export generation is not publication and has no trading authority.
