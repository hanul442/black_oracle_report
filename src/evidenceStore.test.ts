import assert from 'node:assert/strict';
import test from 'node:test';
import { createEvidencePacket, type EvidencePacket } from './evidence.js';
import { InMemoryEvidenceStore } from './evidenceStore.js';

const NOW = new Date('2026-09-21T00:00:00.000Z');

function packet(evidenceId = 'ev-001', canonicalContent = 'Canonical evidence body.'): EvidencePacket {
  return createEvidencePacket({
    evidenceId,
    source: { sourceId: 'bok', sourceVersion: 'rss-v1', publisher: 'Bank of Korea' },
    asset: { status: 'RESOLVED', canonicalAssetId: 'KRW', symbol: 'KRW' },
    provenance: { retrievalUri: `https://example.test/${evidenceId}`, snapshotRef: `sha256:${evidenceId}`, retrievedBy: 'collector-v1' },
    publishedAt: '2026-09-20T22:00:00Z',
    observedAt: '2026-09-20T22:05:00Z',
    canonicalContent,
  }, NOW);
}

test('appends and reads immutable evidence by id', async () => {
  const store = new InMemoryEvidenceStore();
  const original = packet();
  assert.deepEqual(await store.append(original), { status: 'APPENDED', evidenceId: 'ev-001' });
  const read = await store.getById('ev-001');
  assert.deepEqual(read, original);
});

test('exact re-append is idempotent', async () => {
  const store = new InMemoryEvidenceStore();
  const original = packet();
  await store.append(original);
  assert.deepEqual(await store.append(original), { status: 'ALREADY_PRESENT', evidenceId: 'ev-001' });
});

test('same evidence id with different immutable packet fails closed', async () => {
  const store = new InMemoryEvidenceStore();
  await store.append(packet('ev-001', 'First body.'));
  await assert.rejects(store.append(packet('ev-001', 'Different body.')), /EVIDENCE_ID_CONFLICT/);
});

test('fingerprint lookup preserves all evidence observations', async () => {
  const store = new InMemoryEvidenceStore();
  const first = packet('ev-001');
  const second = createEvidencePacket({
    evidenceId: 'ev-002',
    source: first.source,
    asset: first.asset,
    provenance: { ...first.provenance, retrievalUri: 'https://example.test/ev-002' },
    publishedAt: first.publishedAt,
    observedAt: first.observedAt,
    canonicalContent: 'Canonical evidence body.',
    duplicateOfEvidenceId: 'ev-001',
  }, NOW);
  await store.append(first);
  await store.append(second);
  const matches = await store.findByFingerprint(first.contentFingerprint);
  assert.deepEqual(matches.map((item) => item.evidenceId), ['ev-001', 'ev-002']);
  assert.equal(matches[1]?.duplicateOfEvidenceId, 'ev-001');
});

test('mutating a returned copy cannot mutate stored evidence', async () => {
  const store = new InMemoryEvidenceStore();
  await store.append(packet());
  const read = await store.getById('ev-001');
  assert.ok(read);
  (read.source as { publisher: string }).publisher = 'MUTATED';
  const reread = await store.getById('ev-001');
  assert.equal(reread?.source.publisher, 'Bank of Korea');
});
