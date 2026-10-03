import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import type { SqlQueryResult } from '../evidence/sqlEvidenceStore.js';
import {
  FORECAST_HISTORY_SCHEMA_VERSION,
  InMemoryForecastHistory,
  type ForecastHistoryRecord,
} from './forecastHistory.js';
import { SqlForecastHistory, type SqlForecastDriver } from './sqlForecastHistory.js';

const MIGRATION = new URL('../../../db/migrations/0002_forecast_history.sql', import.meta.url);
const EVIDENCE_R1 = { evidenceId: 'ev-hbm', revisionId: 'sha256:r1', knownAt: '2026-10-01T00:00:00Z' };
const EVIDENCE_R2 = { evidenceId: 'ev-hbm', revisionId: 'sha256:r2', knownAt: '2026-10-01T06:00:00Z' };

function forecast(overrides: Partial<ForecastHistoryRecord> = {}): ForecastHistoryRecord {
  return {
    schemaVersion: FORECAST_HISTORY_SCHEMA_VERSION,
    forecastArtifactId: 'fc-000660-price',
    forecastRevisionId: 'rev-1',
    assetId: 'KRX:000660',
    kind: 'FUTURE_PRICE',
    method: { methodId: 'technical-trend', methodVersion: '1.0.0', methodFamily: 'TECHNICAL' },
    asOf: '2026-10-01T03:00:00Z',
    recordedAt: '2026-10-01T03:00:05Z',
    lineageState: 'COMPLETE',
    consumedEvidence: [EVIDENCE_R1],
    reasonSummary: 'HBM 수요 확대가 단기 상승 근거',
    availability: 'AVAILABLE',
    horizonRef: 'H5D',
    componentVersions: { forecastEngine: '0.1.0' },
    payload: { low: 210000, mid: 220000, high: 232000 },
    ...overrides,
  };
}

function fairValue(record: ForecastHistoryRecord): ForecastHistoryRecord {
  const { horizonRef: _omitted, ...rest } = record;
  return rest;
}

/** Records only; answers INSERTs as fresh and SELECTs from a canned row. */
function recordingDriver(selectRows: readonly Record<string, unknown>[] = []) {
  const calls: { sql: string; params: readonly unknown[] }[] = [];
  const driver: SqlForecastDriver = {
    async query<Row>(sql: string, params: readonly unknown[] = []): Promise<SqlQueryResult<Row>> {
      calls.push({ sql, params });
      if (/^\s*INSERT/i.test(sql)) return { rows: [{}] as Row[], rowCount: 1 };
      return { rows: selectRows as Row[], rowCount: selectRows.length };
    },
  };
  return { driver, calls };
}

test('write sends a parameterized append-only insert', async () => {
  const { driver, calls } = recordingDriver();
  assert.deepEqual(await new SqlForecastHistory(driver).write(forecast()), { status: 'APPENDED' });
  assert.match(calls[0]!.sql, /ON CONFLICT \(forecast_artifact_id, forecast_revision_id\) DO NOTHING/);
  assert.doesNotMatch(calls[0]!.sql, /DO UPDATE/);
  assert.equal(calls[0]!.params[0], 'fc-000660-price');
  assert.deepEqual(JSON.parse(String(calls[0]!.params[9])).consumedEvidence, [EVIDENCE_R1]);
  // Columns get normalized UTC instants; the record keeps the original strings.
  await new SqlForecastHistory(driver).write(forecast({ forecastRevisionId: 'kst', asOf: '2026-10-01T12:00:00+09:00', recordedAt: '2026-10-01T12:00:05+09:00' }));
  assert.deepEqual(calls[1]!.params.slice(5, 7), ['2026-10-01T03:00:00.000Z', '2026-10-01T03:00:05.000Z']);
});

test('write validates before touching the database', async () => {
  const { driver, calls } = recordingDriver();
  await assert.rejects(new SqlForecastHistory(driver).write(forecast({ consumedEvidence: [EVIDENCE_R2] })), /EVIDENCE_KNOWN_AFTER_AS_OF/);
  assert.equal(calls.length, 0);
});

test('write refuses payloads that jsonb cannot hold exactly', async () => {
  const { driver, calls } = recordingDriver();
  const store = new SqlForecastHistory(driver);
  await assert.rejects(store.write(forecast({ payload: { at: new Date('2026-10-01T00:00:00Z') } })), /FORECAST_RECORD_NOT_JSON/);
  await assert.rejects(store.write(forecast({ payload: { big: 1n } })), /FORECAST_RECORD_NOT_JSON/);
  await assert.rejects(store.write(forecast({ payload: { bad: Number.NaN } })), /FORECAST_RECORD_NOT_JSON/);
  await assert.rejects(store.write(forecast({ reasonSummary: 'nul\u0000' })), /FORECAST_RECORD_NOT_JSON/);
  await assert.rejects(store.write(forecast({ payload: { ['\ud800']: 1 } })), /FORECAST_RECORD_NOT_JSON/);
  assert.equal(calls.length, 0);
});

