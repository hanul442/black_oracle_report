import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { getAlphaReadApiResponse } from './alphaReadApi.js';
import { createAlphaReadModelFileResolver } from './alphaReadModelFileResolver.js';
import { ensureFoundationRuntimeSeed } from './foundationRuntimeSeed.js';

test('seeds, resolves, and reuses a canonical authority-free Foundation artifact', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bor-foundation-seed-'));
  try {
    const artifactPath = join(dir, 'alpha-read-model.json');
    const env = {
      BOR_FOUNDATION_ATTESTATION_SEED: 'true',
      BOR_ALPHA_READ_MODEL_PATH: artifactPath,
    };
    const first = ensureFoundationRuntimeSeed(env);
    assert.equal(first?.seeded, true);
    assert.equal(first?.executionAuthority, false);
    assert.equal(first?.reportPublicationAuthority, false);
    assert.equal(first?.botDependency, false);

    const parsed = JSON.parse(readFileSync(artifactPath, 'utf8')) as { title?: unknown };
    assert.equal(parsed.title, 'BOR Foundation Runtime Attestation');
    const response = getAlphaReadApiResponse('GET', createAlphaReadModelFileResolver(env)());
    assert.equal(response.statusCode, 200);

    const second = ensureFoundationRuntimeSeed(env);
    assert.equal(second?.seeded, false);
    assert.equal(second?.contentFingerprint, first?.contentFingerprint);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('disabled seed is a no-op and an existing invalid artifact fails closed', () => {
  assert.equal(ensureFoundationRuntimeSeed({}), null);
  const dir = mkdtempSync(join(tmpdir(), 'bor-foundation-seed-'));
  try {
    const artifactPath = join(dir, 'alpha-read-model.json');
    writeFileSync(artifactPath, '{"tampered":true}', 'utf8');
    assert.throws(() => ensureFoundationRuntimeSeed({
      BOR_FOUNDATION_ATTESTATION_SEED: 'true',
      BOR_ALPHA_READ_MODEL_PATH: artifactPath,
    }), /integrity\/no-authority/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
