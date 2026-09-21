import assert from 'node:assert/strict';
import test from 'node:test';

import { InMemoryEvidenceStore } from './evidenceStore.js';
import { SourceEvidenceIngestor } from './sourceIngestion.js';
import {
  COLLECTOR_ENVELOPE_SCHEMA_VERSION,
  runCollectorCycle,
  type CollectorEnvelope,
} from './collectorCycle.js';

const NOW = new Date('2026-09-21T04:00:00.000Z');

function envelope(overrides: Partial<CollectorEnvelope> = {}): CollectorEnvelope {
  return {
    schemaVersion: COLLECTOR_ENVELOPE_SCHEMA_VERSION,
    origin: 'NARS',
    collectorId: 'bor-nars-collector',
    collectorVersion: '1.0.0',
    sourceId: 'nars:reuters:story-1',
    sourceVersion: '2026-09-21T03:00:00Z',
    publisher: 'Reuters',
    retrievalUri: 'https://example.test/story-1',
    snapshotRef: 'sha256:snapshot-1',
    publishedAt: '2026-09-21T02:55:00.000Z',
    observedAt: '2026-09-21T03:00:00.000Z',
    canonicalContent: 'Company raises full-year guidance.',
    asset: { status: 'RESOLVED', canonicalAssetId: 'KRX:000001', symbol: '000001' },
    ...overrides,
  };
}

function input(envelopes: readonly CollectorEnvelope[]) {
  return {
    collectorId: 'bor-nars-collector',
    collectorVersion: '1.0.0',
    envelopes,
  } as const;
}

test('mixed collector cycle preserves accepted records and exposes rejection', async () => {
  const store = new InMemoryEvidenceStore();
  const ingestor = new SourceEvidenceIngestor(store);

  const result = await runCollectorCycle(input([
    envelope(),
    envelope({
      sourceId: 'nars:future:story-2',
      sourceVersion: 'v1',
      observedAt: '2026-09-21T05:00:00.000Z',
      canonicalContent: 'Future observation should fail closed.',
    }),
    envelope({
      sourceId: 'nars:ambiguous:story-3',
      sourceVersion: 'v1',
      canonicalContent: 'Ambiguous preferred security reference.',
      asset: { status: 'UNRESOLVED', query: 'Acme preferred', reason: 'AMBIGUOUS_SYMBOL' },
    }),
  ]), ingestor, NOW);

  assert.equal(result.status, 'PARTIAL');
  assert.equal(result.executionAuthority, false);
  assert.equal(result.reportPublicationAuthority, false);
  assert.deepEqual(result.summary, {
    attempted: 3,
    appended: 2,
    alreadyPresent: 0,
    rejected: 1,
  });
  assert.equal(result.outcomes[1]?.status, 'REJECTED');
  assert.match(result.outcomes[1]?.status === 'REJECTED' ? result.outcomes[1].errorCode : '', /FUTURE_OBSERVATION/);
});

test('replaying an unchanged collector batch is idempotent', async () => {
  const store = new InMemoryEvidenceStore();
  const ingestor = new SourceEvidenceIngestor(store);
  const batch = input([envelope()]);

  const first = await runCollectorCycle(batch, ingestor, NOW);
  const replay = await runCollectorCycle(batch, ingestor, NOW);

  assert.equal(first.cycleId, replay.cycleId);
  assert.equal(first.outcomes[0]?.status, 'APPENDED');
  assert.equal(replay.outcomes[0]?.status, 'ALREADY_PRESENT');
  assert.deepEqual(replay.summary, {
    attempted: 1,
    appended: 0,
    alreadyPresent: 1,
    rejected: 0,
  });
});

test('duplicate content remains an appended observation with explicit lineage', async () => {
  const store = new InMemoryEvidenceStore();
  const ingestor = new SourceEvidenceIngestor(store);

  const result = await runCollectorCycle(input([
    envelope(),
    envelope({
      sourceId: 'nars:mirror:story-9',
      sourceVersion: 'v2',
      publisher: 'Wire Mirror',
      retrievalUri: 'https://mirror.test/story-9',
      observedAt: '2026-09-21T03:10:00.000Z',
    }),
  ]), ingestor, NOW);

  assert.equal(result.status, 'COMPLETE');
  const first = result.outcomes[0];
  const second = result.outcomes[1];
  assert.equal(first?.status, 'APPENDED');
  assert.equal(second?.status, 'APPENDED');

  if (first?.status !== 'APPENDED' || second?.status !== 'APPENDED') {
    throw new Error('EXPECTED_APPENDED_OUTCOMES');
  }
  assert.equal(second.duplicateOfEvidenceId, first.evidenceId);
});

test('collector identity mismatch rejects only that item', async () => {
  const ingestor = new SourceEvidenceIngestor(new InMemoryEvidenceStore());
  const result = await runCollectorCycle(input([
    envelope({ collectorVersion: 'wrong-version' }),
    envelope({
      sourceId: 'nars:ok:story-2',
      sourceVersion: 'v1',
      canonicalContent: 'Second record remains ingestible.',
    }),
  ]), ingestor, NOW);

  assert.equal(result.status, 'PARTIAL');
  assert.equal(result.outcomes[0]?.status, 'REJECTED');
  assert.match(result.outcomes[0]?.status === 'REJECTED' ? result.outcomes[0].errorCode : '', /COLLECTOR_IDENTITY_MISMATCH/);
  assert.equal(result.outcomes[1]?.status, 'APPENDED');
});

test('unsupported envelope schema fails closed as auditable item outcome', async () => {
  const ingestor = new SourceEvidenceIngestor(new InMemoryEvidenceStore());
  const invalid = {
    ...envelope(),
    schemaVersion: 'bor.collector-envelope.v0',
  } as unknown as CollectorEnvelope;

  const result = await runCollectorCycle(input([invalid]), ingestor, NOW);

  assert.equal(result.status, 'FAILED');
  assert.equal(result.summary.rejected, 1);
  assert.equal(result.outcomes[0]?.status, 'REJECTED');
  assert.match(result.outcomes[0]?.status === 'REJECTED' ? result.outcomes[0].errorCode : '', /UNSUPPORTED_COLLECTOR_ENVELOPE_SCHEMA/);
});

test('empty collector cycle is explicit and has no authority', async () => {
  const ingestor = new SourceEvidenceIngestor(new InMemoryEvidenceStore());
  const result = await runCollectorCycle(input([]), ingestor, NOW);

  assert.equal(result.status, 'EMPTY');
  assert.equal(result.summary.attempted, 0);
  assert.equal(result.executionAuthority, false);
  assert.equal(result.reportPublicationAuthority, false);
});
