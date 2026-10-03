import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FORECAST_HISTORY_SCHEMA_VERSION,
  InMemoryForecastHistory,
  validateForecastHistoryRecord,
  type ForecastHistoryRecord,
} from './forecastHistory.js';

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

function withoutHorizon(record: ForecastHistoryRecord): ForecastHistoryRecord {
  const { horizonRef: _omitted, ...rest } = record;
  return rest;
}

test('CT-01: reconstruction keeps the consumed revision even when a later revision was known before the cutoff', () => {
  const history = new InMemoryForecastHistory();
  history.write(forecast());
  // r2 of the same Evidence became known at 06:00, before the 12:00 cutoff.
  // The forecast consumed r1 and must still read back with r1.
  const reconstructed = history.getAsOf('KRX:000660', '2026-10-01T12:00:00Z');
  assert.ok(EVIDENCE_R2.knownAt < '2026-10-01T12:00:00Z');
  assert.deepEqual(reconstructed?.consumedEvidence, [EVIDENCE_R1]);
});

test('rejects complete lineage without an exact Evidence revision', () => {
  const missing = forecast({ consumedEvidence: [{ evidenceId: 'ev-hbm', revisionId: ' ', knownAt: EVIDENCE_R1.knownAt }] });
  assert.throws(() => validateForecastHistoryRecord(missing), /MISSING_EVIDENCE_REVISION/);
});

test('rejects Evidence known after the forecast as-of', () => {
  assert.throws(() => validateForecastHistoryRecord(forecast({ consumedEvidence: [EVIDENCE_R2] })), /EVIDENCE_KNOWN_AFTER_AS_OF/);
});

test('rejects a record written before its own as-of', () => {
  assert.throws(() => validateForecastHistoryRecord(forecast({ recordedAt: '2026-10-01T02:59:59Z' })), /RECORDED_BEFORE_AS_OF/);
});

test('rejects an available forecast with no Evidence', () => {
  assert.throws(() => validateForecastHistoryRecord(forecast({ consumedEvidence: [] })), /AVAILABLE_FORECAST_WITHOUT_EVIDENCE/);
});

test('two forecasts for one asset keep separate identities and order by as-of', () => {
  const history = new InMemoryForecastHistory();
  history.write(forecast());
  history.write(forecast({
    forecastRevisionId: 'rev-2', asOf: '2026-10-02T03:00:00Z', recordedAt: '2026-10-02T03:00:05Z',
    consumedEvidence: [EVIDENCE_R2], payload: { low: 215000, mid: 225000, high: 238000 },
  }));
  assert.deepEqual(history.getHistory('KRX:000660').map((r) => r.forecastRevisionId), ['rev-1', 'rev-2']);
  assert.equal(history.getById('fc-000660-price', 'rev-1')?.consumedEvidence[0]?.revisionId, 'sha256:r1');
  assert.equal(history.getById('fc-000660-price')?.forecastRevisionId, 'rev-2');
});

test('point-in-time read ignores forecasts written after the cutoff', () => {
  const history = new InMemoryForecastHistory();
  history.write(forecast());
  history.write(forecast({ forecastRevisionId: 'rev-2', asOf: '2026-10-01T03:00:00Z', recordedAt: '2026-10-01T20:00:00Z' }));
  assert.equal(history.getAsOf('KRX:000660', '2026-10-01T12:00:00Z')?.forecastRevisionId, 'rev-1');
  assert.equal(history.getAsOf('KRX:000660', '2026-10-01T21:00:00Z')?.forecastRevisionId, 'rev-2');
  assert.equal(history.getAsOf('KRX:000660', '2026-10-01T02:00:00Z'), null);
});

test('a written revision cannot be changed; an identical re-write is idempotent', () => {
  const history = new InMemoryForecastHistory();
  assert.deepEqual(history.write(forecast()), { status: 'APPENDED' });
  assert.deepEqual(history.write(forecast()), { status: 'ALREADY_PRESENT' });
  assert.throws(() => history.write(forecast({ payload: { low: 1, mid: 2, high: 3 } })), /FORECAST_REVISION_IMMUTABLE/);
});

test('fair value and future price coexist without collapsing', () => {
  const history = new InMemoryForecastHistory();
  history.write(forecast());
  history.write(withoutHorizon(forecast({
    forecastArtifactId: 'fc-000660-value', kind: 'FAIR_VALUE', method: { methodId: 'dcf', methodVersion: '1.0.0', methodFamily: 'FUNDAMENTAL' },
    payload: { low: 190000, high: 240000 },
  })));
  assert.equal(history.getAsOf('KRX:000660', '2026-10-01T12:00:00Z', 'FAIR_VALUE')?.forecastArtifactId, 'fc-000660-value');
  assert.equal(history.getAsOf('KRX:000660', '2026-10-01T12:00:00Z', 'FUTURE_PRICE')?.forecastArtifactId, 'fc-000660-price');
  assert.throws(() => validateForecastHistoryRecord(forecast({ kind: 'FAIR_VALUE' })), /FAIR_VALUE_HAS_NO_HORIZON/);
  assert.throws(() => validateForecastHistoryRecord(withoutHorizon(forecast())), /FUTURE_PRICE_REQUIRES_HORIZON/);
});

test('realized outcome links to the forecast without changing it', () => {
  const history = new InMemoryForecastHistory();
  history.write(forecast());
  const before = structuredClone(history.getById('fc-000660-price', 'rev-1'));
  history.linkRealizedOutcome({
    forecastArtifactId: 'fc-000660-price', forecastRevisionId: 'rev-1', observedAt: '2026-10-08T06:30:00Z', outcome: { close: 228500 },
  });
  assert.deepEqual(history.getById('fc-000660-price', 'rev-1'), before);
  assert.equal(history.getRealizedOutcomes('fc-000660-price', 'rev-1').length, 1);
  assert.throws(() => history.linkRealizedOutcome({
    forecastArtifactId: 'fc-000660-price', forecastRevisionId: 'rev-1', observedAt: '2026-10-01T03:00:00Z', outcome: {},
  }), /OUTCOME_NOT_AFTER_AS_OF/);
});

test('legacy records without exact lineage stay readable but never serve point-in-time reads', () => {
  const history = new InMemoryForecastHistory();
  history.write(forecast({
    lineageState: 'INCOMPLETE_LEGACY',
    consumedEvidence: [{ evidenceId: 'ev-legacy', revisionId: '', knownAt: '' }],
  }));
  assert.equal(history.getHistory('KRX:000660').length, 1);
  assert.equal(history.getAsOf('KRX:000660', '2026-10-01T12:00:00Z'), null);
});

test('stored records are frozen copies', () => {
  const history = new InMemoryForecastHistory();
  const input = forecast();
  history.write(input);
  (input.payload as Record<string, unknown>).mid = 0;
  assert.equal(history.getById('fc-000660-price', 'rev-1')?.payload.mid, 220000);
  assert.ok(Object.isFrozen(history.getById('fc-000660-price', 'rev-1')));
});
