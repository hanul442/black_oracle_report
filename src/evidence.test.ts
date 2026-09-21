import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEvidencePacket,
  evaluateEvidenceStaleness,
  fingerprintCanonicalContent,
  sameContentIdentity,
} from './evidence.js';

const NOW = new Date('2026-09-21T00:00:00.000Z');

function baseInput() {
  return {
    evidenceId: 'ev-001',
    source: { sourceId: 'bok', sourceVersion: 'rss-v1', publisher: 'Bank of Korea' },
    asset: { status: 'RESOLVED' as const, canonicalAssetId: 'KRW', symbol: 'KRW' },
    provenance: { retrievalUri: 'https://example.test/item/1', snapshotRef: 'sha256:source', retrievedBy: 'collector-v1' },
    publishedAt: '2026-09-20T22:00:00Z',
    observedAt: '2026-09-20T22:05:00Z',
    canonicalContent: 'Policy statement canonical body.',
  };
}

test('creates a versioned evidence packet with no execution authority', () => {
  const packet = createEvidencePacket(baseInput(), NOW);
  assert.equal(packet.schemaVersion, 'bor.evidence.v1');
  assert.equal(packet.producer, 'BLACK_ORACLE_REPORT');
  assert.equal(packet.executionAuthority, false);
  assert.equal(packet.contentFingerprint, fingerprintCanonicalContent(baseInput().canonicalContent));
});

test('fails closed when publication is later than observation', () => {
  assert.throws(() => createEvidencePacket({ ...baseInput(), publishedAt: '2026-09-20T23:00:00Z', observedAt: '2026-09-20T22:05:00Z' }, NOW), /PUBLICATION_AFTER_OBSERVATION/);
});

test('fails closed on invalid or future observation timestamps', () => {
  assert.throws(() => createEvidencePacket({ ...baseInput(), observedAt: 'not-a-time' }, NOW), /INVALID_OBSERVED_AT/);
  assert.throws(() => createEvidencePacket({ ...baseInput(), observedAt: '2026-09-21T00:01:00Z' }, NOW), /FUTURE_OBSERVATION/);
});

test('preserves unresolved asset state rather than guessing mapping', () => {
  const packet = createEvidencePacket({ ...baseInput(), asset: { status: 'UNRESOLVED' as const, query: 'UNKNOWNCO', reason: 'NO_CANONICAL_MATCH' } }, NOW);
  assert.deepEqual(packet.asset, { status: 'UNRESOLVED', query: 'UNKNOWNCO', reason: 'NO_CANONICAL_MATCH' });
});

test('duplicate content is detectable while lineage remains explicit', () => {
  const first = createEvidencePacket(baseInput(), NOW);
  const second = createEvidencePacket({ ...baseInput(), evidenceId: 'ev-002', duplicateOfEvidenceId: 'ev-001' }, NOW);
  assert.equal(sameContentIdentity(first, second), true);
  assert.equal(second.duplicateOfEvidenceId, 'ev-001');
  assert.throws(() => createEvidencePacket({ ...baseInput(), duplicateOfEvidenceId: 'ev-001' }, NOW), /SELF_DUPLICATE/);
});

test('staleness is evaluated without mutating historical evidence', () => {
  const packet = createEvidencePacket(baseInput(), NOW);
  const stale = evaluateEvidenceStaleness(packet, new Date('2026-09-22T23:00:00Z'), 24 * 60 * 60 * 1000);
  assert.equal(stale.status, 'STALE');
  assert.equal(packet.observedAt, '2026-09-20T22:05:00.000Z');
});
