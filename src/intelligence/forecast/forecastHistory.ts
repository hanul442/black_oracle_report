// Forecast History contract v2 (docs/contracts/FORECAST_HISTORY_CONTRACT_V2.md).
// Reference implementation: append-only, point-in-time reads, and exact
// binding to the Evidence revisions a forecast actually consumed.

export const FORECAST_HISTORY_SCHEMA_VERSION = 'bor.forecast-history.v2' as const;

export type ForecastKind = 'FAIR_VALUE' | 'FUTURE_PRICE';
export type ForecastAvailability = 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE';
export type ForecastLineageState = 'COMPLETE' | 'INCOMPLETE_LEGACY';

/** The exact Evidence revision a forecast consumed (CT-01). */
export interface ConsumedEvidenceRevision {
  evidenceId: string;
  /** Revision identity; for BOR Evidence this is the content fingerprint. */
  revisionId: string;
  /** When BLACK ORACLE learned this revision (Evidence observedAt). */
  knownAt: string;
}

export interface ForecastMethodRef {
  methodId: string;
  methodVersion: string;
  methodFamily: string;
}

export interface ForecastHistoryRecord {
  schemaVersion: typeof FORECAST_HISTORY_SCHEMA_VERSION;
  forecastArtifactId: string;
  forecastRevisionId: string;
  assetId: string;
  kind: ForecastKind;
  method: ForecastMethodRef;
  /** Knowledge cutoff the forecast was made with. */
  asOf: string;
  /** When the record was written; never earlier than asOf. */
  recordedAt: string;
  lineageState: ForecastLineageState;
  consumedEvidence: readonly ConsumedEvidenceRevision[];
  reasonSummary: string;
  availability: ForecastAvailability;
  availabilityReason?: string;
  /** FUTURE_PRICE only. */
  horizonRef?: string;
  reliabilityRef?: string;
  componentVersions: Readonly<Record<string, string>>;
  payload: Readonly<Record<string, unknown>>;
}

export interface RealizedOutcome {
  forecastArtifactId: string;
  forecastRevisionId: string;
  observedAt: string;
  outcome: Readonly<Record<string, unknown>>;
}

export type ForecastWriteResult =
  | { status: 'APPENDED' }
  | { status: 'ALREADY_PRESENT' };

function parseIso(value: string, code: string): number {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) throw new Error(code);
  return ms;
}

function requireNonEmpty(value: string | undefined, code: string): void {
  if (!value?.trim()) throw new Error(code);
}

export function validateForecastHistoryRecord(record: ForecastHistoryRecord): void {
  if (record.schemaVersion !== FORECAST_HISTORY_SCHEMA_VERSION) throw new Error('UNSUPPORTED_FORECAST_HISTORY_SCHEMA');
  requireNonEmpty(record.forecastArtifactId, 'EMPTY_FORECAST_ARTIFACT_ID');
  requireNonEmpty(record.forecastRevisionId, 'EMPTY_FORECAST_REVISION_ID');
  requireNonEmpty(record.assetId, 'EMPTY_ASSET_ID');
  requireNonEmpty(record.method.methodId, 'EMPTY_METHOD_ID');
  requireNonEmpty(record.method.methodVersion, 'EMPTY_METHOD_VERSION');
  requireNonEmpty(record.method.methodFamily, 'EMPTY_METHOD_FAMILY');
  requireNonEmpty(record.reasonSummary, 'EMPTY_REASON_SUMMARY');

  const asOfMs = parseIso(record.asOf, 'INVALID_AS_OF');
  const recordedMs = parseIso(record.recordedAt, 'INVALID_RECORDED_AT');
  if (recordedMs < asOfMs) throw new Error('RECORDED_BEFORE_AS_OF');

  if (record.kind === 'FUTURE_PRICE') requireNonEmpty(record.horizonRef, 'FUTURE_PRICE_REQUIRES_HORIZON');
  else if (record.horizonRef !== undefined) throw new Error('FAIR_VALUE_HAS_NO_HORIZON');

  if (record.availability !== 'AVAILABLE') requireNonEmpty(record.availabilityReason, 'MISSING_AVAILABILITY_REASON');

  const seen = new Set<string>();
  for (const ref of record.consumedEvidence) {
    requireNonEmpty(ref.evidenceId, 'EMPTY_EVIDENCE_ID');
    if (seen.has(ref.evidenceId)) throw new Error('DUPLICATE_CONSUMED_EVIDENCE');
    seen.add(ref.evidenceId);
    if (record.lineageState === 'COMPLETE') {
      requireNonEmpty(ref.revisionId, 'MISSING_EVIDENCE_REVISION');
      if (parseIso(ref.knownAt, 'INVALID_EVIDENCE_KNOWN_AT') > asOfMs) throw new Error('EVIDENCE_KNOWN_AFTER_AS_OF');
    }
  }
  if (record.lineageState === 'COMPLETE' && record.availability === 'AVAILABLE' && record.consumedEvidence.length === 0) {
    throw new Error('AVAILABLE_FORECAST_WITHOUT_EVIDENCE');
  }
}

