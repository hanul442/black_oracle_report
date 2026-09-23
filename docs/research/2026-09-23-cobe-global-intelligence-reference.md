# COBE / Global Intelligence Globe Reference Review

Date: 2026-09-23  
Status: **RESEARCH REVIEW / ADOPT FOR POST-FREEZE PROTOTYPE**  
Scope: BLACK ORACLE REPORT — Global Market Overview / Global Intelligence Map  
Implementation status: **NOT STARTED — current Foundation Remediation feature freeze remains authoritative**

## Question

Can COBE provide a sufficiently lightweight and expressive rendering layer for an Evidence-linked BLACK ORACLE world-intelligence interface without turning the globe into decorative UI or weakening BOR's canonical Evidence/read-model boundaries?

## Product hypothesis

A 3D globe is useful only when it encodes material intelligence:

- where a market-relevant event occurred or originated,
- which Evidence supports the event,
- which assets/regions are affected,
- which cross-border relationships are observed, inferred, or scenario-based,
- how the user drills from world state into Evidence and report artifacts.

The durable capability is therefore **geographic intelligence**, while COBE is an interchangeable renderer.

## Verified upstream facts

Reviewed upstream: `shuding/cobe`.

At review time:

- package version: **2.0.1**;
- license: **MIT**;
- upstream describes the library as **high performance, zero dependencies, ~5KB**;
- the public API supports location markers;
- v2 README demonstrates arcs between locations;
- markers and arcs may expose IDs for CSS Anchor Positioning / DOM-bound labels;
- `onRender` is called on every animation frame, so continuous animation has an explicit runtime cost;
- the documented configuration exposes rendering controls such as `devicePixelRatio`, dimensions, `mapSamples`, marker and arc settings.

Sources:

- https://github.com/shuding/cobe
- https://github.com/shuding/cobe/blob/main/README.md
- https://github.com/shuding/cobe/blob/main/package.json
- https://github.com/shuding/cobe/blob/main/LICENSE

## Performance note

An older upstream discussion raised a low PageSpeed result for the COBE demo. The discussion concluded that the web PageSpeed environment was using software rendering for WebGL, while local Chrome testing differed materially. The maintainer recommended a static fallback when WebGL/hardware rendering is unavailable and noted that their own product uses a fallback for that condition.

This does **not** prove COBE is cost-free on mobile. It supports a more specific design rule:

- benchmark on representative hardware,
- avoid unbounded continuous animation,
- pause when hidden/off-screen,
- lower rendering density on mobile,
- provide a non-WebGL fallback.

Source:

- https://github.com/shuding/cobe/issues/38

## Fit against BLACK ORACLE requirements

| Requirement | COBE fit | Notes |
| --- | --- | --- |
| Geographic event markers | Strong | Native marker model maps directly to resolved event coordinates. |
| Cross-border transmission arcs | Strong | v2 README includes arc support. |
| DOM/HTML labels | Strong | Bindable marker/arc IDs support CSS Anchor Positioning. |
| Small dependency footprint | Strong | Upstream describes zero deps and ~5KB. |
| Dark premium visual direction | Strong | Low-level configuration allows restrained styling. |
| Data semantics / Evidence lineage | Not provided | Must remain a BOR read-model responsibility. |
| Clustering | Partial / application work | Requires BOR-side aggregation or additional logic. |
| Full GIS features | Weak | COBE is a globe renderer, not a GIS platform. |
| Mobile fallback | Application responsibility | Must be designed explicitly. |
| Accessibility | Application responsibility | Globe requires mirrored list/keyboard semantics. |

## Why this fits BOR

BOR already owns:

`Source → Evidence → Analysis → Challenge → Synthesis → Report → Archive`

The proposed geographic layer adds a spatial projection:

`Evidence → Geo Resolution → Global Intelligence Event → Region / Transmission Projection → Globe`

This is valuable because the globe becomes an entry point into the existing Evidence system instead of a parallel truth source.

## Recommended BLACK ORACLE use cases

### 1. Global Market Overview

Compact main-screen globe showing:

