import type { EvidencePacket } from './evidence.js';
import type { EvidenceAppendResult, EvidenceStore } from './evidenceStore.js';

export interface SqlQueryResult<Row> {
  rows: readonly Row[];
  rowCount: number;
}

export interface SqlEvidenceDriver {
  query<Row = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<SqlQueryResult<Row>>;
}

type EvidenceRow = {
  evidence_id: string;
  schema_version: EvidencePacket['schemaVersion'];
  producer: EvidencePacket['producer'];
  execution_authority: false;
  source_id: string;
  source_version: string;
  publisher: string;
  asset_status: 'RESOLVED' | 'UNRESOLVED';
  canonical_asset_id: string | null;
  asset_symbol: string | null;
  asset_query: string | null;
  asset_unresolved_reason: string | null;
  retrieval_uri: string;
  snapshot_ref: string | null;
  retrieved_by: string;
  published_at: string | Date;
  observed_at: string | Date;
  content_fingerprint: string;
  duplicate_of_evidence_id: string | null;
};

const SELECT_COLUMNS = `
  evidence_id, schema_version, producer, execution_authority,
  source_id, source_version, publisher,
  asset_status, canonical_asset_id, asset_symbol, asset_query, asset_unresolved_reason,
  retrieval_uri, snapshot_ref, retrieved_by,
  published_at, observed_at, content_fingerprint, duplicate_of_evidence_id
`;

function iso(value: string | Date): string {
  return new Date(value).toISOString();
}

function rowToPacket(row: EvidenceRow): EvidencePacket {
  const asset = row.asset_status === 'RESOLVED'
    ? { status: 'RESOLVED' as const, canonicalAssetId: row.canonical_asset_id!, ...(row.asset_symbol ? { symbol: row.asset_symbol } : {}) }
    : { status: 'UNRESOLVED' as const, query: row.asset_query!, reason: row.asset_unresolved_reason! };

  return {
    schemaVersion: row.schema_version,
    producer: row.producer,
    executionAuthority: false,
    evidenceId: row.evidence_id,
    source: { sourceId: row.source_id, sourceVersion: row.source_version, publisher: row.publisher },
    asset,
    provenance: {
      retrievalUri: row.retrieval_uri,
      retrievedBy: row.retrieved_by,
      ...(row.snapshot_ref ? { snapshotRef: row.snapshot_ref } : {}),
    },
    publishedAt: iso(row.published_at),
    observedAt: iso(row.observed_at),
    contentFingerprint: row.content_fingerprint,
    ...(row.duplicate_of_evidence_id ? { duplicateOfEvidenceId: row.duplicate_of_evidence_id } : {}),
  };
}

function identity(packet: EvidencePacket): string {
  return JSON.stringify(packet);
}

export class SqlEvidenceStore implements EvidenceStore {
  constructor(private readonly driver: SqlEvidenceDriver) {}

  async append(packet: EvidencePacket): Promise<EvidenceAppendResult> {
    // The database schema independently enforces producer/schema/no-authority/time constraints.
    const asset = packet.asset;
    const result = await this.driver.query<EvidenceRow>(`
      INSERT INTO bor_evidence (
        evidence_id, schema_version, producer, execution_authority,
        source_id, source_version, publisher,
        asset_status, canonical_asset_id, asset_symbol, asset_query, asset_unresolved_reason,
        retrieval_uri, snapshot_ref, retrieved_by,
        published_at, observed_at, content_fingerprint, duplicate_of_evidence_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      )
      ON CONFLICT (evidence_id) DO NOTHING
      RETURNING ${SELECT_COLUMNS}
    `, [
      packet.evidenceId, packet.schemaVersion, packet.producer, packet.executionAuthority,
      packet.source.sourceId, packet.source.sourceVersion, packet.source.publisher,
      asset.status,
      asset.status === 'RESOLVED' ? asset.canonicalAssetId : null,
      asset.status === 'RESOLVED' ? asset.symbol ?? null : null,
      asset.status === 'UNRESOLVED' ? asset.query : null,
      asset.status === 'UNRESOLVED' ? asset.reason : null,
      packet.provenance.retrievalUri, packet.provenance.snapshotRef ?? null, packet.provenance.retrievedBy,
      packet.publishedAt, packet.observedAt, packet.contentFingerprint, packet.duplicateOfEvidenceId ?? null,
    ]);

    if (result.rowCount === 1) return { status: 'APPENDED', evidenceId: packet.evidenceId };

    const existing = await this.getById(packet.evidenceId);
    if (!existing || identity(existing) !== identity(packet)) throw new Error('EVIDENCE_ID_CONFLICT');
    return { status: 'ALREADY_PRESENT', evidenceId: packet.evidenceId };
  }

  async getById(evidenceId: string): Promise<EvidencePacket | null> {
    const result = await this.driver.query<EvidenceRow>(
      `SELECT ${SELECT_COLUMNS} FROM bor_evidence WHERE evidence_id = $1`,
      [evidenceId],
    );
    return result.rows[0] ? rowToPacket(result.rows[0]) : null;
  }

  async findByFingerprint(contentFingerprint: string): Promise<readonly EvidencePacket[]> {
    const result = await this.driver.query<EvidenceRow>(
      `SELECT ${SELECT_COLUMNS} FROM bor_evidence WHERE content_fingerprint = $1 ORDER BY observed_at ASC, evidence_id ASC`,
      [contentFingerprint],
    );
    return result.rows.map(rowToPacket);
  }
}