test('a conflicting re-write fails closed', async () => {
  const stored = forecast({ reasonSummary: 'different' });
  const driver: SqlForecastDriver = {
    async query<Row>(sql: string): Promise<SqlQueryResult<Row>> {
      if (/^\s*INSERT/i.test(sql)) return { rows: [], rowCount: 0 };
      return { rows: [{ record: JSON.stringify(stored) }] as Row[], rowCount: 1 };
    },
  };
  await assert.rejects(new SqlForecastHistory(driver).write(forecast()), /FORECAST_REVISION_IMMUTABLE/);
});

test('point-in-time read filters complete lineage by as-of and write time', async () => {
  const { driver, calls } = recordingDriver([{ record: forecast() }]);
  const result = await new SqlForecastHistory(driver).getAsOf('KRX:000660', '2026-10-01T12:00:00+09:00', 'FUTURE_PRICE');
  assert.deepEqual(result, forecast());
  assert.match(calls[0]!.sql, /lineage_state = 'COMPLETE'/);
  assert.match(calls[0]!.sql, /recorded_at <= \$3/);
  assert.deepEqual(calls[0]!.params, ['KRX:000660', 'FUTURE_PRICE', '2026-10-01T03:00:00.000Z']);
});

test('migration keeps forecast history append-only and bound to the stored record', async () => {
  const sql = await readFile(MIGRATION, 'utf8');
  assert.match(sql, /PRIMARY KEY \(forecast_artifact_id, forecast_revision_id\)/);
  assert.match(sql, /BEFORE UPDATE OR DELETE ON bor_forecast_history/);
  assert.match(sql, /BEFORE TRUNCATE ON bor_forecast_history/);
  assert.match(sql, /BEFORE UPDATE OR DELETE ON bor_forecast_realized_outcomes/);
  assert.match(sql, /CHECK \(recorded_at >= as_of\)/);
  assert.match(sql, /record->>'forecastRevisionId' = forecast_revision_id/);
  assert.doesNotMatch(sql, /DROP TABLE/i);
});

// ---------------------------------------------------------------------------
// Real Postgres: set BOR_TEST_PSQL to a libpq connection string to run these.

function psqlDriver(): SqlForecastDriver {
  const literal = (value: unknown): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return `'${String(value).replaceAll("'", "''")}'`;
  };
  return {
    async query<Row>(sql: string, params: readonly unknown[] = []): Promise<SqlQueryResult<Row>> {
      const bound = sql.replace(/\$(\d+)/g, (_m, n: string) => literal(params[Number(n) - 1]));
      const returnsRows = /^\s*SELECT/i.test(bound) || /RETURNING/i.test(bound);
      const statement = returnsRows ? `WITH q AS (${bound}) SELECT coalesce(json_agg(q), '[]'::json) FROM q` : bound;
      const out = psql(['-At', '-c', statement]);
      const rows = returnsRows ? (JSON.parse(out.trim()) as Row[]) : [];
      return { rows, rowCount: rows.length };
    },
  };
}

const PSQL = process.env.BOR_TEST_PSQL;
// Everything runs in a throwaway schema so a test can never touch real tables.
const TEST_SCHEMA = 'bor_forecast_history_test';

function psql(args: readonly string[]): string {
  return execFileSync('psql', [PSQL!, '-X', '-q', '-v', 'ON_ERROR_STOP=1', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PGOPTIONS: `-c search_path=${TEST_SCHEMA}` },
  });
}

async function freshStore(): Promise<SqlForecastHistory> {
  psql(['-c', `DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE; CREATE SCHEMA ${TEST_SCHEMA};`]);
  psql(['-f', MIGRATION.pathname]);
  return new SqlForecastHistory(psqlDriver());
}

