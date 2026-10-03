// NARS intel outbox -> BOR Evidence (North Star M2).
//
// NARS publishes EvidencePacket v1.1 rows to nars_intel_outbox. Each packet
// describes one NARS event and the evidence artifacts linked to it. This
// module validates a packet and turns every content-verified artifact into a
// BOR EvidencePacket. It never marks outbox rows as sent: delivery state
// belongs to the consumer that owns it.

import { createEvidencePacket, type EvidencePacket } from '../evidence/evidence.js';

export const NARS_PACKET_SCHEMA_VERSIONS: readonly string[] = ['1.0', '1.1'];

export interface NarsEvidenceArtifact {
  artifact_id: string;
  artifact_key: string;
  title: string;
  role: string;
  relation: string;
  verification: string;
  authority_key?: string | null;
  publisher_key?: string | null;
  canonical_url?: string | null;
  published_at?: string | null;
  link_method?: string | null;
}

export interface NarsEntity {
  name: string;
  type: string;
  source?: string;
}

export interface NarsEvidencePacketPayload {
  producer: 'NARS';
  packet_type: 'EvidencePacket';
  schema_version: string;
  authority: string;
  execution_authority: boolean;
  event_id: string;
  event_key: string;
  event_title: string;
  first_detected_at: string;
  updated_at: string;
  evidence_grade?: string;
  priority_band?: string;
  entities?: readonly NarsEntity[];
  evidence?: readonly NarsEvidenceArtifact[];
}

/** One nars_intel_outbox row. */
export interface NarsOutboxRow {
  id: string;
  created_at: string;
  payload: unknown;
}

export type NarsArtifactOutcome =
  | { status: 'MAPPED'; artifactId: string; evidence: EvidencePacket }
  | { status: 'SKIPPED'; artifactId: string; reason: string };

export interface NarsPacketMapping {
  outboxId: string;
  eventId: string;
  eventKey: string;
  outcomes: NarsArtifactOutcome[];
}

const RETRIEVED_BY = 'nars-intel-outbox';

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Throws when the payload is not a NARS EvidencePacket this module understands. */
export function assertNarsEvidencePacket(payload: unknown): asserts payload is NarsEvidencePacketPayload {
  if (!isObject(payload)) throw new Error('NARS_PACKET_NOT_OBJECT');
  if (payload.producer !== 'NARS' || payload.packet_type !== 'EvidencePacket') throw new Error('NARS_PACKET_UNEXPECTED_TYPE');
  if (!NARS_PACKET_SCHEMA_VERSIONS.includes(String(payload.schema_version))) throw new Error('NARS_PACKET_UNSUPPORTED_SCHEMA');
  // Evidence never carries execution authority into BLACK ORACLE.
  if (payload.execution_authority !== false || payload.authority !== 'evidence_only') throw new Error('NARS_PACKET_AUTHORITY_VIOLATION');
  for (const field of ['event_id', 'event_key', 'event_title', 'first_detected_at', 'updated_at'] as const) {
    if (typeof payload[field] !== 'string' || !String(payload[field]).trim()) throw new Error(`NARS_PACKET_MISSING_${field.toUpperCase()}`);
  }
  if (payload.evidence !== undefined && !Array.isArray(payload.evidence)) throw new Error('NARS_PACKET_EVIDENCE_NOT_ARRAY');
}

function issuerQuery(packet: NarsEvidencePacketPayload): string {
  const entities: unknown[] = Array.isArray(packet.entities) ? packet.entities : [];
  for (const entity of entities) {
    if (isObject(entity) && entity.type === 'ISSUER' && typeof entity.name === 'string' && entity.name.trim()) return entity.name.trim();
  }
  return packet.event_title;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function mapArtifact(packet: NarsEvidencePacketPayload, raw: unknown, deliveredAt: string, now: Date): NarsArtifactOutcome {
  if (!isObject(raw)) return { status: 'SKIPPED', artifactId: '', reason: 'MALFORMED_ARTIFACT' };
  const artifact = raw as Partial<Record<keyof NarsEvidenceArtifact, unknown>>;
  const artifactId = text(artifact.artifact_id);
  if (!artifactId) return { status: 'SKIPPED', artifactId, reason: 'MISSING_ARTIFACT_ID' };
  if (artifact.verification !== 'content_verified') return { status: 'SKIPPED', artifactId, reason: 'NOT_CONTENT_VERIFIED' };
  const artifactKey = text(artifact.artifact_key);
  if (!artifactKey) return { status: 'SKIPPED', artifactId, reason: 'MISSING_ARTIFACT_KEY' };
  const canonicalUrl = text(artifact.canonical_url);
  if (!canonicalUrl) return { status: 'SKIPPED', artifactId, reason: 'MISSING_CANONICAL_URL' };
  const publishedAt = text(artifact.published_at);
  if (!publishedAt) return { status: 'SKIPPED', artifactId, reason: 'MISSING_PUBLISHED_AT' };
  const publisher = text(artifact.publisher_key) || text(artifact.authority_key);
  if (!publisher) return { status: 'SKIPPED', artifactId, reason: 'MISSING_PUBLISHER' };
  const title = text(artifact.title);

  try {
    const evidence = createEvidencePacket({
      evidenceId: `nars:${artifactId}`,
      source: {
        sourceId: `nars:${publisher}`,
        sourceVersion: `nars-packet-${packet.schema_version}`,
        publisher,
      },
      // No canonical asset mapping yet (North Star M2): keep the issuer
      // explicit instead of guessing a ticker.
      asset: { status: 'UNRESOLVED', query: issuerQuery(packet), reason: 'NARS_ASSET_MAPPING_PENDING' },
      provenance: {
        retrievalUri: canonicalUrl,
        snapshotRef: artifactKey,
        retrievedBy: RETRIEVED_BY,
      },
      publishedAt,
      // BLACK ORACLE can only claim to have known the artifact once NARS
      // delivered it. Artifacts are often attached to an event well after
      // the event was first detected, so first_detected_at would be too early.
      observedAt: deliveredAt,
      // artifact_key already pins the NARS content hash; fingerprinting it
      // gives a stable revision identity for this artifact version.
      canonicalContent: `${artifactKey}\n${title}`,
    }, now);
    return { status: 'MAPPED', artifactId, evidence };
  } catch (error) {
    return { status: 'SKIPPED', artifactId, reason: error instanceof Error ? error.message : 'MAPPING_FAILED' };
  }
}

export function mapNarsOutboxRow(row: NarsOutboxRow, now = new Date()): NarsPacketMapping {
  if (!Number.isFinite(Date.parse(row.created_at))) throw new Error('NARS_OUTBOX_INVALID_CREATED_AT');
  const payload = row.payload;
  assertNarsEvidencePacket(payload);
  return {
    outboxId: row.id,
    eventId: payload.event_id,
    eventKey: payload.event_key,
    outcomes: ((payload.evidence ?? []) as readonly unknown[]).map((artifact) => mapArtifact(payload, artifact, row.created_at, now)),
  };
}
