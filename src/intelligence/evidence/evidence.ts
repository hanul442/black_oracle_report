import { createHash } from 'node:crypto';

export const EVIDENCE_SCHEMA_VERSION = 'bor.evidence.v1' as const;
export const EVIDENCE_PRODUCER = 'BLACK_ORACLE_REPORT' as const;

export type AssetResolution =
  | { status: 'RESOLVED'; canonicalAssetId: string; symbol?: string }
  | { status: 'UNRESOLVED'; query: string; reason: string };

export interface SourceIdentity {
  sourceId: string;
  sourceVersion: string;
  publisher: string;
}

export interface EvidenceProvenance {
  retrievalUri: string;
  snapshotRef?: string;
  retrievedBy: string;
}

export interface CreateEvidenceInput {
  evidenceId: string;
  source: SourceIdentity;
  asset: AssetResolution;
  provenance: EvidenceProvenance;
  publishedAt: string;
  observedAt: string;
  canonicalContent: string;
  duplicateOfEvidenceId?: string;
}

export interface EvidencePacket {
  schemaVersion: typeof EVIDENCE_SCHEMA_VERSION;
  producer: typeof EVIDENCE_PRODUCER;
  executionAuthority: false;
  evidenceId: string;
  source: SourceIdentity;
  asset: AssetResolution;
  provenance: EvidenceProvenance;
  publishedAt: string;
  observedAt: string;
  contentFingerprint: string;
  duplicateOfEvidenceId?: string;
}

export type EvidenceStaleness =
  | { status: 'FRESH'; ageMs: number }
  | { status: 'STALE'; ageMs: number }
  | { status: 'INVALID'; reason: 'INVALID_NOW' | 'INVALID_OBSERVED_AT' | 'FUTURE_OBSERVATION' };

function parseIso(value: string, field: string): number {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`INVALID_${field.toUpperCase()}`);
  return timestamp;
}

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`EMPTY_${field.toUpperCase()}`);
  return normalized;
}

export function fingerprintCanonicalContent(canonicalContent: string): string {
  const content = requireNonEmpty(canonicalContent, 'canonical_content');
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function createEvidencePacket(input: CreateEvidenceInput, now = new Date()): EvidencePacket {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) throw new Error('INVALID_NOW');

  const publishedMs = parseIso(input.publishedAt, 'published_at');
  const observedMs = parseIso(input.observedAt, 'observed_at');
  if (publishedMs > observedMs) throw new Error('PUBLICATION_AFTER_OBSERVATION');
  if (observedMs > nowMs) throw new Error('FUTURE_OBSERVATION');

  requireNonEmpty(input.evidenceId, 'evidence_id');
  requireNonEmpty(input.source.sourceId, 'source_id');
  requireNonEmpty(input.source.sourceVersion, 'source_version');
  requireNonEmpty(input.source.publisher, 'publisher');
  requireNonEmpty(input.provenance.retrievalUri, 'retrieval_uri');
  requireNonEmpty(input.provenance.retrievedBy, 'retrieved_by');

  if (input.asset.status === 'RESOLVED') {
    requireNonEmpty(input.asset.canonicalAssetId, 'canonical_asset_id');
  } else {
    requireNonEmpty(input.asset.query, 'asset_query');
    requireNonEmpty(input.asset.reason, 'asset_unresolved_reason');
  }

  if (input.duplicateOfEvidenceId === input.evidenceId) throw new Error('SELF_DUPLICATE');

  return Object.freeze({
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    producer: EVIDENCE_PRODUCER,
    executionAuthority: false,
    evidenceId: input.evidenceId,
    source: Object.freeze({ ...input.source }),
    asset: Object.freeze({ ...input.asset }),
    provenance: Object.freeze({ ...input.provenance }),
    publishedAt: new Date(publishedMs).toISOString(),
    observedAt: new Date(observedMs).toISOString(),
    contentFingerprint: fingerprintCanonicalContent(input.canonicalContent),
    ...(input.duplicateOfEvidenceId ? { duplicateOfEvidenceId: input.duplicateOfEvidenceId } : {}),
  });
}

export function sameContentIdentity(a: EvidencePacket, b: EvidencePacket): boolean {
  return a.contentFingerprint === b.contentFingerprint;
}

export function evaluateEvidenceStaleness(
  evidence: Pick<EvidencePacket, 'observedAt'>,
  now = new Date(),
  maxAgeMs = 24 * 60 * 60 * 1000,
): EvidenceStaleness {
  if (!Number.isFinite(maxAgeMs) || maxAgeMs < 0) throw new Error('INVALID_MAX_AGE');
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) return { status: 'INVALID', reason: 'INVALID_NOW' };
  const observedMs = Date.parse(evidence.observedAt);
  if (!Number.isFinite(observedMs)) return { status: 'INVALID', reason: 'INVALID_OBSERVED_AT' };
  const ageMs = nowMs - observedMs;
  if (ageMs < 0) return { status: 'INVALID', reason: 'FUTURE_OBSERVATION' };
  return ageMs <= maxAgeMs ? { status: 'FRESH', ageMs } : { status: 'STALE', ageMs };
}
