import { createHash } from 'node:crypto';

import {
  createEvidencePacket,
  type AssetResolution,
  type EvidencePacket,
} from './evidence.js';
import type { EvidenceAppendResult, EvidenceStore } from './evidenceStore.js';

export const SOURCE_RECORD_SCHEMA_VERSION = 'bor.source-record.v1' as const;

export interface SourceRecord {
  schemaVersion: typeof SOURCE_RECORD_SCHEMA_VERSION;
  sourceId: string;
  sourceVersion: string;
  publisher: string;
  retrievalUri: string;
  snapshotRef?: string;
  retrievedBy: string;
  publishedAt: string;
  observedAt: string;
  canonicalContent: string;
  asset: AssetResolution;
}

export interface SourceIngestionResult {
  evidence: EvidencePacket;
  persistence: EvidenceAppendResult;
}

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`EMPTY_${field.toUpperCase()}`);
  return normalized;
}

function canonicalEvidenceId(record: SourceRecord): string {
  const identity = [
    requireNonEmpty(record.sourceId, 'source_id'),
    requireNonEmpty(record.sourceVersion, 'source_version'),
    record.canonicalContent,
  ].join('\u001f');
  return `bor_ev_${createHash('sha256').update(identity, 'utf8').digest('hex')}`;
}

function validateRecord(record: SourceRecord): void {
  if (record.schemaVersion !== SOURCE_RECORD_SCHEMA_VERSION) {
    throw new Error('UNSUPPORTED_SOURCE_RECORD_SCHEMA');
  }
  requireNonEmpty(record.publisher, 'publisher');
  requireNonEmpty(record.retrievalUri, 'retrieval_uri');
  requireNonEmpty(record.retrievedBy, 'retrieved_by');
  requireNonEmpty(record.canonicalContent, 'canonical_content');

  if (record.asset.status === 'RESOLVED') {
    requireNonEmpty(record.asset.canonicalAssetId, 'canonical_asset_id');
  } else {
    requireNonEmpty(record.asset.query, 'asset_query');
    requireNonEmpty(record.asset.reason, 'asset_unresolved_reason');
  }
}

export class SourceEvidenceIngestor {
  constructor(private readonly evidenceStore: EvidenceStore) {}

  async ingest(record: SourceRecord, now = new Date()): Promise<SourceIngestionResult> {
    validateRecord(record);

    const candidate = createEvidencePacket({
      evidenceId: canonicalEvidenceId(record),
      source: {
        sourceId: record.sourceId,
        sourceVersion: record.sourceVersion,
        publisher: record.publisher,
      },
      asset: record.asset,
      provenance: {
        retrievalUri: record.retrievalUri,
        ...(record.snapshotRef ? { snapshotRef: record.snapshotRef } : {}),
        retrievedBy: record.retrievedBy,
      },
      publishedAt: record.publishedAt,
      observedAt: record.observedAt,
      canonicalContent: record.canonicalContent,
    }, now);

    const matches = await this.evidenceStore.findByFingerprint(candidate.contentFingerprint);
    const duplicateOfEvidenceId = matches
      .filter((packet) => packet.evidenceId !== candidate.evidenceId)
      .sort((a, b) => a.observedAt.localeCompare(b.observedAt) || a.evidenceId.localeCompare(b.evidenceId))[0]
      ?.evidenceId;

    const evidence = duplicateOfEvidenceId
      ? createEvidencePacket({
          evidenceId: candidate.evidenceId,
          source: candidate.source,
          asset: candidate.asset,
          provenance: candidate.provenance,
          publishedAt: candidate.publishedAt,
          observedAt: candidate.observedAt,
          canonicalContent: record.canonicalContent,
          duplicateOfEvidenceId,
        }, now)
      : candidate;

    const persistence = await this.evidenceStore.append(evidence);
    return { evidence, persistence };
  }
}
