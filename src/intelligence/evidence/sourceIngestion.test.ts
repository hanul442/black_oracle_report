import assert from 'node:assert/strict';
import test from 'node:test';

import { InMemoryEvidenceStore } from './evidenceStore.js';
import {
  SOURCE_RECORD_SCHEMA_VERSION,
  SourceEvidenceIngestor,
  type SourceRecord,
} from './sourceIngestion.js';

const NOW = new Date('2026-09-21T03:00:00.000Z');

function sourceRecord(overrides: Partial<SourceRecord> = {}): SourceRecord {
  return {
    schemaVersion: SOURCE_RECORD_SCHEMA_VERSION,
    sourceId: 'nars:reuters:story-1',
    sourceVersion: '2026-09-21T02:00:00Z',
    publisher: 'Reuters',
    retrievalUri: 'https://example.test/story-1',
    snapshotRef: 'sha256:snapshot-1',
    retrievedBy: 'bor-collector-v1',
    publishedAt: '2026-09-21T01:55:00.000Z',
    observedAt: '2026-09-21T02:00:00.000Z',
    canonicalContent: 'Company raises full-year guidance.',
    asset: { status: 'RESOLVED', canonicalAssetId: 'KRX:000001', symbol: '000001' },
    ...overrides,
  };
}

test('appends canonical BOR Evidence and replay is idempotent', async () => {
  const store = new InMemoryEvidenceStore();
  const ingestor = new SourceEvidenceIngestor(store);

  const first = await ingestor.ingest(sourceRecord(), NOW);
  const replay = await ingestor.ingest(sourceRecord(), NOW);

  assert.equal(first.persistence.status, 'APPENDED');
  assert.equal(replay.persistence.status, 'ALREADY_PRESENT');
  assert.equal(first.evidence.evidenceId, replay.evidence.evidenceId);
  assert.equal(first.evidence.executionAuthority, false);
  assert.equal(first.evidence.duplicateOfEvidenceId, undefined);
});

test('same canonical content from another source is preserved with duplicate lineage', async () => {
  const store = new InMemoryEvidenceStore();
  const ingestor = new SourceEvidenceIngestor(store);

  const original = await ingestor.ingest(sourceRecord(), NOW);
  const duplicate = await ingestor.ingest(sourceRecord({
    sourceId: 'nars:wire:story-77',
    sourceVersion: 'v2',
    publisher: 'Wire Mirror',
    retrievalUri: 'https://mirror.test/story-77',
    observedAt: '2026-09-21T02:10:00.000Z',
  }), NOW);

  assert.equal(duplicate.persistence.status, 'APPENDED');
  assert.equal(duplicate.evidence.duplicateOfEvidenceId, original.evidence.evidenceId);
  assert.notEqual(duplicate.evidence.evidenceId, original.evidence.evidenceId);
});

test('unresolved assets remain explicit rather than guessed', async () => {
  const store = new InMemoryEvidenceStore();
  const ingestor = new SourceEvidenceIngestor(store);
  const result = await ingestor.ingest(sourceRecord({
    asset: { status: 'UNRESOLVED', query: 'Acme preferred', reason: 'AMBIGUOUS_SYMBOL' },
  }), NOW);

  assert.deepEqual(result.evidence.asset, {
    status: 'UNRESOLVED',
    query: 'Acme preferred',
    reason: 'AMBIGUOUS_SYMBOL',
  });
});

test('fails closed on future observations', async () => {
  const ingestor = new SourceEvidenceIngestor(new InMemoryEvidenceStore());
  await assert.rejects(
    () => ingestor.ingest(sourceRecord({ observedAt: '2026-09-21T04:00:00.000Z' }), NOW),
    /FUTURE_OBSERVATION/,
  );
});

test('fails closed when publication is after observation', async () => {
  const ingestor = new SourceEvidenceIngestor(new InMemoryEvidenceStore());
  await assert.rejects(
    () => ingestor.ingest(sourceRecord({ publishedAt: '2026-09-21T02:30:00.000Z' }), NOW),
    /PUBLICATION_AFTER_OBSERVATION/,
  );
});

test('fails closed on empty canonical content before persistence', async () => {
  const ingestor = new SourceEvidenceIngestor(new InMemoryEvidenceStore());
  await assert.rejects(
    () => ingestor.ingest(sourceRecord({ canonicalContent: '   ' }), NOW),
    /EMPTY_CANONICAL_CONTENT/,
  );
});
