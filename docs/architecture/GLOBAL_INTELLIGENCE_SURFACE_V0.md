# BLACK ORACLE Global Intelligence Surface — Architecture Proposal v0

Status: **DESIGN PROPOSAL**  
Date: 2026-09-21  
Owner: **BLACK ORACLE REPORT**  
Execution authority: **false**  
Report publication authority: **false**  
Reference inspiration: OSIRIS `simplifaisoul/osiris@03ad5caf53631bb0202dabc6449010a226674a8a`

## 1. Purpose

Define a geospatial market-intelligence surface that turns external OSINT observations into replayable BLACK ORACLE Evidence and then into an interactive geographic read model.

The map is not an Evidence Store, Risk Engine, trading signal or execution surface.

## 2. Architectural invariant

```text
PROVIDER DATA IS NOT BLACK ORACLE EVIDENCE UNTIL IT PASSES THE BOR INGESTION CONTRACT.
```

A map marker may disappear, move, aggregate or change styling without changing historical Evidence.

## 3. Canonical flow

```text
┌────────────────────────────────────────────────────────────┐
│ External sources                                           │
│ GDELT · USGS · NASA FIRMS · OpenSky · AIS · sanctions ... │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
                 IntelligenceSourceAdapter
                             │
                             ▼
                 bor.collector-envelope.v1
                             │
                             ▼
                  SourceEvidenceIngestor
                             │
                             ▼
                    bor.evidence.v1
                             │
                             ▼
                       EvidenceStore
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
    Research / Council / Report     IntelObservationProjector
                                            │
                                            ▼
                               bor.intel-observation.v1
                                            │
                                            ▼
                              Global Intelligence Query API
                                            │
                                            ▼
                         MapLibre / Dossier / Evidence drilldown
                                            │
                                            ▼
                             Research / Thesis / Report links

BOR → BOT remains a separate, versioned evidence-only contract.
```

## 4. Proposed derived contract

### `bor.intel-observation.v1`

This is a **derived read model**, not a replacement for `bor.evidence.v1`.

Suggested shape:

```ts
interface IntelObservation {
  schemaVersion: 'bor.intel-observation.v1';
  observationId: string;

  evidenceIds: readonly string[];

  domain:
    | 'GEOPOLITICAL'
    | 'MARITIME'
    | 'AVIATION'
    | 'NATURAL_HAZARD'
    | 'SANCTIONS'
    | 'INFRASTRUCTURE'
    | 'ENVIRONMENT';

  eventType: string;

  eventTime?: string;
  observedAt: string;

  geo: {
    geometryType: 'POINT' | 'LINE' | 'POLYGON';
    coordinates: unknown;
    precision?: 'EXACT' | 'APPROXIMATE' | 'COUNTRY' | 'REGION';
    source: 'SOURCE' | 'DERIVED';
  };

  entityRefs: readonly string[];
  assetRefs: readonly string[];

  derivation?: {
    methodVersion: string;
    description: string;
  };

  freshness: 'CURRENT' | 'DELAYED' | 'STALE' | 'DATA_GAP';

  executionAuthority: false;
  reportPublicationAuthority: false;
}
```

### Invariants

- every `evidenceId` must resolve to canonical BOR Evidence,
- derived fields must identify a `methodVersion`,
- no derived severity is represented as observed fact,
- no trading or publication authority,
- historical observation identity must be deterministic,
- projection can be rebuilt from canonical Evidence + method version.

## 5. Source adapter contract

Each provider gets an isolated adapter.

Example:

```text
GdeltGeoAdapter
UsGsSeismicAdapter
FirmsFireAdapter
OpenSkyAdapter
AisAdapter
SanctionsAdapter
```

Adapter responsibilities:

- obey provider terms and attribution,
- enforce rate limits,
- normalize provider identifiers,
- preserve event/publication time,
- stamp BOR observation time,
- preserve retrieval URI,
- emit deterministic canonical content,
- report partial/failed cycles truthfully.

Adapters must not:

- write directly to the map read model,
- write directly to BOT,
- infer an asset purely to avoid an unresolved state,
- silently convert editorial provider scores into calibrated risk.

## 6. Infrastructure cache

Use an OSIRIS-inspired cache around provider fetching:

