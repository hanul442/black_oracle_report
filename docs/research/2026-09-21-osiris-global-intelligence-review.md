# OSIRIS → BLACK ORACLE Global Intelligence Research Review

Date: 2026-09-21  
Status: **DESIGN / RESEARCH — NOT ADOPTED INTO RUNTIME**  
Reference repository: `simplifaisoul/osiris`  
Reference commit: `03ad5caf53631bb0202dabc6449010a226674a8a`  
Target product: **BLACK ORACLE REPORT (BOR)**  
Trading authority: **NONE**

## Executive conclusion

OSIRIS is useful to BLACK ORACLE primarily as a **geospatial situational-awareness reference**, not as a trading engine and not as a direct runtime dependency for BLACK ORACLE BOT.

The correct integration boundary is:

```text
External geo / OSINT sources
        ↓
BOR source adapters
        ↓
bor.collector-envelope.v1
        ↓
SourceEvidenceIngestor
        ↓
bor.evidence.v1 / EvidenceStore
        ↓
derived Global Intelligence read model
        ↓
Map / Dossier / Research / Council / Report
        ↓
(optional versioned evidence-only contract)
        ↓
BLACK ORACLE BOT
```

The map is a **read model**, never the system of record and never a direct trading signal.

## What was reviewed

At the reference commit, OSIRIS is a Next.js / React / TypeScript application using MapLibre GL / WebGL with a broad collection of source-specific API routes. Relevant reviewed areas include:

- `src/components/OsirisMap.tsx`
- `src/app/page.tsx`
- `src/lib/sourceCache.ts`
- `src/components/AiOverview.tsx`
- `src/app/api/gdelt-events/route.ts`
- `src/app/api/maritime/route.ts`
- `src/app/api/country-risk/route.ts`
- `src/app/api/scm-suppliers/route.ts`
- `src/app/api/region-dossier/route.ts`
- README / package metadata / source tree

OSIRIS exposes numerous intelligence domains, including aviation, maritime, CCTV, seismic events, fires, weather, satellites, cyber, conflict, crypto, sanctions, Telegram OSINT and live news.

## Adopt / Adapt / Reject matrix

| OSIRIS element | Decision | BLACK ORACLE treatment |
| --- | --- | --- |
| MapLibre WebGL geospatial rendering | **ADOPT PATTERN** | Use for a BOR Global Intelligence surface when frontend work begins. |
| Toggleable intelligence layers | **ADAPT** | Convert into evidence-backed BOR layers, with freshness/provenance/status visible. |
| Progressive / on-demand layer fetch | **ADOPT PATTERN** | Preserve mobile performance and avoid unnecessary source calls. |
| Viewport-aware loading | **ADOPT PATTERN** | Query BOR read model by bbox/time/layer rather than loading the world. |
| Per-source API isolation | **ADOPT PATTERN** | Implement as BOR source adapters behind CollectorEnvelope. |
| TTL cache + in-flight de-duplication + stale-on-error | **ADOPT PATTERN** | Strong fit for external collector reliability and rate-limit discipline. |
| Real entity count / no fake throughput | **ADOPT PRINCIPLE** | Match BOR runtime-truth requirement. |
| GDELT 2.0 geocoded events | **ADAPT / PILOT** | High-priority EXTERNAL collector candidate. Preserve source timestamps and provenance. |
| USGS earthquakes / FIRMS fires | **ADAPT / PILOT** | Good deterministic geo-event pilots for Evidence → observation projection. |
| AIS maritime stream | **ADAPT LATER** | Useful for supply-chain monitoring; gate on API terms, ops cost and rate behavior. |
| OpenSky aviation | **ADAPT LATER** | Useful selectively for logistics / disruption research, not for Alpha critical path. |
| Region click → dossier | **ADOPT UX PATTERN** | Dossier should be composed from canonical BOR Evidence and cited sources. |
| AI Overview | **REBUILD** | Never feed arbitrary raw map payload directly to the research model. Use Evidence IDs and BOR research workflow. |
| Country risk score | **REJECT AS SIGNAL** | OSIRIS itself labels its baseline editorial and uncalibrated. Facts may be ingested; score is not evidence. |
| Supplier risk overlay | **REBUILD** | Current implementation uses hardcoded facilities and distance thresholds. Use evidence-backed entity/asset exposure graph instead. |
| Static conflict / chokepoint severity labels | **REJECT AS FACT** | May be displayed only if separately sourced/versioned as editorial methodology. |
| RECON port/DNS/WHOIS/vulnerability scanner | **REJECT FOR BOR** | Outside investment-research core; increases security and operational surface. |
| CCTV-heavy functionality | **DEFER / DEFAULT REJECT** | High privacy/ops cost, weak direct value for BO Alpha. |
| Personal routing / geolocation / navigation | **REJECT** | Product distraction from market intelligence. |
| Cyberpunk / neon OSIRIS visual language | **REJECT** | Conflicts with BLACK ORACLE's approved premium institutional white/ivory/gold direction. |
| Monolithic app/page structure | **REJECT** | Do not copy OSIRIS's large page/CSS architecture into BO. |

