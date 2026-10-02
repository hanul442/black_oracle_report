import { createHash } from 'node:crypto';

import type { AssetResolution } from './evidence.js';
import {
  SOURCE_RECORD_SCHEMA_VERSION,
  SourceEvidenceIngestor,
  type SourceRecord,
} from './sourceIngestion.js';

export const COLLECTOR_ENVELOPE_SCHEMA_VERSION = 'bor.collector-envelope.v1' as const;
export const COLLECTOR_CYCLE_SCHEMA_VERSION = 'bor.collector-cycle.v1' as const;

export type CollectorOrigin = 'NARS' | 'EXTERNAL';

export interface CollectorEnvelope {
  schemaVersion: typeof COLLECTOR_ENVELOPE_SCHEMA_VERSION;
  origin: CollectorOrigin;
  collectorId: string;
  collectorVersion: string;
  sourceId: string;
  sourceVersion: string;
  publisher: string;
  retrievalUri: string;
  snapshotRef?: string;
  publishedAt: string;
  observedAt: string;
  canonicalContent: string;
  asset: AssetResolution;
}

export interface CollectorCycleInput {
  collectorId: string;
  collectorVersion: string;
  envelopes: readonly CollectorEnvelope[];
}

export type CollectorItemOutcome =
  | {
      status: 'APPENDED' | 'ALREADY_PRESENT';
      itemId: string;
      sourceId: string;
      sourceVersion: string;
      evidenceId: string;
      duplicateOfEvidenceId?: string;
    }
  | {
      status: 'REJECTED';
      itemId: string;
      sourceId?: string;
      sourceVersion?: string;
      errorCode: string;
    };

export interface CollectorCycleResult {
  schemaVersion: typeof COLLECTOR_CYCLE_SCHEMA_VERSION;
  cycleId: string;
  collectorId: string;
  collectorVersion: string;
  executionAuthority: false;
  reportPublicationAuthority: false;
  status: 'COMPLETE' | 'PARTIAL' | 'FAILED' | 'EMPTY';
  startedAt: string;
  completedAt: string;
  summary: {
    attempted: number;
    appended: number;
    alreadyPresent: number;
    rejected: number;
  };
  outcomes: readonly CollectorItemOutcome[];
}

function requireNonEmpty(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`EMPTY_${field.toUpperCase()}`);
  }
  return value.trim();
}

function itemId(
  collectorId: string,
  collectorVersion: string,
  envelope: Partial<CollectorEnvelope>,
  index: number,
): string {
  const sourceId = typeof envelope.sourceId === 'string' ? envelope.sourceId : '';
  const sourceVersion = typeof envelope.sourceVersion === 'string' ? envelope.sourceVersion : '';
  const identity = [collectorId, collectorVersion, sourceId, sourceVersion, String(index)].join('\u001f');
  return `bor_ci_${createHash('sha256').update(identity, 'utf8').digest('hex')}`;
}

function cycleId(input: CollectorCycleInput): string {
  const ids = input.envelopes.map((envelope, index) =>
    itemId(input.collectorId, input.collectorVersion, envelope, index));
  const identity = [input.collectorId, input.collectorVersion, ...ids].join('\u001f');
  return `bor_cc_${createHash('sha256').update(identity, 'utf8').digest('hex')}`;
}

function errorCode(error: unknown): string {
  if (!(error instanceof Error)) return 'COLLECTOR_ITEM_REJECTED';
  const normalized = error.message.trim().toUpperCase().replace(/[^A-Z0-9_:-]+/g, '_');
  return normalized || 'COLLECTOR_ITEM_REJECTED';
}

