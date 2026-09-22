import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { getAlphaReadApiResponse } from './alphaReadApi.js';
import type { AlphaReadModel } from './alphaReadModel.js';
import { createAlphaReadModelFileResolver } from './alphaReadModelFileResolver.js';

function hash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
}

function model(): Readonly<AlphaReadModel> {
  const core = {
    schemaVersion: 'bor.alpha-read-model.v1' as const,
    projectionId: 'file-projection-1',
    reportId: 'file-report-1',
    seriesId: 'file-series-1',
    reportVersion: 1,
    asOf: '2026-09-22T03:30:00.000Z',
    reportContentFingerprint: 'report-fp',
    exportId: 'export-1',
    exportFingerprint: 'export-fp',
    title: 'Canonical file-backed report',
    summary: 'Read-only runtime artifact',
    thesis: 'Artifact integrity remains authoritative.',
    scenarios: [] as unknown as AlphaReadModel['scenarios'],
    citationEvidenceIds: Object.freeze(['ev-1']),
    unresolvedDisagreements: Object.freeze(['minority-view']),
    dataGaps: Object.freeze(['timing']),
  };
  return Object.freeze({
    ...core,
    contentFingerprint: hash(core),
    executionAuthority: false as const,
    reportPublicationAuthority: false as const,
    botDependency: false as const,
  });
}

test('missing resolver configuration remains unavailable', () => {
  const resolver = createAlphaReadModelFileResolver({});
  assert.equal(resolver(), undefined);
  assert.equal(getAlphaReadApiResponse('GET', resolver()).statusCode, 404);
});

test('missing configured artifact remains unavailable without synthesizing a report', () => {
  const resolver = createAlphaReadModelFileResolver({ BOR_ALPHA_READ_MODEL_PATH: '/definitely/missing/bor-alpha-model.json' });
  assert.equal(resolver(), undefined);
  assert.equal(getAlphaReadApiResponse('GET', resolver()).statusCode, 404);
});

test('verified canonical artifact is consumable by the existing integrity gate', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bor-s19-'));
  try {
    const path = join(dir, 'alpha.json');
    const canonical = model();
    writeFileSync(path, JSON.stringify(canonical), 'utf8');
    const resolver = createAlphaReadModelFileResolver({ BOR_ALPHA_READ_MODEL_PATH: path });
    const resolved = resolver();
    const response = getAlphaReadApiResponse('GET', resolved);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.ok, true);
    assert.deepEqual(response.body.model, canonical);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('tampered or malformed configured artifact remains fail-closed', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bor-s19-'));
  try {
    const path = join(dir, 'alpha.json');
    const canonical = model();
    writeFileSync(path, JSON.stringify({ ...canonical, thesis: 'tampered after fingerprint' }), 'utf8');
    const tampered = createAlphaReadModelFileResolver({ BOR_ALPHA_READ_MODEL_PATH: path });
    assert.equal(getAlphaReadApiResponse('GET', tampered()).statusCode, 409);

    writeFileSync(path, '{bad json', 'utf8');
    const malformed = createAlphaReadModelFileResolver({ BOR_ALPHA_READ_MODEL_PATH: path });
    assert.equal(getAlphaReadApiResponse('GET', malformed()).statusCode, 409);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('authority-escalated configured artifact remains an explicit integrity failure', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bor-s19-'));
  try {
    const path = join(dir, 'alpha.json');
    const canonical = model();
    writeFileSync(path, JSON.stringify({ ...canonical, executionAuthority: true }), 'utf8');
    const resolver = createAlphaReadModelFileResolver({ BOR_ALPHA_READ_MODEL_PATH: path });
    assert.equal(getAlphaReadApiResponse('GET', resolver()).statusCode, 409);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('resolver re-reads configured artifact without restart and never retains a stale valid copy', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bor-s19-'));
  try {
    const path = join(dir, 'alpha.json');
    const canonical = model();
    const resolver = createAlphaReadModelFileResolver({ BOR_ALPHA_READ_MODEL_PATH: path });

    writeFileSync(path, JSON.stringify(canonical), 'utf8');
    assert.equal(getAlphaReadApiResponse('GET', resolver()).statusCode, 200);

    writeFileSync(path, JSON.stringify({ ...canonical, title: 'changed without fingerprint update' }), 'utf8');
    assert.equal(getAlphaReadApiResponse('GET', resolver()).statusCode, 409);

    writeFileSync(path, JSON.stringify(canonical), 'utf8');
    assert.equal(getAlphaReadApiResponse('GET', resolver()).statusCode, 200);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
