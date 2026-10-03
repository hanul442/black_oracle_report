import assert from 'node:assert/strict';
import test from 'node:test';
import { mapNarsOutboxRow, type NarsEvidencePacketPayload } from './narsEvidencePacket.js';

const DELIVERED_AT = '2026-09-29T06:21:00.000Z';
function mapNarsEvidencePacket(payload: unknown, now: Date) {
  return mapNarsOutboxRow({ id: 'outbox-1', created_at: DELIVERED_AT, payload }, now);
}

const NOW = new Date('2026-10-03T02:00:00Z');

// Shape copied from a live nars_intel_outbox row (2026-09-29).
function packet(overrides: Partial<NarsEvidencePacketPayload> = {}): NarsEvidencePacketPayload {
  return {
    producer: 'NARS',
    packet_type: 'EvidencePacket',
    schema_version: '1.1',
    authority: 'evidence_only',
    execution_authority: false,
    event_id: '6a99cb93-3975-48f0-9c64-e1d8933b6efd',
    event_key: 'evt:bda3e4d8-babe-4f6b-adde-3dbee47e3d39',
    event_title: '(코스닥)코위버 - [첨부추가]반기보고서 (2026.06)',
    first_detected_at: '2026-09-29T06:20:15.052+00:00',
    updated_at: '2026-09-29T06:20:15.052+00:00',
    evidence_grade: 'BBB0',
    priority_band: 'ROUTINE',
    entities: [{ name: '코위버', type: 'ISSUER', source: 'verified_primary' }],
    evidence: [{
      artifact_id: '4ccc372d-e328-4301-9283-a7a09c0d87c6',
      artifact_key: 'document:0b8e1e72-9d8e-47e0-b2c6-b4b4875e6b46:sha256:5b01ecf879d4015154b7c40fb980022c43247529ce58b8a946b0db74a4b4aaa4',
      title: '(코스닥)코위버 - [첨부추가]반기보고서 (2026.06)',
      role: 'primary_regulatory',
      relation: 'supports',
      verification: 'content_verified',
      authority_key: 'kr:fss-dart',
      publisher_key: 'dart',
      canonical_url: 'https://dart.fss.or.kr/report/viewer.do?rcpNo=20260813001520',
      published_at: '2026-09-29T06:13:00+00:00',
      link_method: 'canonical_content_acquisition',
    }],
    ...overrides,
  };
}

test('maps a content-verified NARS artifact to a BOR evidence packet', () => {
  const mapping = mapNarsEvidencePacket(packet(), NOW);
  assert.equal(mapping.eventKey, 'evt:bda3e4d8-babe-4f6b-adde-3dbee47e3d39');
  const [outcome] = mapping.outcomes;
  assert.equal(outcome?.status, 'MAPPED');
  if (outcome?.status !== 'MAPPED') return;
  const evidence = outcome.evidence;
  assert.equal(evidence.evidenceId, 'nars:4ccc372d-e328-4301-9283-a7a09c0d87c6');
  assert.equal(evidence.executionAuthority, false);
  assert.equal(evidence.source.publisher, 'dart');
  assert.equal(evidence.provenance.snapshotRef?.startsWith('document:'), true);
  assert.equal(evidence.publishedAt, '2026-09-29T06:13:00.000Z');
  assert.equal(evidence.observedAt, DELIVERED_AT);
  assert.deepEqual(evidence.asset, { status: 'UNRESOLVED', query: '코위버', reason: 'NARS_ASSET_MAPPING_PENDING' });
});