export function adaptCollectorEnvelope(
  envelope: CollectorEnvelope,
  expectedCollectorId: string,
  expectedCollectorVersion: string,
): SourceRecord {
  if (envelope.schemaVersion !== COLLECTOR_ENVELOPE_SCHEMA_VERSION) {
    throw new Error('UNSUPPORTED_COLLECTOR_ENVELOPE_SCHEMA');
  }
  if (envelope.origin !== 'NARS' && envelope.origin !== 'EXTERNAL') {
    throw new Error('UNSUPPORTED_COLLECTOR_ORIGIN');
  }

  const collectorId = requireNonEmpty(envelope.collectorId, 'collector_id');
  const collectorVersion = requireNonEmpty(envelope.collectorVersion, 'collector_version');
  if (collectorId !== expectedCollectorId || collectorVersion !== expectedCollectorVersion) {
    throw new Error('COLLECTOR_IDENTITY_MISMATCH');
  }

  return {
    schemaVersion: SOURCE_RECORD_SCHEMA_VERSION,
    sourceId: envelope.sourceId,
    sourceVersion: envelope.sourceVersion,
    publisher: envelope.publisher,
    retrievalUri: envelope.retrievalUri,
    ...(envelope.snapshotRef ? { snapshotRef: envelope.snapshotRef } : {}),
    retrievedBy: `${collectorId}@${collectorVersion}`,
    publishedAt: envelope.publishedAt,
    observedAt: envelope.observedAt,
    canonicalContent: envelope.canonicalContent,
    asset: envelope.asset,
  };
}

export async function runCollectorCycle(
  input: CollectorCycleInput,
  ingestor: SourceEvidenceIngestor,
  now = new Date(),
): Promise<CollectorCycleResult> {
  const collectorId = requireNonEmpty(input.collectorId, 'collector_id');
  const collectorVersion = requireNonEmpty(input.collectorVersion, 'collector_version');
  const startedAt = now.toISOString();
  const outcomes: CollectorItemOutcome[] = [];

  for (const [index, envelope] of input.envelopes.entries()) {
    const currentItemId = itemId(collectorId, collectorVersion, envelope, index);

    try {
      const sourceRecord = adaptCollectorEnvelope(envelope, collectorId, collectorVersion);
      const result = await ingestor.ingest(sourceRecord, now);
      outcomes.push(Object.freeze({
        status: result.persistence.status,
        itemId: currentItemId,
        sourceId: sourceRecord.sourceId,
        sourceVersion: sourceRecord.sourceVersion,
        evidenceId: result.evidence.evidenceId,
        ...(result.evidence.duplicateOfEvidenceId
          ? { duplicateOfEvidenceId: result.evidence.duplicateOfEvidenceId }
          : {}),
      }));
    } catch (error) {
      const sourceId = typeof envelope?.sourceId === 'string' && envelope.sourceId.trim()
        ? envelope.sourceId.trim()
        : undefined;
      const sourceVersion = typeof envelope?.sourceVersion === 'string' && envelope.sourceVersion.trim()
        ? envelope.sourceVersion.trim()
        : undefined;

      outcomes.push(Object.freeze({
        status: 'REJECTED',
        itemId: currentItemId,
        ...(sourceId ? { sourceId } : {}),
        ...(sourceVersion ? { sourceVersion } : {}),
        errorCode: errorCode(error),
      }));
    }
  }

  const appended = outcomes.filter((outcome) => outcome.status === 'APPENDED').length;
  const alreadyPresent = outcomes.filter((outcome) => outcome.status === 'ALREADY_PRESENT').length;
  const rejected = outcomes.filter((outcome) => outcome.status === 'REJECTED').length;
  const attempted = outcomes.length;
  const accepted = appended + alreadyPresent;

  const status: CollectorCycleResult['status'] =
    attempted === 0 ? 'EMPTY'
      : rejected === 0 ? 'COMPLETE'
        : accepted === 0 ? 'FAILED'
          : 'PARTIAL';

  return Object.freeze({
    schemaVersion: COLLECTOR_CYCLE_SCHEMA_VERSION,
    cycleId: cycleId({ collectorId, collectorVersion, envelopes: input.envelopes }),
    collectorId,
    collectorVersion,
    executionAuthority: false,
    reportPublicationAuthority: false,
    status,
    startedAt,
    completedAt: now.toISOString(),
    summary: Object.freeze({ attempted, appended, alreadyPresent, rejected }),
    outcomes: Object.freeze([...outcomes]),
  });
}
