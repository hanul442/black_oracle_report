import {
  EVIDENCE_PRODUCER,
  EVIDENCE_SCHEMA_VERSION,
  type EvidencePacket,
} from './evidence.js';

export type EvidenceAppendResult =
  | { status: 'APPENDED'; evidenceId: string }
  | { status: 'ALREADY_PRESENT'; evidenceId: string };

export interface EvidenceStore {
  append(packet: EvidencePacket): Promise<EvidenceAppendResult>;
  getById(evidenceId: string): Promise<EvidencePacket | null>;
  findByFingerprint(contentFingerprint: string): Promise<readonly EvidencePacket[]>;
}

function canonicalPacketIdentity(packet: EvidencePacket): string {
  return JSON.stringify(packet);
}

function clonePacket(packet: EvidencePacket): EvidencePacket {
  return structuredClone(packet);
}

function assertBORPacket(packet: EvidencePacket): void {
  if (packet.schemaVersion !== EVIDENCE_SCHEMA_VERSION) {
    throw new Error('UNSUPPORTED_EVIDENCE_SCHEMA');
  }
  if (packet.producer !== EVIDENCE_PRODUCER) {
    throw new Error('UNSUPPORTED_EVIDENCE_PRODUCER');
  }
  if (packet.executionAuthority !== false) {
    throw new Error('EVIDENCE_EXECUTION_AUTHORITY_FORBIDDEN');
  }
}

/**
 * Deterministic reference implementation for the EvidenceStore contract.
 * It intentionally exposes no update/delete operation. A concrete database
 * adapter must preserve these append-only semantics.
 */
export class InMemoryEvidenceStore implements EvidenceStore {
  private readonly byId = new Map<string, EvidencePacket>();
  private readonly idsByFingerprint = new Map<string, string[]>();

  async append(packet: EvidencePacket): Promise<EvidenceAppendResult> {
    assertBORPacket(packet);
    const incoming = clonePacket(packet);
    const existing = this.byId.get(incoming.evidenceId);

    if (existing) {
      if (canonicalPacketIdentity(existing) !== canonicalPacketIdentity(incoming)) {
        throw new Error('EVIDENCE_ID_CONFLICT');
      }
      return { status: 'ALREADY_PRESENT', evidenceId: incoming.evidenceId };
    }

    this.byId.set(incoming.evidenceId, incoming);
    const fingerprintIds = this.idsByFingerprint.get(incoming.contentFingerprint) ?? [];
    fingerprintIds.push(incoming.evidenceId);
    this.idsByFingerprint.set(incoming.contentFingerprint, fingerprintIds);
    return { status: 'APPENDED', evidenceId: incoming.evidenceId };
  }

  async getById(evidenceId: string): Promise<EvidencePacket | null> {
    const packet = this.byId.get(evidenceId);
    return packet ? clonePacket(packet) : null;
  }

  async findByFingerprint(contentFingerprint: string): Promise<readonly EvidencePacket[]> {
    const ids = this.idsByFingerprint.get(contentFingerprint) ?? [];
    return ids
      .map((id) => this.byId.get(id))
      .filter((packet): packet is EvidencePacket => packet !== undefined)
      .map(clonePacket);
  }
}