test('the same NARS artifact version always gets the same revision fingerprint', () => {
  const a = mapNarsEvidencePacket(packet(), NOW).outcomes[0];
  const b = mapNarsEvidencePacket(packet({ updated_at: '2026-09-30T00:00:00Z' }), NOW).outcomes[0];
  assert.ok(a?.status === 'MAPPED' && b?.status === 'MAPPED');
  assert.equal(a.evidence.contentFingerprint, b.evidence.contentFingerprint);
  const changed = mapNarsEvidencePacket(packet({
    evidence: [{ ...packet().evidence![0]!, artifact_key: 'document:x:sha256:different' }],
  }), NOW).outcomes[0];
  assert.ok(changed?.status === 'MAPPED');
  assert.notEqual(changed.evidence.contentFingerprint, a.evidence.contentFingerprint);
});

test('skips artifacts that are not content verified or lack provenance', () => {
  const base = packet().evidence![0]!;
  const { canonical_url: _url, ...withoutUrl } = base;
  const mapping = mapNarsEvidencePacket(packet({
    evidence: [
      { ...base, artifact_id: 'a', verification: 'url_only' },
      { ...withoutUrl, artifact_id: 'b' },
      { ...base, artifact_id: 'c', published_at: '2026-09-29T07:00:00Z' },
    ],
  }), NOW);
  assert.deepEqual(mapping.outcomes.map((o) => o.status === 'SKIPPED' ? o.reason : o.status), [
    'NOT_CONTENT_VERIFIED',
    'MISSING_CANONICAL_URL',
    'PUBLICATION_AFTER_OBSERVATION',
  ]);
});

test('rejects packets that claim execution authority or an unknown schema', () => {
  assert.throws(() => mapNarsEvidencePacket({ ...packet(), execution_authority: true }, NOW), /NARS_PACKET_AUTHORITY_VIOLATION/);
  assert.throws(() => mapNarsEvidencePacket({ ...packet(), schema_version: '2.0' }, NOW), /NARS_PACKET_UNSUPPORTED_SCHEMA/);
  assert.equal(mapNarsEvidencePacket({ ...packet(), schema_version: '1.0' }, NOW).outcomes[0]?.status, 'MAPPED');
  assert.throws(() => mapNarsOutboxRow({ id: 'x', created_at: 'bad', payload: packet() }, NOW), /NARS_OUTBOX_INVALID_CREATED_AT/);
  assert.throws(() => mapNarsEvidencePacket({ ...packet(), event_key: '' }, NOW), /NARS_PACKET_MISSING_EVENT_KEY/);
  assert.throws(() => mapNarsEvidencePacket('nope', NOW), /NARS_PACKET_NOT_OBJECT/);
});

test('falls back to the event title when no issuer entity exists', () => {
  const outcome = mapNarsEvidencePacket(packet({ entities: [] }), NOW).outcomes[0];
  assert.ok(outcome?.status === 'MAPPED');
  assert.equal(outcome.evidence.asset.status === 'UNRESOLVED' && outcome.evidence.asset.query, '(코스닥)코위버 - [첨부추가]반기보고서 (2026.06)');
});

test('an artifact published after the event was detected is still known once delivered', () => {
  // Most live artifacts (69%) are attached to an event after it was first detected.
  const late = { ...packet().evidence![0]!, published_at: '2026-09-29T06:30:00Z' };
  const outcome = mapNarsOutboxRow({ id: 'o', created_at: '2026-09-29T06:35:00Z', payload: packet({ evidence: [late] }) }, NOW).outcomes[0];
  assert.equal(outcome?.status, 'MAPPED');
});

test('one malformed artifact does not stop the rest of the packet', () => {
  const good = packet().evidence![0]!;
  const mapping = mapNarsEvidencePacket({
    ...packet(),
    entities: { not: 'an array' },
    evidence: [null, { ...good, artifact_key: 42 }, { ...good, artifact_id: '' }, good],
  }, NOW);
  assert.deepEqual(mapping.outcomes.map((o) => o.status === 'SKIPPED' ? o.reason : o.status), [
    'MALFORMED_ARTIFACT', 'MISSING_ARTIFACT_KEY', 'MISSING_ARTIFACT_ID', 'MAPPED',
  ]);
});
