import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createEvidencePacket } from './evidence.js';
import { SqlEvidenceStore, type SqlEvidenceDriver, type SqlQueryResult } from './sqlEvidenceStore.js';

const now = new Date('2026-09-21T02:00:00.000Z');

function packet(id = 'ev-1') {
  return createEvidencePacket({
    evidenceId: id,
    source: { sourceId: 'source-1', sourceVersion: 'v1', publisher: 'Publisher' },
    asset: { status: 'RESOLVED', canonicalAssetId: 'KRW-BTC', symbol: 'BTC' },
    provenance: { retrievalUri: 'https://example.test/a', snapshotRef: 'sha256:snapshot', retrievedBy: 'collector-v1' },
    publishedAt: '2026-09-21T01:00:00.000Z',
    observedAt: '2026-09-21T01:05:00.000Z',
    canonicalContent: 'canonical evidence',
  }, now);
}

function rowOf(p: ReturnType<typeof packet>) {
  if (p.asset.status !== 'RESOLVED') throw new Error('test fixture');
  return {
    evidence_id: p.evidenceId, schema_version: p.schemaVersion, producer: p.producer,
    execution_authority: false as const,
    source_id: p.source.sourceId, source_version: p.source.sourceVersion, publisher: p.source.publisher,
    asset_status: 'RESOLVED' as const, canonical_asset_id: p.asset.canonicalAssetId,
    asset_symbol: p.asset.symbol ?? null, asset_query: null, asset_unresolved_reason: null,
    retrieval_uri: p.provenance.retrievalUri, snapshot_ref: p.provenance.snapshotRef ?? null,
    retrieved_by: p.provenance.retrievedBy, published_at: p.publishedAt, observed_at: p.observedAt,
    content_fingerprint: p.contentFingerprint, duplicate_of_evidence_id: null,
  };
}

class ScriptedDriver implements SqlEvidenceDriver {
  readonly calls: Array<{ sql: string; params: readonly unknown[] }> = [];
  constructor(private readonly results: Array<SqlQueryResult<any>>) {}
  async query<Row>(sql: string, params: readonly unknown[] = []): Promise<SqlQueryResult<Row>> {
    this.calls.push({ sql, params });
    const next = this.results.shift();
    if (!next) throw new Error('UNEXPECTED_QUERY');
    return next as SqlQueryResult<Row>;
  }
}

test('append uses parameterized INSERT and reports APPENDED', async () => {
  const p = packet();
  const driver = new ScriptedDriver([{ rows: [rowOf(p)], rowCount: 1 }]);
  const store = new SqlEvidenceStore(driver);
  assert.deepEqual(await store.append(p), { status: 'APPENDED', evidenceId: 'ev-1' });
  assert.match(driver.calls[0]!.sql, /ON CONFLICT \(evidence_id\) DO NOTHING/);
  assert.equal(driver.calls[0]!.params[0], 'ev-1');
  assert.equal(driver.calls[0]!.params[3], false);
});

test('conflicting existing evidence id fails closed', async () => {
  const p = packet();
  const conflicting = { ...rowOf(p), publisher: 'Different Publisher' };
  const driver = new ScriptedDriver([
    { rows: [], rowCount: 0 },
    { rows: [conflicting], rowCount: 1 },
  ]);
  const store = new SqlEvidenceStore(driver);
  await assert.rejects(() => store.append(p), /EVIDENCE_ID_CONFLICT/);
});

test('fingerprint lookup is explicitly deterministic', async () => {
  const p = packet();
  const driver = new ScriptedDriver([{ rows: [rowOf(p)], rowCount: 1 }]);
  const store = new SqlEvidenceStore(driver);
  const found = await store.findByFingerprint(p.contentFingerprint);
  assert.equal(found[0]?.evidenceId, p.evidenceId);
  assert.match(driver.calls[0]!.sql, /ORDER BY observed_at ASC, evidence_id ASC/);
});

test('migration encodes BOR authority, point-in-time and append-first invariants', async () => {
  const sql = await readFile(new URL('../db/migrations/0001_evidence_store.sql', import.meta.url), 'utf8');
  assert.match(sql, /schema_version = 'bor\.evidence\.v1'/);
  assert.match(sql, /producer = 'BLACK_ORACLE_REPORT'/);
  assert.match(sql, /execution_authority = FALSE/);
  assert.match(sql, /published_at <= observed_at/);
  assert.match(sql, /duplicate_of_evidence_id <> evidence_id/);
  assert.doesNotMatch(sql, /DROP TABLE/i);
});