test('postgres: behaves like the in-memory reference store', { skip: !PSQL && 'BOR_TEST_PSQL not set' }, async () => {
  const sql = await freshStore();
  const memory = new InMemoryForecastHistory();
  const records = [
    forecast(),
    // CT-01: a later revision consumed r2 but was only recorded at 20:00.
    forecast({ forecastRevisionId: 'rev-2', asOf: '2026-10-01T07:00:00Z', recordedAt: '2026-10-01T20:00:00Z', consumedEvidence: [EVIDENCE_R2] }),
    forecast({ forecastRevisionId: 'rev-b', asOf: '2026-10-01T08:00:00Z', recordedAt: '2026-10-01T08:00:00Z' }),
    forecast({ forecastRevisionId: 'rev-a', asOf: '2026-10-01T08:00:00Z', recordedAt: '2026-10-01T08:00:00Z' }),
    forecast({ forecastRevisionId: 'legacy', asOf: '2026-10-01T09:00:00Z', recordedAt: '2026-10-01T09:00:00Z', lineageState: 'INCOMPLETE_LEGACY', consumedEvidence: [{ evidenceId: 'old', revisionId: '', knownAt: '' }] }),
    fairValue(forecast({ forecastArtifactId: 'fc-000660-fair', kind: 'FAIR_VALUE', forecastRevisionId: 'f1' })),
  ];
  for (const record of records) {
    assert.deepEqual(await sql.write(record), memory.write(record));
  }
  // Identical re-write with another key order is idempotent; a changed one is not.
  const reordered = Object.fromEntries(Object.entries(records[0]!).reverse()) as unknown as ForecastHistoryRecord;
  assert.deepEqual(await sql.write(reordered), { status: 'ALREADY_PRESENT' });
  await assert.rejects(sql.write(forecast({ reasonSummary: 'changed' })), /FORECAST_REVISION_IMMUTABLE/);

  for (const cutoff of ['2026-10-01T02:00:00Z', '2026-10-01T12:00:00Z', '2026-10-01T21:00:00Z']) {
    for (const kind of [undefined, 'FUTURE_PRICE', 'FAIR_VALUE'] as const) {
      assert.deepEqual(await sql.getAsOf('KRX:000660', cutoff, kind), memory.getAsOf('KRX:000660', cutoff, kind), `${cutoff} ${kind}`);
    }
  }
  assert.deepEqual((await sql.getAsOf('KRX:000660', '2026-10-01T12:00:00Z', 'FUTURE_PRICE'))?.forecastRevisionId, 'rev-b');
  assert.deepEqual((await sql.getAsOf('KRX:000660', '2026-10-01T07:30:00Z', 'FUTURE_PRICE'))?.consumedEvidence, [EVIDENCE_R1]);
  assert.deepEqual(await sql.getHistory('KRX:000660'), memory.getHistory('KRX:000660'));
  assert.deepEqual(await sql.getHistory('KRX:000660', { from: '2026-10-01T07:00:00Z', to: '2026-10-01T08:00:00Z', kind: 'FUTURE_PRICE' }),
    memory.getHistory('KRX:000660', { from: '2026-10-01T07:00:00Z', to: '2026-10-01T08:00:00Z', kind: 'FUTURE_PRICE' }));
  assert.deepEqual(await sql.getById('fc-000660-price'), memory.getById('fc-000660-price'));
  assert.deepEqual(await sql.getById('fc-000660-price', 'rev-a'), memory.getById('fc-000660-price', 'rev-a'));
  assert.equal(await sql.getById('missing'), null);
});

test('postgres: outcomes and history cannot be rewritten', { skip: !PSQL && 'BOR_TEST_PSQL not set' }, async () => {
  const sql = await freshStore();
  await sql.write(forecast());
  await assert.rejects(sql.linkRealizedOutcome({ forecastArtifactId: 'fc-000660-price', forecastRevisionId: 'rev-1', observedAt: '2026-10-01T03:00:00Z', outcome: {} }), /OUTCOME_NOT_AFTER_AS_OF/);
  await assert.rejects(sql.linkRealizedOutcome({ forecastArtifactId: 'nope', forecastRevisionId: 'rev-1', observedAt: '2026-10-02T00:00:00Z', outcome: {} }), /UNKNOWN_FORECAST/);
  await sql.linkRealizedOutcome({ forecastArtifactId: 'fc-000660-price', forecastRevisionId: 'rev-1', observedAt: '2026-10-08T06:30:00Z', outcome: { close: 221500 } });
  await sql.linkRealizedOutcome({ forecastArtifactId: 'fc-000660-price', forecastRevisionId: 'rev-1', observedAt: '2026-10-09T06:30:00Z', outcome: { close: 219000 } });
  assert.deepEqual((await sql.getRealizedOutcomes('fc-000660-price', 'rev-1')).map((o) => o.outcome), [{ close: 221500 }, { close: 219000 }]);
  assert.deepEqual(await sql.getById('fc-000660-price', 'rev-1'), forecast());

  const run = (statement: string) => psql(['-c', statement]);
  for (const statement of [
    "UPDATE bor_forecast_history SET asset_id = 'X'",
    'DELETE FROM bor_forecast_history',
    'TRUNCATE bor_forecast_history CASCADE',
    "UPDATE bor_forecast_realized_outcomes SET outcome = '{}'",
    'DELETE FROM bor_forecast_realized_outcomes',
    "INSERT INTO bor_forecast_realized_outcomes (forecast_artifact_id, forecast_revision_id, observed_at, outcome) VALUES ('fc-000660-price','rev-1','2026-10-01T00:00:00Z','{}')",
  ]) {
    assert.throws(() => run(statement), /FORECAST_HISTORY_APPEND_ONLY|OUTCOME_NOT_AFTER_AS_OF/, statement);
  }
});
