import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import type { AlphaReadApiResponse } from './alphaReadApi.js';
import type { AlphaReadModel } from './alphaReadModel.js';
import { renderAlphaReportPage } from './alphaReportPage.js';

function hash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
}

function model(): Readonly<AlphaReadModel> {
  const scenarios: AlphaReadModel['scenarios'] = Object.freeze([
    Object.freeze({ kind: 'BULL', narrative: 'Upside <script>alert(1)</script>', evidenceIds: Object.freeze(['ev-bull']), contradictingEvidenceIds: Object.freeze(['ev-bull-x']), catalysts: Object.freeze(['catalyst']), risks: Object.freeze(['risk']), invalidationConditions: Object.freeze(['invalidate']) }),
    Object.freeze({ kind: 'BASE', narrative: 'Base case', evidenceIds: Object.freeze(['ev-base']), contradictingEvidenceIds: Object.freeze([]), catalysts: Object.freeze([]), risks: Object.freeze([]), invalidationConditions: Object.freeze([]) }),
    Object.freeze({ kind: 'BEAR', narrative: 'Bear case', evidenceIds: Object.freeze(['ev-bear']), contradictingEvidenceIds: Object.freeze(['ev-bear-x']), catalysts: Object.freeze([]), risks: Object.freeze(['drawdown']), invalidationConditions: Object.freeze([]) }),
  ]);
  const core = {
    schemaVersion: 'bor.alpha-read-model.v1' as const,
    projectionId: 'projection-1',
    reportId: 'report-1',
    seriesId: 'series-1',
    reportVersion: 3,
    asOf: '2026-09-22T03:00:00.000Z',
    reportContentFingerprint: 'report-fingerprint',
    exportId: 'export-1',
    exportFingerprint: 'export-fingerprint',
    title: 'Alpha <Research>',
    summary: 'Evidence-first summary',
    thesis: 'The thesis remains conditional.',
    scenarios,
    citationEvidenceIds: Object.freeze(['ev-bull', 'ev-base', 'ev-bear']),
    unresolvedDisagreements: Object.freeze(['Council minority disagrees']),
    dataGaps: Object.freeze(['No verified catalyst timing']),
  };
  return Object.freeze({
    ...core,
    contentFingerprint: hash(core),
    executionAuthority: false as const,
    reportPublicationAuthority: false as const,
    botDependency: false as const,
  });
}

test('renders canonical report fields and explicit authority boundary', () => {
  const response: AlphaReadApiResponse = {
    statusCode: 200,
    body: Object.freeze({
      schemaVersion: 'bor.alpha-read-api.v1',
      ok: true,
      model: model(),
      executionAuthority: false,
      reportPublicationAuthority: false,
      botDependency: false,
    }),
  };
  const page = renderAlphaReportPage(response);
  assert.equal(page.statusCode, 200);
  assert.equal(page.contentType, 'text/html; charset=utf-8');
  assert.match(page.body, /Alpha &lt;Research&gt;/);
  assert.match(page.body, /Bull/i);
  assert.match(page.body, /Evidence citations/);
  assert.match(page.body, /Council minority disagrees/);
  assert.match(page.body, /No verified catalyst timing/);
  assert.match(page.body, /Execution authority: false/);
  assert.doesNotMatch(page.body, /<script>alert\(1\)<\/script>/);
  assert.match(page.body, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('renders fail-closed state without inventing report content', () => {
  const response: AlphaReadApiResponse = {
    statusCode: 409,
    body: Object.freeze({
      schemaVersion: 'bor.alpha-read-api.v1',
      ok: false,
      error: 'ALPHA_READ_MODEL_INTEGRITY_FAILURE',
      executionAuthority: false,
      reportPublicationAuthority: false,
      botDependency: false,
    }),
  };
  const page = renderAlphaReportPage(response);
  assert.equal(page.statusCode, 409);
  assert.match(page.body, /ALPHA_READ_MODEL_INTEGRITY_FAILURE/);
  assert.match(page.body, /No missing or inconsistent research state was repaired or synthesized/);
});
