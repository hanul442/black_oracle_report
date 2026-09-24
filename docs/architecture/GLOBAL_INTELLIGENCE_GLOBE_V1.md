# Global Intelligence Globe Contract v1

Status: **PROPOSED / POST-FREEZE DESIGN**  
Repository: `hanul442/black_oracle_report`  
Owner boundary: **BLACK ORACLE REPORT (BOR)**  
Proposed schema family: `bor.global-intelligence-event.v1`, `bor.geo-location-ref.v1`, `bor.transmission-edge.v1`  
Implementation gate: **Do not begin feature implementation while `docs/automation/ACTIVE_SPRINT.md` remains in Foundation Remediation feature freeze.**

## Purpose

Define a location-aware market-intelligence surface that turns NARS/external-source Evidence into an auditable geographic view of world events, regional market conditions, and cross-border transmission paths.

The globe is not decorative. It is a read-only intelligence interface over canonical BOR Evidence and derived, provenance-preserving geographic projections.

Primary product surfaces:

1. **Global Market Overview** — compact world-state view on the main BOR surface.
2. **Global Intelligence Map** — drill-down view for event location, Evidence, affected assets, scenarios, and transmission paths.

The intended user question is:

> What is happening, where is it happening, what Evidence supports it, and which markets may be affected?

## Product boundary

BOR owns:

- NARS/external-source ingestion,
- canonical Evidence and provenance,
- geographic extraction/resolution,
- region/event read projections,
- read-only market-intelligence visualization,
- report/scenario links,
- transmission hypotheses with explicit Evidence.

BOR does **not** own:

- broker credentials,
- order placement,
- portfolio mutation,
- execution routing,
- trading Risk authority,
- automatic causal certainty.

All globe surfaces remain read-only:

- `executionAuthority=false`
- `reportPublicationAuthority=false`
- `botDependency=false`

## Canonical flow

```text
NARS / External Collector
        ↓
CollectorEnvelope
        ↓
SourceRecord
        ↓
Canonical Evidence
        ↓
Geo Extraction Candidate
        ↓
Location Resolution
        ↓
Global Intelligence Event Projection
        ↓
Region Aggregation / Transmission Projection
        ↓
Global Market Overview / Global Intelligence Map
```

The globe must never become a second source of research truth. It renders a derived projection whose material claims point back to canonical Evidence IDs.

## Geographic semantics

A geographic point must represent **the location relevant to the event**, not merely the publisher location.

Each location must carry an explicit semantic type:

- `EVENT_SITE` — physical place where the event occurred.
- `POLICY_ORIGIN` — central bank, government, regulator, or institution originating a policy event.
- `ENTITY_HQ` — entity headquarters when the event is entity-specific and no better event site exists.
- `MARKET_VENUE` — exchange or trading venue when venue location is materially relevant.
- `REGION_CENTROID` — fallback for broad regions such as Middle East or Euro Area.
- `COUNTRY_CENTROID` — fallback when only country-level resolution is justified.
- `UNKNOWN` — no defensible location.

The UI must distinguish exact and approximate locations. A country/region centroid must never be rendered as if it were the exact site of an event.

## Location resolution

Recommended resolution states:

```ts
type LocationResolutionStatus =
  | 'RESOLVED'
  | 'AMBIGUOUS'
  | 'APPROXIMATE'
  | 'UNRESOLVED'
```

Each resolved location should retain:

- normalized place label,
- country / region,
- latitude / longitude,
- semantic type,
- resolution status,
- confidence,
- resolver/version,
- source Evidence IDs,
- optional ambiguity candidates.

Ambiguous or unresolved items remain visible in list views but must not be silently assigned a precise globe point.

## Proposed contracts

### GeoLocationRef

```ts
type GeoLocationRef = {
  id: string
  label: string
  countryCode?: string
  region?: string
  city?: string
  lat?: number
  lng?: number
  semanticType:
    | 'EVENT_SITE'
    | 'POLICY_ORIGIN'
    | 'ENTITY_HQ'
    | 'MARKET_VENUE'
    | 'REGION_CENTROID'
    | 'COUNTRY_CENTROID'
    | 'UNKNOWN'
  resolutionStatus:
    | 'RESOLVED'
    | 'AMBIGUOUS'
    | 'APPROXIMATE'
    | 'UNRESOLVED'
  confidence?: number
  resolver: string
  resolverVersion: string
  evidenceIds: string[]
}
```

