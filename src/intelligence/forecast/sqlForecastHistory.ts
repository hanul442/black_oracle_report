// Postgres adapter for Forecast History v2 (db/migrations/0002_forecast_history.sql).
// Same semantics as InMemoryForecastHistory: append-only revisions, identical
// re-writes are idempotent, and point-in-time reads only see complete lineage
// written by the cutoff.

import type { SqlEvidenceDriver } from '../evidence/sqlEvidenceStore.js';
import {
  canonicalJson,
  validateForecastHistoryRecord,
  type ForecastHistoryRecord,
  type ForecastKind,
  type ForecastWriteResult,
  type RealizedOutcome,
} from './forecastHistory.js';

export type SqlForecastDriver = SqlEvidenceDriver;

type RecordRow = { record: unknown };
type OutcomeRow = { forecast_artifact_id: string; forecast_revision_id: string; observed_at: string | Date; outcome: unknown };

function parseIso(value: string, code: string): string {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) throw new Error(code);
  return new Date(ms).toISOString();
}

// Postgres text/jsonb cannot store NUL or unpaired surrogates.
const UNSTORABLE = /\u0000|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/;
function isStorableString(value: string): boolean {
  return !UNSTORABLE.test(value);
}

function isPlainJson(value: unknown): boolean {
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'string') return isStorableString(value);
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isPlainJson);
  if (typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  if (proto !== Object.prototype && proto !== null) return false;
  // An undefined property is simply absent, as in JSON and canonicalJson.
  return Object.entries(value).every(([key, child]) => isStorableString(key) && (child === undefined || isPlainJson(child)));
}

/** jsonb can only hold plain JSON; refuse anything that would not round-trip exactly. */
function toJson(value: unknown, code: string): string {
  if (!isPlainJson(value)) throw new Error(code);
  return JSON.stringify(value);
}

function fromJson<T>(value: unknown): T {
  return (typeof value === 'string' ? JSON.parse(value) : value) as T;
}

// Byte order. Matches the in-memory code-unit order for every id except ones
// mixing astral characters with U+E000..U+FFFF.
const REVISION_ORDER = 'forecast_revision_id COLLATE "C"';

export class SqlForecastHistory {
  constructor(private readonly driver: SqlForecastDriver) {}

  async write(record: ForecastHistoryRecord): Promise<ForecastWriteResult> {
    validateForecastHistoryRecord(record);
    const json = toJson(record, 'FORECAST_RECORD_NOT_JSON');
    const result = await this.driver.query(`
      INSERT INTO bor_forecast_history (
        forecast_artifact_id, forecast_revision_id, schema_version, asset_id, kind,
        as_of, recorded_at, lineage_state, availability, record
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
      ON CONFLICT (forecast_artifact_id, forecast_revision_id) DO NOTHING
      RETURNING forecast_revision_id
    `, [
      record.forecastArtifactId, record.forecastRevisionId, record.schemaVersion, record.assetId, record.kind,
      // Normalized so the columns mean exactly what validation checked,
      // whatever the session time zone.
      parseIso(record.asOf, 'INVALID_AS_OF'), parseIso(record.recordedAt, 'INVALID_RECORDED_AT'), record.lineageState, record.availability, json,
    ]);
    if (result.rowCount === 1) return { status: 'APPENDED' };

    const existing = await this.getById(record.forecastArtifactId, record.forecastRevisionId);
    if (!existing || canonicalJson(existing) !== canonicalJson(record)) throw new Error('FORECAST_REVISION_IMMUTABLE');
    return { status: 'ALREADY_PRESENT' };
  }

  async getById(forecastArtifactId: string, forecastRevisionId?: string): Promise<ForecastHistoryRecord | null> {
    const result = forecastRevisionId === undefined
      ? await this.driver.query<RecordRow>(`
          SELECT record FROM bor_forecast_history WHERE forecast_artifact_id = $1
          ORDER BY recorded_at DESC, as_of DESC, ${REVISION_ORDER} DESC LIMIT 1
        `, [forecastArtifactId])
      : await this.driver.query<RecordRow>(
          'SELECT record FROM bor_forecast_history WHERE forecast_artifact_id = $1 AND forecast_revision_id = $2',
          [forecastArtifactId, forecastRevisionId],
        );
    return result.rows[0] ? fromJson<ForecastHistoryRecord>(result.rows[0].record) : null;
  }

