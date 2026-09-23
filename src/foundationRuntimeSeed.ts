import { existsSync } from 'node:fs';

import { getAlphaReadApiResponse } from './alphaReadApi.js';
import { createAlphaReadModelFileResolver } from './alphaReadModelFileResolver.js';
import { publishAlphaReadModelArtifact } from './alphaReadModelPublishCycle.js';
import { createEvidencePacket, fingerprintCanonicalContent } from './evidence.js';
import { createReportArtifact } from './reportArtifact.js';
import { verifyReportExportConsistency } from './reportConsistency.js';
import { createReportExport } from './reportExport.js';
import { createResearchBundle, createAnalystReview } from './researchPipeline.js';
import { createResearchCouncilDecision } from './researchCouncil.js';
import { createThesisScenarioArtifact } from './thesisScenario.js';

export const FOUNDATION_ATTESTATION_SEED_ENV = 'BOR_FOUNDATION_ATTESTATION_SEED' as const;

export interface FoundationRuntimeSeedResult {
  seeded: boolean;
  artifactPath: string;
  contentFingerprint: string;
  executionAuthority: false;
  reportPublicationAuthority: false;
  botDependency: false;
}

function foundationParents() {
  const now = new Date('2026-09-23T00:00:00Z');
  const canonicalContent = 'Infrastructure-only Foundation attestation; this artifact contains no market recommendation.';
  const evidenceId = 'bor-foundation-attestation-evidence-v1';
  const bundleId = 'bor-foundation-attestation-bundle-v1';
  const reviewId = 'bor-foundation-attestation-review-v1';
  const councilId = 'bor-foundation-attestation-council-v1';

  const packet = createEvidencePacket({
    evidenceId,
    source: {
      sourceId: 'black-oracle-report-foundation',
      sourceVersion: '2026-09-23',
      publisher: 'BLACK ORACLE REPORT',
    },
    asset: {
      status: 'RESOLVED',
      canonicalAssetId: 'BOR:FOUNDATION',
      symbol: 'FOUNDATION',
    },
    provenance: {
      retrievalUri: 'https://github.com/hanul442/black_oracle_report',
      retrievedBy: 'foundation-runtime-seed',
    },
    publishedAt: '2026-09-22T23:00:00Z',
    observedAt: '2026-09-22T23:05:00Z',
    canonicalContent,
  }, now);
  const material = {
    evidenceId,
    canonicalContent,
    contentFingerprint: fingerprintCanonicalContent(canonicalContent),
  };
  const bundle = createResearchBundle({
    bundleId,
    subjectId: 'BOR:FOUNDATION',
    asOf: '2026-09-22T23:10:00Z',
    knowledgeCutoff: '2026-09-22T23:10:00Z',
    items: [{ evidence: packet, disposition: 'SUPPORTING', material }],
    dataGaps: ['PRODUCTION_RESEARCH_NOT_RUN'],
  });
  const review = createAnalystReview(bundle, {
    reviewId,
    bundleId,
    analyst: {
      analystId: 'foundation-attestation',
      role: 'Infrastructure Attestation',
      domain: 'runtime',
      methodVersion: '1',
      promptVersion: 'none',
    },
    asOf: '2026-09-22T23:15:00Z',
    stance: 'NEUTRAL',
    confidence: 1,
    assessment: 'The BOR-owned durable artifact path is available for verification.',
    facts: ['Artifact generation, persistence, resolver, and read API are exercised without BOT authority.'],
    inferences: [],
    assumptions: [],
    supportingEvidenceIds: [evidenceId],
    counterevidenceIds: [],
    dataGaps: ['NO_PRODUCTION_RESEARCH_INPUT'],
    strongestCounterargument: 'This attestation does not establish production research freshness.',
    invalidationConditions: ['Artifact integrity failure', 'Authority flag escalation'],
  });
  const council = createResearchCouncilDecision(review, {
    councilId,
    analystReviewId: reviewId,
    asOf: '2026-09-22T23:20:00Z',
    methodVersion: '1',
    promptVersion: 'none',
    specialistReviews: [],
    redTeamChallenges: [],
    stance: 'INSUFFICIENT_DATA',
    confidence: null,
    synthesis: 'Infrastructure attestation only; no market conclusion is authorized.',
    unresolvedDisagreements: ['Production research inputs are intentionally absent.'],
    dataGaps: ['NO_EXTERNAL_RESEARCH_EVALUATION'],
  });
  const scenarios = [
    {
      kind: 'BULL' as const,
      narrative: 'Not evaluated in an infrastructure-only attestation.',
      evidenceIds: [evidenceId],
      contradictingEvidenceIds: [],
      catalysts: [],
      risks: ['NO_PRODUCTION_RESEARCH_INPUT'],
      invalidationConditions: ['Production research required'],
    },
    {
      kind: 'BASE' as const,
      narrative: 'The durable BOR artifact path remains authority-free and integrity-gated.',
      evidenceIds: [evidenceId],
      contradictingEvidenceIds: [],
      catalysts: [],
      risks: ['Storage or integrity failure'],
      invalidationConditions: ['Artifact unavailable or invalid'],
    },
    {
      kind: 'BEAR' as const,
      narrative: 'Not evaluated in an infrastructure-only attestation.',
      evidenceIds: [evidenceId],
      contradictingEvidenceIds: [],
      catalysts: [],
      risks: ['NO_PRODUCTION_RESEARCH_INPUT'],
      invalidationConditions: ['Production research required'],
    },
  ] as const;
  const thesis = createThesisScenarioArtifact(bundle, review, council, {
    artifactId: 'bor-foundation-attestation-thesis-v1',
    bundleId,
    analystReviewId: reviewId,
    councilId,
    asOf: '2026-09-22T23:25:00Z',
    methodVersion: '1',
    thesis: '',
    scenarios,
  });
  const report = createReportArtifact(bundle, council, thesis, {
    reportId: 'bor-foundation-attestation-report-v1',
    seriesId: 'bor-foundation-attestation',
    version: 1,
    asOf: '2026-09-22T23:30:00Z',
    title: 'BOR Foundation Runtime Attestation',
    summary: 'Infrastructure-only sample proving the durable BOR publish, resolve, and read path.',
  });
  const exported = createReportExport(report, {
    exportId: 'bor-foundation-attestation-export-v1',
    format: 'PDF',
  });
  return { report, exported, consistency: verifyReportExportConsistency(report, exported) };
}