## High-value patterns

### 1. Source cache discipline

`src/lib/sourceCache.ts` is one of the most reusable architectural ideas in OSIRIS. It combines:

- TTL caching,
- shared in-flight promises to prevent request stampedes,
- stale-on-error fallback,
- bounded cache size,
- explicit stale inspection,
- optional snapshot seeding.

BLACK ORACLE should implement the same behavior at the **adapter/infrastructure layer**, while preserving BOR's canonical Evidence semantics. Cache state is transport state; it must not rewrite historical Evidence.

### 2. GDELT event ingestion

OSIRIS correctly separates its true GDELT 2.0 geocoded event route from other disaster feeds. This is a good candidate for BOR's first geo-intelligence collector because it has:

- explicit source identity,
- event coordinates,
- bounded result count,
- naturally versionable observation windows,
- clear cache cadence around GDELT's publication interval.

The output must still pass through:

`CollectorEnvelope → SourceRecord → EvidencePacket → EvidenceStore`.

### 3. Situational map as a query surface

OSIRIS's strongest product concept is not the globe itself but the ability to ask:

> What is happening where, when, from which source, and what else is connected to it?

BLACK ORACLE should extend this with:

- Evidence lineage,
- contradiction state,
- freshness,
- affected entities/assets,
- thesis/scenario links,
- Council / Red Team outputs,
- report-version links.

### 4. Rate-limit and attribution discipline

OSIRIS's latest reviewed commit centralizes Nominatim usage after excessive aggregate request rates were reported, adds caching and restores attribution. BLACK ORACLE should treat source terms, rate limits, caching and attribution as **first-class source-adapter requirements**, not post-launch cleanup.

## Important rejection findings

### OSIRIS country-risk is not a calibrated model

The reviewed route explicitly describes `base_risk` as an editorial 0–100 ordering rather than a calibrated or back-tested probability. BLACK ORACLE must not ingest that number as a market-risk signal.

If a country-risk model is built later, it needs:

- an explicit model/method version,
- calibrated target definition,
- historical evaluation,
- point-in-time inputs,
- documented feature lineage,
- uncertainty,
- validation against out-of-sample outcomes.

### OSIRIS supplier-risk overlay is demonstrative, not an investment-grade exposure model

The current implementation contains a small hardcoded supplier list and threshold rules such as proximity to earthquakes, fires and GDELT events.

The **interaction idea is useful**, but BLACK ORACLE should replace the implementation with an evidence-backed exposure graph:

```text
Event → Location → Entity / Facility → Supplier relationship → Listed asset → Exposure hypothesis
```

Every edge that matters to a research conclusion should be sourced or explicitly marked as derived.

## Product fit with BLACK ORACLE

### Correct ownership: BOR, not BOT

BOR already owns:

- source and NARS ingestion,
- Evidence Store,
- provenance,
- research agents,
- Council / Red Team,
- thesis/scenarios,
- reports and archive.

This makes Global Intelligence a natural BOR read surface.

BOT should continue to own:

- strategy validation,
- Router / NO_TRADE,
- deterministic Risk,
- execution,
- outcomes and replay.

There must be **no path**:

```text
OSINT event → map marker → trade
```

The only acceptable cross-product path is through explicit, versioned, non-authoritative research/evidence contracts.

## Recommended implementation order

### Phase 0 — Design only
This review and the companion architecture specification. No Alpha runtime change.

### Phase 1 — Evidence-backed geo collectors
Pilot two sources:

1. **GDELT 2.0 geocoded events**
2. **USGS seismic events**

Acceptance:
- deterministic adapter output,
- point-in-time timestamps,
- retrieval URI / source version,
- replay fixtures,
- partial failure reporting,
- no trading authority,
- no UI dependency.

### Phase 2 — Global Intelligence read model
Create a derived observation projection linked to canonical Evidence IDs.

### Phase 3 — Query API
Add bbox/layer/time/freshness filters and deterministic pagination.

### Phase 4 — Map UI
Add MapLibre only when BOR presentation/frontend work is ready. Follow BLACK ORACLE design system rather than OSIRIS styling.

### Phase 5 — Market exposure graph
Add evidence-backed event/entity/facility/asset links and evaluate whether they improve research quality.

### Phase 6 — Optional high-frequency sources
AIS / OpenSky only after API terms, cost, rate limits, reliability and operational value are verified.

## Alpha scheduling decision

BOR is currently moving through report artifact/export integrity work. The OSIRIS-inspired capability should **not preempt BOR-S12** or widen the Alpha execution surface.

Recommended gate:

```text
BOR-S12 complete
→ research/design acceptance
→ Phase 1 GDELT + USGS adapter experiment
→ only then commit to map UI
```

This preserves current Alpha scope while creating a high-value next product layer.

## Research decision

**ADOPT AS DESIGN DIRECTION, NOT AS A FORK.**

BLACK ORACLE should selectively reuse OSIRIS patterns and, where license-compatible and technically appropriate, small implementation ideas. It should not import OSIRIS as a subsystem or let its heuristics become canonical BLACK ORACLE intelligence.
