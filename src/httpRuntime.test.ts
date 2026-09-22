import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import type { AlphaReadModel } from './alphaReadModel.js';
import { getBorHttpResponse } from './httpRuntime.js';

const NOW = new Date('2026-09-21T04:30:00.000Z');
function hash(value: unknown) { return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex'); }
function model(): Readonly<AlphaReadModel> {
  const core = {
    schemaVersion: 'bor.alpha-read-model.v1' as const,
    projectionId: 'p1', reportId: 'r1', seriesId: 's1', reportVersion: 2,
    asOf: '2026-09-21T05:20:00.000Z', reportContentFingerprint: 'report-fp',
    exportId: 'e1', exportFingerprint: 'export-fp', title: 'Report', summary: 'Summary', thesis: 'Thesis',
    scenarios: [] as unknown as AlphaReadModel['scenarios'],
    citationEvidenceIds: Object.freeze(['ev-1', 'ev-2']),
    unresolvedDisagreements: Object.freeze(['disagreement']), dataGaps: Object.freeze(['gap']),
  };
  return Object.freeze({ ...core, contentFingerprint: hash(core), executionAuthority: false as const, reportPublicationAuthority: false as const, botDependency: false as const });
}

test('health is ready without BOT or broker configuration', () => {
  const response = getBorHttpResponse('/health', 'GET', { NODE_ENV: 'test' }, NOW);
  assert.equal(response.statusCode, 200); assert.equal(response.body.ok, true);
  const runtime = response.body.runtime as { status: string; tradingAuthority: boolean; botDependency: boolean; blockers: string[] };
  assert.equal(runtime.status, 'READY'); assert.equal(runtime.tradingAuthority, false); assert.equal(runtime.botDependency, false); assert.deepEqual(runtime.blockers, []);
});

test('health fails closed on forbidden trading environment names without exposing values', () => {
  const response = getBorHttpResponse('/health', 'GET', { NODE_ENV: 'production', UPBIT_ACCESS_KEY: 'super-secret-never-return', BROKER_SECRET: 'another-secret-never-return' }, NOW);
  assert.equal(response.statusCode, 503); assert.equal(response.body.ok, false);
  const serialized = JSON.stringify(response.body); assert.doesNotMatch(serialized, /super-secret-never-return/); assert.doesNotMatch(serialized, /another-secret-never-return/); assert.match(serialized, /FORBIDDEN_TRADING_ENV/);
});

test('version surface is authority-free and stable', () => {
  const response = getBorHttpResponse('/version', 'GET', {}, NOW);
  assert.equal(response.statusCode, 200); assert.equal(response.body.tradingAuthority, false); assert.equal(response.body.botDependency, false); assert.equal(typeof response.body.version, 'string');
});

test('Alpha report route delegates canonical model without rewriting evidence or uncertainty', () => {
  const canonical = model();
  const response = getBorHttpResponse('/api/alpha/report', 'GET', {}, NOW, () => canonical);
  assert.equal(response.statusCode, 200); assert.equal(response.body.ok, true); assert.equal(response.body.model, canonical);
  const returned = response.body.model as AlphaReadModel;
  assert.deepEqual(returned.citationEvidenceIds, ['ev-1', 'ev-2']);
  assert.deepEqual(returned.unresolvedDisagreements, ['disagreement']); assert.deepEqual(returned.dataGaps, ['gap']);
  assert.equal(response.body.executionAuthority, false); assert.equal(response.body.reportPublicationAuthority, false); assert.equal(response.body.botDependency, false);
});

test('Alpha report route preserves unavailable and integrity failures', () => {
  const unavailable = getBorHttpResponse('/api/alpha/report', 'GET', {}, NOW);
  assert.equal(unavailable.statusCode, 404); assert.equal(unavailable.body.error, 'ALPHA_READ_MODEL_UNAVAILABLE');
  const canonical = model(); const tampered = { ...canonical, summary: 'silently changed' } as AlphaReadModel;
  const rejected = getBorHttpResponse('/api/alpha/report', 'GET', {}, NOW, () => tampered);
  assert.equal(rejected.statusCode, 409); assert.equal(rejected.body.error, 'ALPHA_READ_MODEL_INTEGRITY_FAILURE');
});

test('Alpha route is GET-only and does not resolve state for unsupported methods', () => {
  let reads = 0;
  const response = getBorHttpResponse('/api/alpha/report', 'POST', {}, NOW, () => { reads += 1; return model(); });
  assert.equal(response.statusCode, 405); assert.equal(response.body.error, 'METHOD_NOT_ALLOWED'); assert.equal(reads, 0);
});

test('HTML Alpha report surface uses the same integrity-gated model and no-authority contract', () => {
  const canonical = model();
  const response = getBorHttpResponse('/alpha/report', 'GET', {}, NOW, () => canonical);
  assert.equal(response.statusCode, 200);
  assert.equal(response.contentType, 'text/html; charset=utf-8');
  assert.equal(response.body.model, canonical);
  assert.match(response.rawBody ?? '', /BLACK ORACLE · REPORT/);
  assert.match(response.rawBody ?? '', /Evidence citations/);
  assert.match(response.rawBody ?? '', /disagreement/);
  assert.match(response.rawBody ?? '', /Data gaps/);
  assert.match(response.rawBody ?? '', /Execution authority: false/);
});

test('HTML Alpha report surface is GET-only and fail-closed without resolving unsupported methods', () => {
  let reads = 0;
  const methodRejected = getBorHttpResponse('/alpha/report', 'POST', {}, NOW, () => { reads += 1; return model(); });
  assert.equal(methodRejected.statusCode, 405);
  assert.equal(reads, 0);
  assert.match(methodRejected.rawBody ?? '', /METHOD_NOT_ALLOWED/);

  const unavailable = getBorHttpResponse('/alpha/report', 'GET', {}, NOW);
  assert.equal(unavailable.statusCode, 404);
  assert.match(unavailable.rawBody ?? '', /ALPHA_READ_MODEL_UNAVAILABLE/);

  const canonical = model();
  const tampered = { ...canonical, thesis: 'tampered' } as AlphaReadModel;
  const integrityRejected = getBorHttpResponse('/alpha/report', 'GET', {}, NOW, () => tampered);
  assert.equal(integrityRejected.statusCode, 409);
  assert.match(integrityRejected.rawBody ?? '', /ALPHA_READ_MODEL_INTEGRITY_FAILURE/);
});

test('non-GET and unknown routes remain explicit and isolated', () => {
  assert.equal(getBorHttpResponse('/health', 'POST', {}, NOW).statusCode, 405);
  assert.equal(getBorHttpResponse('/unknown', 'GET', {}, NOW, () => model()).statusCode, 404);
});