function identity(artifactId: string, revisionId: string): string {
  return `${artifactId}\u0000${revisionId}`;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function frozenCopy<T>(value: T): T {
  return deepFreeze(structuredClone(value));
}

/** Key-order-independent identity used to recognise an identical re-write. */
function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) => {
    if (typeof v === 'bigint') return `bigint:${v.toString()}`;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      return Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
    }
    return v;
  });
}

/** Deterministic order: as-of, then write time, then revision id. */
function compareRevisions(a: ForecastHistoryRecord, b: ForecastHistoryRecord): number {
  return Date.parse(a.asOf) - Date.parse(b.asOf)
    || Date.parse(a.recordedAt) - Date.parse(b.recordedAt)
    || (a.forecastRevisionId < b.forecastRevisionId ? -1 : a.forecastRevisionId > b.forecastRevisionId ? 1 : 0);
}

/**
 * Deterministic reference store. No update or delete; a database adapter
 * must keep the same append-only and point-in-time semantics.
 */
export class InMemoryForecastHistory {
  readonly #records = new Map<string, ForecastHistoryRecord>();
  readonly #outcomes = new Map<string, readonly RealizedOutcome[]>();

  write(record: ForecastHistoryRecord): ForecastWriteResult {
    validateForecastHistoryRecord(record);
    const key = identity(record.forecastArtifactId, record.forecastRevisionId);
    const existing = this.#records.get(key);
    if (existing) {
      if (canonicalJson(existing) !== canonicalJson(record)) throw new Error('FORECAST_REVISION_IMMUTABLE');
      return { status: 'ALREADY_PRESENT' };
    }
    this.#records.set(key, frozenCopy(record));
    return { status: 'APPENDED' };
  }

  getById(forecastArtifactId: string, forecastRevisionId?: string): ForecastHistoryRecord | null {
    if (forecastRevisionId !== undefined) return this.#records.get(identity(forecastArtifactId, forecastRevisionId)) ?? null;
    const revisions = [...this.#records.values()]
      .filter((r) => r.forecastArtifactId === forecastArtifactId)
      .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt) || compareRevisions(a, b));
    return revisions.at(-1) ?? null;
  }

  getHistory(assetId: string, options: { from?: string; to?: string; kind?: ForecastKind } = {}): ForecastHistoryRecord[] {
    const fromMs = options.from === undefined ? -Infinity : parseIso(options.from, 'INVALID_FROM');
    const toMs = options.to === undefined ? Infinity : parseIso(options.to, 'INVALID_TO');
    return [...this.#records.values()]
      .filter((r) => r.assetId === assetId && (options.kind === undefined || r.kind === options.kind))
      .filter((r) => Date.parse(r.asOf) >= fromMs && Date.parse(r.asOf) <= toMs)
      .sort(compareRevisions);
  }

  /**
   * The forecast BLACK ORACLE would have shown at `cutoff`: only records
   * written by then with complete lineage, returned with exactly the Evidence
   * revisions they consumed (never a later revision of the same Evidence).
   */
  getAsOf(assetId: string, cutoff: string, kind?: ForecastKind): ForecastHistoryRecord | null {
    const cutoffMs = parseIso(cutoff, 'INVALID_CUTOFF');
    const eligible = this.getHistory(assetId, kind === undefined ? {} : { kind })
      .filter((r) => r.lineageState === 'COMPLETE')
      .filter((r) => Date.parse(r.asOf) <= cutoffMs && Date.parse(r.recordedAt) <= cutoffMs);
    return eligible.at(-1) ?? null;
  }

  linkRealizedOutcome(outcome: RealizedOutcome): void {
    const forecast = this.#records.get(identity(outcome.forecastArtifactId, outcome.forecastRevisionId));
    if (!forecast) throw new Error('UNKNOWN_FORECAST');
    if (parseIso(outcome.observedAt, 'INVALID_OUTCOME_OBSERVED_AT') <= Date.parse(forecast.asOf)) {
      throw new Error('OUTCOME_NOT_AFTER_AS_OF');
    }
    const key = identity(outcome.forecastArtifactId, outcome.forecastRevisionId);
    this.#outcomes.set(key, deepFreeze([...(this.#outcomes.get(key) ?? []), frozenCopy(outcome)]));
  }

  getRealizedOutcomes(forecastArtifactId: string, forecastRevisionId: string): readonly RealizedOutcome[] {
    return this.#outcomes.get(identity(forecastArtifactId, forecastRevisionId)) ?? [];
  }
}
