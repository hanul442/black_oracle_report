import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { ALPHA_READ_MODEL_SCHEMA_VERSION, type AlphaReadModel } from './alphaReadModel.js';
import { createFileAlphaReadModelResolver } from './alphaReadModelResolver.js';

function fingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
}

function validModel(): AlphaReadModel {
  const core = {
    schemaVersion: ALPHA_READ_MODEL_SCHEMA_VERSION,
    projectionId: 'projection-s19-test',
    reportId: 'report-1',
    seriesId: 'series-1',
    reportVersion: 1,
    asOf: '2026-09-22T00:00:00.000Z',
    reportContentFingerprint: 'report-fingerprint',
    exportId: 'export-1',
    exportFingerprint: 'export-fingerprint',
    title: 'Alpha report',
    summary: 'Verified summary',
    thesis: 'Verified thesis',
    scenarios: [],
    citationEvidenceIds: ['evidence-1'],
    unresolvedDisagreements: ['disagreement remains explicit'],
    dataGaps: ['gap remains explicit'],
  };
  return {
    ...core,
    contentFingerprint: fingerprint(core),
    executionAuthority: false,
    reportPublicationAuthority: false,
    botDependency: false,
  };
}

function withTempFile(run: (path: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'bor-s19-'));
  try { run(join(dir, 'alpha-read-model.json')); } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('resolver returns unavailable when no artifact path is configured', () => {
  assert.equal(createFileAlphaReadModelResolver({})(), undefined);
});

test('resolver returns unavailable when configured artifact is absent', () => {
  assert.equal(createFileAlphaReadModelResolver({ BOR_ALPHA_READ_MODEL_PATH: '/definitely/missing/bor-alpha.json' })(), undefined);
});

test('resolver returns a verified no-authority canonical model', () => withTempFile((path) => {
  const model = validModel();
  writeFileSync(path, JSON.stringify(model));
  const resolved = createFileAlphaReadModelResolver({ BOR_ALPHA_READ_MODEL_PATH: path })();
  assert.ok(resolved);
  assert.equal(resolved.contentFingerprint, model.contentFingerprint);
  assert.equal(resolved.executionAuthority, false);
  assert.equal(resolved.reportPublicationAuthority, false);
  assert.equal(resolved.botDependency, false);
  assert.deepEqual(resolved.citationEvidenceIds, ['evidence-1']);
  assert.deepEqual(resolved.unresolvedDisagreements, ['disagreement remains explicit']);
  assert.deepEqual(resolved.dataGaps, ['gap remains explicit']);
}));

test('resolver fails closed on malformed, tampered, or authority-escalated artifacts', () => withTempFile((path) => {
  const resolve = createFileAlphaReadModelResolver({ BOR_ALPHA_READ_MODEL_PATH: path });
  writeFileSync(path, '{bad json');
  assert.equal(resolve(), undefined);

  const tampered = validModel();
  tampered.title = 'silently changed title';
  writeFileSync(path, JSON.stringify(tampered));
  assert.equal(resolve(), undefined);

  const escalated = { ...validModel(), executionAuthority: true };
  writeFileSync(path, JSON.stringify(escalated));
  assert.equal(resolve(), undefined);
}));

test('resolver re-reads the canonical artifact on each request/restart-style read', () => withTempFile((path) => {
  const model = validModel();
  writeFileSync(path, JSON.stringify(model));
  const resolve = createFileAlphaReadModelResolver({ BOR_ALPHA_READ_MODEL_PATH: path });
  assert.equal(resolve()?.projectionId, 'projection-s19-test');
  writeFileSync(path, '{bad json');
  assert.equal(resolve(), undefined);
}));