```text
request
  ↓
fresh cache? ── yes → return
  ↓ no
in-flight? ───── yes → await shared promise
  ↓ no
fetch upstream
  ├─ success → cache result
  └─ failure → stale fallback if policy allows
```

Cache policy is per source and must carry:

- TTL,
- last-success time,
- last-attempt time,
- stale-serve policy,
- source rate limit,
- error state.

The cache is operational state. It never changes historical Evidence semantics.

## 7. Query API

The Global Intelligence UI should query the read model, not external APIs directly.

Candidate endpoint semantics:

```text
GET /intelligence/observations
  ?bbox=...
  &domains=...
  &from=...
  &to=...
  &freshness=...
  &assetId=...
  &entityId=...
  &cursor=...
```

Response should include:

- observation ID,
- geometry,
- domain/event type,
- timestamps,
- freshness,
- evidence count,
- source summary,
- affected entities/assets only when supported,
- contradiction/data-gap flags where available.

Deep evidence remains fetched by explicit Evidence endpoints.

## 8. Dossier interaction

Tap/click an observation or region:

```text
Map observation
   ↓
Dossier
   ├─ What happened?
   ├─ When was it knowable?
   ├─ Where?
   ├─ Sources / Evidence
   ├─ Contradicting Evidence
   ├─ Related entities
   ├─ Related assets / exposure hypotheses
   ├─ Thesis / scenarios
   └─ Open full research
```

The dossier must never manufacture a relation merely because two items share geographic proximity.

## 9. Market exposure layer

Do not reproduce OSIRIS's hardcoded supplier-risk rules.

Introduce a separate future contract:

`bor.market-exposure-link.v1`

Conceptually:

```text
Observation
   ↓
Facility / Entity
   ↓
Supplier / Customer / Infrastructure relationship
   ↓
Listed Asset
   ↓
Exposure hypothesis
```

Each link requires:

- source Evidence IDs,
- relation type,
- method/source version,
- effective time where applicable,
- confidence semantics only if defined and validated,
- counter-evidence / unresolved state.

## 10. UI direction

### Placement

Do not add a new bottom-navigation destination in v0.

Preferred entry points:

- Report → Global Intelligence
- Markets → World / Events
- asset dossier → geographic exposures

Desktop may support a wider map + evidence rail. Mobile should use:

```text
full-screen map
      +
compact layer/filter controls
      +
bottom preview card
      ↓
full-page dossier
```

### Visual language

Follow the existing BLACK ORACLE design baseline:

- light primary surface,
- warm ivory secondary surface,
- restrained gold accents,
- deep navy/charcoal text,
- semantic market/risk colors only where necessary,
- no cyberpunk neon,
- no ornamental threat glow,
- no fake HUD density.

### Runtime truth

Every consequential item should expose:

- event/observation time,
- source,
- freshness,
- observed vs derived status,
- Evidence lineage,
- method version for derived relationships/scores,
- explicit data-gap state.

## 11. First implementation experiment

### GI-001 — GDELT + USGS Evidence-backed pilot

Hypothesis:

> Two low-friction public geo-event sources can be normalized into canonical BOR Evidence and projected into a stable geo read model without weakening BOR provenance or authority boundaries.

Implement only:

- GDELT geocoded events fixture/adapter,
- USGS earthquake fixture/adapter,
- deterministic collector envelopes,
- `bor.intel-observation.v1` projector,
- offline deterministic tests.

Do **not** implement:

- MapLibre UI,
- AIS,
- OpenSky,
- model-generated risk,
- supplier exposure inference,
- BOT integration.

### Acceptance

- replay-identical inputs create deterministic identities,
- published/event time remains distinct from observed time,
- invalid chronology fails closed,
- provider outage can be represented without fake current data,
- every observation resolves to Evidence,
- unresolved assets/entities remain unresolved,
- authority remains false,
- projection can be recreated from Evidence.

## 12. Rollback

GI-001 must be additive and removable without mutating:

- existing Evidence rows,
- BOR-S0–S12 artifacts,
- BOT runtime,
- PAPER/LIVE_SHADOW state,
- Risk configuration,
- broker state.

## 13. Decision gate

Implementation begins only after the current BOR Alpha artifact/export integrity work reaches its next stable gate.

**Architecture decision:** integrate OSIRIS ideas as BOR-native evidence-backed intelligence infrastructure; do not fork OSIRIS into BLACK ORACLE.