  async getHistory(assetId: string, options: { from?: string; to?: string; kind?: ForecastKind } = {}): Promise<ForecastHistoryRecord[]> {
    const from = options.from === undefined ? null : parseIso(options.from, 'INVALID_FROM');
    const to = options.to === undefined ? null : parseIso(options.to, 'INVALID_TO');
    const result = await this.driver.query<RecordRow>(`
      SELECT record FROM bor_forecast_history
      WHERE asset_id = $1
        AND ($2::text IS NULL OR kind = $2)
        AND ($3::timestamptz IS NULL OR as_of >= $3)
        AND ($4::timestamptz IS NULL OR as_of <= $4)
      ORDER BY as_of ASC, recorded_at ASC, ${REVISION_ORDER} ASC
    `, [assetId, options.kind ?? null, from, to]);
    return result.rows.map((row) => fromJson<ForecastHistoryRecord>(row.record));
  }

  /** The forecast BLACK ORACLE would have shown at `cutoff` (see InMemoryForecastHistory.getAsOf). */
  async getAsOf(assetId: string, cutoff: string, kind?: ForecastKind): Promise<ForecastHistoryRecord | null> {
    const cutoffIso = parseIso(cutoff, 'INVALID_CUTOFF');
    const result = await this.driver.query<RecordRow>(`
      SELECT record FROM bor_forecast_history
      WHERE asset_id = $1
        AND ($2::text IS NULL OR kind = $2)
        AND lineage_state = 'COMPLETE'
        AND as_of <= $3::timestamptz
        AND recorded_at <= $3::timestamptz
      ORDER BY as_of DESC, recorded_at DESC, ${REVISION_ORDER} DESC
      LIMIT 1
    `, [assetId, kind ?? null, cutoffIso]);
    return result.rows[0] ? fromJson<ForecastHistoryRecord>(result.rows[0].record) : null;
  }

  async linkRealizedOutcome(outcome: RealizedOutcome): Promise<void> {
    const forecast = await this.getById(outcome.forecastArtifactId, outcome.forecastRevisionId);
    if (!forecast) throw new Error('UNKNOWN_FORECAST');
    const observedAt = parseIso(outcome.observedAt, 'INVALID_OUTCOME_OBSERVED_AT');
    if (Date.parse(observedAt) <= Date.parse(forecast.asOf)) throw new Error('OUTCOME_NOT_AFTER_AS_OF');
    // The database re-checks observed_at > as_of in a trigger.
    await this.driver.query(`
      INSERT INTO bor_forecast_realized_outcomes (forecast_artifact_id, forecast_revision_id, observed_at, outcome)
      VALUES ($1,$2,$3,$4::jsonb)
    `, [outcome.forecastArtifactId, outcome.forecastRevisionId, observedAt, toJson(outcome.outcome, 'OUTCOME_NOT_JSON')]);
  }

  /** observedAt comes back as a UTC ISO string. */
  async getRealizedOutcomes(forecastArtifactId: string, forecastRevisionId: string): Promise<readonly RealizedOutcome[]> {
    const result = await this.driver.query<OutcomeRow>(`
      SELECT forecast_artifact_id, forecast_revision_id, observed_at, outcome
      FROM bor_forecast_realized_outcomes
      WHERE forecast_artifact_id = $1 AND forecast_revision_id = $2
      ORDER BY outcome_seq ASC
    `, [forecastArtifactId, forecastRevisionId]);
    return result.rows.map((row) => ({
      forecastArtifactId: row.forecast_artifact_id,
      forecastRevisionId: row.forecast_revision_id,
      observedAt: new Date(row.observed_at).toISOString(),
      outcome: fromJson<Record<string, unknown>>(row.outcome),
    }));
  }
}