- high-importance current events,
- region-level state,
- recent escalations,
- selected transmission paths,
- world signal list.

The user should be able to understand the world state before opening a full report.

### 2. NARS world-intelligence location layer

When NARS ingests world information:

- extract event-relevant geography,
- resolve location with confidence and semantic type,
- attach canonical Evidence IDs,
- display only defensible coordinates,
- retain unresolved/ambiguous items outside the globe point layer.

### 3. Global Intelligence Map

Detailed surface for:

- event clusters,
- region filters,
- Evidence drill-down,
- affected assets,
- scenario links,
- transmission relations,
- replay/time-window exploration.

### 4. Transmission visualization

Use arcs for relationships such as:

- policy/rates spillovers,
- FX transmission,
- energy/commodity shocks,
- supply-chain dependencies,
- liquidity/risk-sentiment propagation.

An arc must never imply causality merely because two points are connected. BOR must label each edge `OBSERVED`, `INFERRED`, or `SCENARIO` and preserve Evidence/invalidation conditions.

## Data-quality risks

### Publisher location is not event location

A Reuters/AP/newsroom location, company HQ, exchange venue, and event site can all differ. The extraction stage must classify the semantic meaning of the selected point.

### False precision

Country-level or region-level events should use explicit centroids/approximation states rather than fabricated city-level precision.

### Ambiguity

Names such as Georgia, Washington, or Congo can resolve to multiple places. Ambiguous resolution must remain visible and fail closed.

### Market-state overclaim

Article sentiment alone should not define a country's market condition. Region-level `RISK_ON / NEUTRAL / RISK_OFF` needs a versioned aggregation method and as-of window.

### Causal overclaim

A visually compelling arc can overstate causality. Relation type and supporting Evidence must be visible.

## UX rules

1. Globe is a context surface, not the only navigation mechanism.
2. Main screen shows a ranked subset, not every NARS item.
3. Clicking/tapping a marker opens Evidence-backed detail.
4. Approximate location is visually distinct from exact resolution.
5. Observed and inferred arcs use distinct styles.
6. Hover-only interaction is insufficient on mobile.
7. `prefers-reduced-motion` is honored.
8. A synchronized list remains available for accessibility and fallback.
9. Animation stops when the globe is not visible.
10. Failure to render WebGL cannot hide underlying market intelligence.

## Proposed engineering boundary

```text
Canonical Evidence
      ↓
Geo Extraction / Resolution
      ↓
Global Intelligence Read Model
      ↓
Globe View Adapter
      ↓
COBE
```

This boundary avoids locking domain data to COBE.

## Prototype budget

The first prototype should intentionally remain small:

- 10–20 fixture events,
- 3–5 transmission arcs,
- 5 major region summaries,
- one detail drawer,
- 24H / 7D filter,
- desktop + mobile degraded mode,
- static fallback.

No production NARS schema migration should occur in the prototype.

## Prototype success criteria

1. Event marker → Evidence detail round-trip works.
2. Exact/approximate/unresolved geography is distinguishable.
3. Globe remains usable on representative mobile hardware.
4. reduced-motion path removes non-essential animation.
5. static fallback preserves all critical information.
6. transmission edges expose relation type and Evidence.
7. no research claim is created in the renderer.
8. no execution/trading authority is introduced.

## Adopt / Reject

**ADOPT FOR POST-FREEZE PROTOTYPE.**

Reasoning:

- COBE is small and purpose-built for an interactive globe;
- markers, arcs, and DOM-bound labels map well to BLACK ORACLE's intended UX;
- the major risks are not library capability but data semantics, false precision, causal overclaim, performance, and accessibility;
- those risks can be bounded by an explicit Evidence-linked geographic contract and a renderer adapter.

Do **not** treat COBE as a permanent architecture dependency until the prototype passes mobile performance, fallback, accessibility, and data-integrity gates.

## Freeze note

The repository's current active sprint is **FEATURE FREEZE / FOUNDATION RUNTIME REMEDIATION**. This review records a future product direction only. It does not authorize implementation, dependency installation, schema migration, deployment, or a new Alpha work package.
