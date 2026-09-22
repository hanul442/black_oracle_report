import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { getAlphaReadApiResponse } from './alphaReadApi.js';
import type { AlphaReadModel } from './alphaReadModel.js';
import { createAlphaReadModelFileResolver } from './alphaReadModelFileResolver.js';
import {
  persistAlphaReadModelArtifact,
  persistConfiguredAlphaReadModelArtifact,
} from './alphaReadModelArtifactWriter.js';

function fingerprint(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
}

function model(version = 1, title = 'Canonical Alpha'): Readonly<AlphaReadModel> {
  const core = {
    schemaVersion: 'bor.alpha-read-model.v1' as const,
    projectionId: `projection-${version}`,
    reportId: `report-${version}`,
    seriesId: 'series-1',
    reportVersion: version,
    asOf: `2026-09-22T0${Math.min(version, 9)}:00:00.000Z`,
    reportContentFingerprint: `report-fp-${version}`,
    exportId: `export-${version}`,
    exportFingerprint: `export-fp-${version}`,
    title,
    summary: `summary-${version}`,
    thesis: `thesis-${version}`,
    scenarios: [] as unknown as AlphaReadModel['scenarios'],
    citationEvidenceIds: Object.freeze([`ev-${version}`]),
    unresolvedDisagreements: Object.freeze([] as string[]),
    dataGaps: Object.freeze([] as string[]),
  };
  return Object.freeze({
    ...core,
    contentFingerprint: fingerprint(core),
    executionAuthority: false as const,
    reportPublicationAuthority: false as const,
    botDependency: false as const,
  });
}

test('persists a verified model atomically and the S19 resolver reads the exact artifact', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bor-s20-'));
  try {
    const path = join(dir, 'alpha.json');
    const canonical = model();
    const result = persistAlphaReadModelArtifact(canonical, path);
    assert.equal(result.atomicReplace, true);
    assert.equal(result.contentFingerprint, canonical.contentFingerprint);
    assert.equal(result.executionAuthority, false);
    assert.equal(existsSync(path), true);

    const resolver = createAlphaReadModelFileResolver({ BOR_ALPHA_READ_MODEL_PATH: path });
    const response = getAlphaReadApiResponse('GET', resolver());
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.model, canonical);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('rejects tampered or authority-escalated models before touching the target', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bor-s20-'));
  try {
    const path = join(dir, 'alpha.json');
    const canonical = model();
    const tampered = { ...canonical, title: 'changed after fingerprint' } as AlphaReadModel;
    assert.throws(() => persistAlphaReadModelArtifact(tampered, path), /integrity\/no-authority/);
    assert.equal(existsSync(path), false);

    const escalated = { ...canonical, reportPublicationAuthority: true } as unknown as AlphaReadModel;
    assert.throws(() => persistAlphaReadModelArtifact(escalated, path), /integrity\/no-authority/);
    assert.equal(existsSync(path), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('atomic replacement exposes only the new fully verified artifact', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bor-s20-'));
  try {
    const path = join(dir, 'alpha.json');
    persistAlphaReadModelArtifact(model(1, 'Version one'), path);
    const resolver = createAlphaReadModelFileResolver({ BOR_ALPHA_READ_MODEL_PATH: path });
    assert.equal((getAlphaReadApiResponse('GET', resolver()).body.model as AlphaReadModel).title, 'Version one');

    const second = model(2, 'Version two');
    persistConfiguredAlphaReadModelArtifact(second, { BOR_ALPHA_READ_MODEL_PATH: path });
    const response = getAlphaReadApiResponse('GET', resolver());
    assert.equal(response.statusCode, 200);
    assert.equal((response.body.model as AlphaReadModel).title, 'Version two');
    assert.equal(readFileSync(path, 'utf8').trim(), JSON.stringify(second));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('failed atomic replace cleans temporary artifacts and preserves an existing directory target', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bor-s20-'));
  try {
    const target = join(dir, 'alpha-target');
    mkdirSync(target);
    writeFileSync(join(target, 'sentinel'), 'keep', 'utf8');

    assert.throws(() => persistAlphaReadModelArtifact(model(), target));
    assert.equal(readFileSync(join(target, 'sentinel'), 'utf8'), 'keep');
    assert.deepEqual(readdirSync(dir).filter((name) => name.startsWith('alpha-target.tmp-')), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