export function ensureFoundationRuntimeSeed(
  env: NodeJS.ProcessEnv = process.env,
): Readonly<FoundationRuntimeSeedResult> | null {
  if (env[FOUNDATION_ATTESTATION_SEED_ENV]?.trim().toLowerCase() !== 'true') return null;

  const artifactPath = env.BOR_ALPHA_READ_MODEL_PATH?.trim();
  if (!artifactPath) throw new Error('BOR_ALPHA_READ_MODEL_PATH is required when Foundation attestation seeding is enabled');

  if (existsSync(artifactPath)) {
    const response = getAlphaReadApiResponse('GET', createAlphaReadModelFileResolver(env)());
    if (response.statusCode !== 200) {
      throw new Error('Existing BOR Foundation artifact failed the integrity/no-authority gate');
    }
    const model = response.body.model as { contentFingerprint?: unknown };
    if (typeof model.contentFingerprint !== 'string' || !model.contentFingerprint) {
      throw new Error('Existing BOR Foundation artifact has no content fingerprint');
    }
    return Object.freeze({
      seeded: false,
      artifactPath,
      contentFingerprint: model.contentFingerprint,
      executionAuthority: false,
      reportPublicationAuthority: false,
      botDependency: false,
    });
  }

  const { report, exported, consistency } = foundationParents();
  const published = publishAlphaReadModelArtifact(
    report,
    exported,
    consistency,
    { projectionId: 'bor-foundation-attestation-projection-v1' },
    artifactPath,
  );
  return Object.freeze({
    seeded: true,
    artifactPath,
    contentFingerprint: published.model.contentFingerprint,
    executionAuthority: false,
    reportPublicationAuthority: false,
    botDependency: false,
  });
}
