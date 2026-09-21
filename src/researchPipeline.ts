import {
  fingerprintCanonicalContent,
  type EvidencePacket,
} from './evidence.js';

export const RESEARCH_BUNDLE_SCHEMA_VERSION = 'bor.research-bundle.v1' as const;
export const ANALYST_REVIEW_SCHEMA_VERSION = 'bor.analyst-review.v1' as const;

export type EvidenceDisposition =
  | 'SUPPORTING'
  | 'CONTRADICTING'
  | 'CONTEXT'
  | 'UNRESOLVED';

export interface EvidenceMaterial {
  evidenceId: string;
  canonicalContent: string;
  contentFingerprint: string;
}

export interface OrganizedEvidenceInput {
  evidence: EvidencePacket;
  disposition: EvidenceDisposition;
  material?: EvidenceMaterial;
  note?: string;
}

export interface OrganizedEvidenceItem {
  evidenceId: string;
  disposition: EvidenceDisposition;
  contentFingerprint: string;
  sourceId: string;
  sourceVersion: string;
  publisher: string;
  observedAt: string;
  publishedAt: string;
  retrievalUri: string;
  snapshotRef?: string;
  asset: EvidencePacket['asset'];
  materialVerified: boolean;
  note?: string;
}

export interface ResearchBundle {
  schemaVersion: typeof RESEARCH_BUNDLE_SCHEMA_VERSION;
  bundleId: string;
  subjectId: string;
  asOf: string;
  knowledgeCutoff: string;
  evidence: readonly Readonly<OrganizedEvidenceItem>[];
  dataGaps: readonly string[];
  executionAuthority: false;
  reportPublicationAuthority: false;
}

export interface CreateResearchBundleInput {
  bundleId: string;
  subjectId: string;
  asOf: string;
  knowledgeCutoff: string;
  items: readonly OrganizedEvidenceInput[];
  dataGaps?: readonly string[];
  executionAuthority?: boolean;
  reportPublicationAuthority?: boolean;
}

export const ANALYST_REVIEW_STANCES = [
  'STRONGLY_POSITIVE',
  'POSITIVE',
  'NEUTRAL',
  'NEGATIVE',
  'STRONGLY_NEGATIVE',
  'INSUFFICIENT_DATA',
] as const;

export type AnalystReviewStance = (typeof ANALYST_REVIEW_STANCES)[number];

export interface AnalystIdentity {
  analystId: string;
  role: string;
  domain: string;
  methodVersion: string;
  promptVersion: string;
}

export interface AnalystReviewInput {
  reviewId: string;
  bundleId: string;
  analyst: AnalystIdentity;
  asOf: string;
  stance: AnalystReviewStance;
  confidence: number | null;
  assessment: string;
  facts: readonly string[];
  inferences: readonly string[];
  assumptions: readonly string[];
  supportingEvidenceIds: readonly string[];
  counterevidenceIds: readonly string[];
  contextEvidenceIds?: readonly string[];
  dataGaps?: readonly string[];
  strongestCounterargument: string | null;
  invalidationConditions: readonly string[];
  executionAuthority?: boolean;
  reportPublicationAuthority?: boolean;
}