### GlobalIntelligenceEvent

```ts
type GlobalIntelligenceEvent = {
  id: string
  asOf: string
  title: string
  summary: string
  category:
    | 'MACRO'
    | 'GEOPOLITICS'
    | 'POLICY'
    | 'EARNINGS'
    | 'CRYPTO'
    | 'SUPPLY_CHAIN'
    | 'ENERGY'
    | 'OTHER'
  location: GeoLocationRef
  urgency: number
  evidenceScore?: number
  evidenceIds: string[]
  affectedAssets: string[]
  state: 'NEW' | 'TRACKED' | 'ESCALATED' | 'RESOLVED'
  dataGaps: string[]
  disagreements: string[]
}
```

### TransmissionEdge

A transmission edge is a **hypothesis or observed relationship**, not an automatic causal claim.

```ts
type TransmissionEdge = {
  id: string
  asOf: string
  sourceEventId: string
  fromLocationId: string
  toLocationId: string
  channel:
    | 'RATES'
    | 'FX'
    | 'EQUITY'
    | 'COMMODITY'
    | 'SUPPLY_CHAIN'
    | 'LIQUIDITY'
    | 'RISK_SENTIMENT'
    | 'OTHER'
  relationType: 'OBSERVED' | 'INFERRED' | 'SCENARIO'
  strength?: number
  evidenceIds: string[]
  affectedAssets: string[]
  invalidationConditions: string[]
}
```

### RegionMarketSummary

```ts
type RegionMarketSummary = {
  region: string
  asOf: string
  window: '24H' | '7D' | '30D'
  activeEventCount: number
  topThemes: string[]
  affectedAssets: string[]
  riskState?: 'RISK_ON' | 'NEUTRAL' | 'RISK_OFF'
  riskMethodVersion?: string
  evidenceIds: string[]
  dataGaps: string[]
}
```

A region-level `riskState` must only be shown if its aggregation method is explicit and versioned. Raw article sentiment is insufficient to label a market `RISK_ON` or `RISK_OFF`.

## NARS integration

NARS should add **location extraction as a downstream enrichment step**, not as a mutation of canonical source text.

Recommended process:

1. ingest NARS item through the existing Collector Ingestion boundary;
2. persist canonical Evidence unchanged;
3. extract named entities and candidate locations;
4. classify which location is materially relevant to the event;
5. resolve candidate to coordinates;
6. retain confidence, semantic type, and Evidence lineage;
7. project only defensible locations into `GlobalIntelligenceEvent`;
8. aggregate events into regional views without deleting disagreements or data gaps.

This preserves the current Evidence-first principle and avoids conflating geocoding output with source truth.

## Main surface — Global Market Overview

The main BOR surface should use the globe as an at-a-glance world-state module.

### Minimum visible information

- active global event markers,
- recent high-urgency pulse events,
- major region summaries,
- selected cross-border transmission arcs,
- as-of timestamp,
- data freshness state,
- Evidence coverage / unresolved-location count.

### Interaction

- hover/focus: title, place, timestamp, category, affected assets;
- click/tap: open event detail drawer;
- region selection: focus globe and filter signal list;
- filter: category, region, asset class, risk level, time window;
- event detail: Evidence IDs, scenarios, disagreements, data gaps, related report.

The overview should not attempt to display every NARS item. It should render a bounded, ranked set and preserve access to the underlying list.

## Detail surface — Global Intelligence Map

The drill-down surface may expose:

- all resolved events in the selected time window,
- event clusters,
- location-resolution confidence,
- Evidence count and provenance links,
- affected assets,
- Bull/Base/Bear scenario links where available,
- observed/inferred/scenario transmission edges,
- regional summaries,
- timeline/replay filters.

The map is an exploration surface; canonical Evidence and report artifacts remain the source of truth.

## Visual semantics

Recommended semantic mapping:

- marker size → event importance / urgency;
- pulse → new or escalated event;
- arc → transmission relation;
- arc width → normalized relation strength;
- marker/arc label → CSS/DOM overlay;
- muted globe base → context, not decoration.

Avoid:

- excessive neon,
- continuously moving arcs without semantic meaning,
- unbounded marker density,
- color-only encoding,
- implying causal certainty from visual connection alone.

Every `INFERRED` or `SCENARIO` arc should be visually distinguishable from `OBSERVED`.

## COBE rendering adapter

COBE is the current candidate rendering engine, but the product contract must remain library-agnostic.

Adapter boundary:

```text
Global Intelligence Read Model
        ↓
Globe View Adapter
        ↓
COBE (candidate)
```

If COBE is later replaced, the event/location/transmission contracts should remain stable.

Required adapter capabilities:

- markers,
- arcs,
- focus/rotation state,
- DOM-bound labels,
- reduced-motion support,
- pause/resume,
- static fallback.

## Performance and accessibility

The globe must degrade gracefully.

### Desktop

- full interactive rendering,
- bounded markers/arcs,
- pointer/focus interaction,
- animation paused when off-screen or tab-hidden.

### Mobile

- lower device-pixel ratio and map sample count,
- bounded event count,
- minimal continuous animation,
- tap-first interaction,
- defer non-critical labels.

### Fallback

When WebGL/hardware acceleration is unavailable or intentionally disabled:

- render a static world-state image or 2D fallback,
- retain the signal list and all Evidence links,
- never make core intelligence inaccessible because the globe failed.

### Accessibility

- keyboard-focusable event list mirrors globe content,
- `prefers-reduced-motion` disables non-essential movement,
- non-color status indicators,
- screen-reader labels for event title, location, time, and state.

## Integrity rules

1. No marker without an event ID.
2. No precise coordinate claim without a resolution state.
3. No event summary without Evidence lineage.
4. No transmission edge without `relationType`.
5. No inferred transmission represented as observed fact.
6. No region risk label without method/version.
7. No client-side reconstruction of research truth.
8. Missing geography stays unresolved.
9. Stale/as-of state remains visible.
10. Globe rendering failure must not alter underlying research data.

## Alpha and freeze boundary

This design is **documentation only** while Foundation Remediation is active.

It does not:

- activate a new Alpha feature package,
- modify the current runtime objective,
- change BOR authority,
- change collector/Evidence schemas in production,
- authorize a new dependency,
- authorize deployment work.

Implementation should begin only after the active freeze is explicitly lifted and a dedicated work package is approved.

## Proposed post-freeze rollout

### G1 — Static prototype

- COBE adapter in isolated story/demo;
- 10–20 fixture events;
- no NARS production integration;
- mobile fallback and reduced-motion behavior.

### G2 — Geographic read model

- Evidence-linked location extraction;
- explicit resolution status;
- deterministic fixture/replay tests.

### G3 — NARS integration

- NARS-derived event geography;
- bounded main-screen ranking;
- event detail → Evidence / report links.

### G4 — Transmission layer

- observed/inferred/scenario edge types;
- Evidence-linked transmission explanations;
- invalidation conditions.

### G5 — Production hardening

- performance budgets,
- mobile profiling,
- accessibility validation,
- stale/failure-state tests,
- schema/version migration plan.

## Acceptance criteria for production adoption

A production merge should require:

1. canonical Evidence remains unchanged and append-only;
2. every rendered event maps to Evidence IDs;
3. ambiguous/unresolved location tests pass;
4. exact vs approximate geography is visible;
5. transmission relation types are explicit;
6. reduced-motion and static fallback paths pass;
7. mobile performance budget is measured on representative hardware;
8. globe failure leaves list/read-model access intact;
9. no BOT/trading authority is introduced;
10. full BOR CI remains green.

## Decision

**PROPOSED / ADOPT FOR POST-FREEZE PROTOTYPE.**

COBE is a strong candidate for the rendering layer, but the durable BLACK ORACLE capability is the Evidence-linked geographic intelligence contract, not the globe library itself.