export interface AnalystReview {
  schemaVersion: typeof ANALYST_REVIEW_SCHEMA_VERSION;
  reviewId: string;
  bundleId: string;
  analyst: Readonly<AnalystIdentity>;
  asOf: string;
  stance: AnalystReviewStance;
  confidence: number | null;
  assessment: string;
  facts: readonly string[];
  inferences: readonly string[];
  assumptions: readonly string[];
  supportingEvidenceIds: readonly string[];
  counterevidenceIds: readonly string[];
  contextEvidenceIds: readonly string[];
  dataGaps: readonly string[];
  strongestCounterargument: string | null;
  invalidationConditions: readonly string[];
  executionAuthority: false;
  reportPublicationAuthority: false;
}

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function parseTimestamp(value: string, field: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be an ISO timestamp`);
  return parsed;
}

function normalizeTextList(values: readonly string[], field: string): readonly string[] {
  return Object.freeze(values.map((value, index) => requireText(value, `${field}[${index}]`)));
}

function uniqueText(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)]);
}

function assertNoAuthority(input: {
  executionAuthority?: boolean;
  reportPublicationAuthority?: boolean;
}): void {
  if (input.executionAuthority || input.reportPublicationAuthority) {
    throw new Error('research artifacts cannot grant execution or report-publication authority');
  }
}

export function createResearchBundle(
  input: CreateResearchBundleInput,
): Readonly<ResearchBundle> {
  assertNoAuthority(input);

  const asOfMs = parseTimestamp(input.asOf, 'asOf');
  const cutoffMs = parseTimestamp(input.knowledgeCutoff, 'knowledgeCutoff');
  if (cutoffMs > asOfMs) throw new Error('knowledgeCutoff cannot be after asOf');

  const seen = new Set<string>();
  const autoGaps: string[] = [];
  const organized: Readonly<OrganizedEvidenceItem>[] = [];

  for (const item of input.items) {
    const evidenceId = requireText(item.evidence.evidenceId, 'evidenceId');
    if (seen.has(evidenceId)) throw new Error(`duplicate Evidence ID: ${evidenceId}`);
    seen.add(evidenceId);

    const observedMs = parseTimestamp(item.evidence.observedAt, `${evidenceId}.observedAt`);
    if (observedMs > cutoffMs) {
      throw new Error(`Evidence ${evidenceId} was observed after the knowledge cutoff`);
    }

    let materialVerified = false;
    if (item.material) {
      if (requireText(item.material.evidenceId, 'material.evidenceId') !== evidenceId) {
        throw new Error(`material Evidence ID mismatch: ${evidenceId}`);
      }
      const declaredFingerprint = requireText(item.material.contentFingerprint, 'material.contentFingerprint');
      if (declaredFingerprint !== item.evidence.contentFingerprint) {
        throw new Error(`material fingerprint mismatch: ${evidenceId}`);
      }
      const computedFingerprint = fingerprintCanonicalContent(item.material.canonicalContent);
      if (computedFingerprint !== item.evidence.contentFingerprint) {
        throw new Error(`canonical content fingerprint mismatch: ${evidenceId}`);
      }
      materialVerified = true;
    } else {
      autoGaps.push(`MISSING_CANONICAL_CONTENT:${evidenceId}`);
    }

    const note = item.note === undefined ? undefined : requireText(item.note, `${evidenceId}.note`);
    organized.push(Object.freeze({
      evidenceId,
      disposition: item.disposition,
      contentFingerprint: item.evidence.contentFingerprint,
      sourceId: item.evidence.source.sourceId,
      sourceVersion: item.evidence.source.sourceVersion,
      publisher: item.evidence.source.publisher,
      observedAt: item.evidence.observedAt,
      publishedAt: item.evidence.publishedAt,
      retrievalUri: item.evidence.provenance.retrievalUri,
      ...(item.evidence.provenance.snapshotRef ? { snapshotRef: item.evidence.provenance.snapshotRef } : {}),
      asset: Object.freeze({ ...item.evidence.asset }),
      materialVerified,
      ...(note ? { note } : {}),
    }));
  }

  const explicitGaps = normalizeTextList(input.dataGaps ?? [], 'dataGaps');
  return Object.freeze({
    schemaVersion: RESEARCH_BUNDLE_SCHEMA_VERSION,
    bundleId: requireText(input.bundleId, 'bundleId'),
    subjectId: requireText(input.subjectId, 'subjectId'),
    asOf: new Date(asOfMs).toISOString(),
    knowledgeCutoff: new Date(cutoffMs).toISOString(),
    evidence: Object.freeze(organized),
    dataGaps: uniqueText([...explicitGaps, ...autoGaps]),
    executionAuthority: false,
    reportPublicationAuthority: false,
  });
}

function uniqueIds(values: readonly string[], field: string): readonly string[] {
  const normalized = values.map((value, index) => requireText(value, `${field}[${index}]`));
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`${field} must not contain duplicate Evidence IDs`);
  }
  return Object.freeze(normalized);
}

function requireCitations(
  bundle: ResearchBundle,
  ids: readonly string[],
  expectedDisposition: EvidenceDisposition,
  field: string,
): void {
  const byId = new Map(bundle.evidence.map((item) => [item.evidenceId, item] as const));
  for (const evidenceId of ids) {
    const item = byId.get(evidenceId);
    if (!item) throw new Error(`${field} references Evidence outside the research bundle: ${evidenceId}`);
    if (!item.materialVerified) {
      throw new Error(`${field} cannot cite Evidence without verified canonical material: ${evidenceId}`);
    }
    if (item.disposition !== expectedDisposition) {
      throw new Error(`${field} disposition mismatch for Evidence ${evidenceId}: expected ${expectedDisposition}, got ${item.disposition}`);
    }
  }
}

export function createAnalystReview(
  bundle: ResearchBundle,
  input: AnalystReviewInput,
): Readonly<AnalystReview> {
  assertNoAuthority(input);

  if (requireText(input.bundleId, 'bundleId') !== bundle.bundleId) {
    throw new Error('analyst review bundleId does not match research bundle');
  }

  const asOfMs = parseTimestamp(input.asOf, 'asOf');
  if (asOfMs < Date.parse(bundle.asOf)) {
    throw new Error('analyst review asOf cannot precede research bundle asOf');
  }

  if (!ANALYST_REVIEW_STANCES.includes(input.stance)) {
    throw new Error(`unsupported analyst stance: ${input.stance}`);
  }

  if (input.confidence !== null && (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1)) {
    throw new Error('confidence must be null or between 0 and 1');
  }

  const supportingEvidenceIds = uniqueIds(input.supportingEvidenceIds, 'supportingEvidenceIds');
  const counterevidenceIds = uniqueIds(input.counterevidenceIds, 'counterevidenceIds');
  const contextEvidenceIds = uniqueIds(input.contextEvidenceIds ?? [], 'contextEvidenceIds');

  const allCitations = [...supportingEvidenceIds, ...counterevidenceIds, ...contextEvidenceIds];
  if (new Set(allCitations).size !== allCitations.length) {
    throw new Error('Evidence ID cannot be cited in multiple analyst citation classes');
  }

  requireCitations(bundle, supportingEvidenceIds, 'SUPPORTING', 'supportingEvidenceIds');
  requireCitations(bundle, counterevidenceIds, 'CONTRADICTING', 'counterevidenceIds');
  requireCitations(bundle, contextEvidenceIds, 'CONTEXT', 'contextEvidenceIds');

  const analyst = Object.freeze({
    analystId: requireText(input.analyst.analystId, 'analyst.analystId'),
    role: requireText(input.analyst.role, 'analyst.role'),
    domain: requireText(input.analyst.domain, 'analyst.domain'),
    methodVersion: requireText(input.analyst.methodVersion, 'analyst.methodVersion'),
    promptVersion: requireText(input.analyst.promptVersion, 'analyst.promptVersion'),
  });

  const strongestCounterargument = input.strongestCounterargument === null
    ? null
    : requireText(input.strongestCounterargument, 'strongestCounterargument');

  return Object.freeze({
    schemaVersion: ANALYST_REVIEW_SCHEMA_VERSION,
    reviewId: requireText(input.reviewId, 'reviewId'),
    bundleId: bundle.bundleId,
    analyst,
    asOf: new Date(asOfMs).toISOString(),
    stance: input.stance,
    confidence: input.confidence,
    assessment: requireText(input.assessment, 'assessment'),
    facts: normalizeTextList(input.facts, 'facts'),
    inferences: normalizeTextList(input.inferences, 'inferences'),
    assumptions: normalizeTextList(input.assumptions, 'assumptions'),
    supportingEvidenceIds,
    counterevidenceIds,
    contextEvidenceIds,
    dataGaps: uniqueText([
      ...bundle.dataGaps,
      ...normalizeTextList(input.dataGaps ?? [], 'dataGaps'),
    ]),
    strongestCounterargument,
    invalidationConditions: normalizeTextList(input.invalidationConditions, 'invalidationConditions'),
    executionAuthority: false,
    reportPublicationAuthority: false,
  });
}
