import assert from 'node:assert/strict';
import test from 'node:test';

import { createEvidencePacket, fingerprintCanonicalContent } from './evidence.js';
import {
  ANALYST_REVIEW_SCHEMA_VERSION,
  RESEARCH_BUNDLE_SCHEMA_VERSION,
  createAnalystReview,
  createResearchBundle,
  type EvidenceMaterial,
} from './researchPipeline.js';

const NOW = new Date('2026-09-21T05:00:00.000Z');

function evidence(
  evidenceId: string,
  content: string,
  observedAt = '2026-09-21T04:00:00.000Z',
) {
  return createEvidencePacket({
    evidenceId,
    source: {
      sourceId: `source:${evidenceId}`,
      sourceVersion: 'v1',
      publisher: 'Test Publisher',
    },
    asset: {
      status: 'RESOLVED',
      canonicalAssetId: 'KRX:000001',
      symbol: '000001',
    },
    provenance: {
      retrievalUri: `https://example.test/${evidenceId}`,
      snapshotRef: `sha256:snapshot-${evidenceId}`,
      retrievedBy: 'bor-test-collector@1.0.0',
    },
    publishedAt: '2026-09-21T03:50:00.000Z',
    observedAt,
    canonicalContent: content,
  }, NOW);
}

function material(evidenceId: string, content: string): EvidenceMaterial {
  return {
    evidenceId,
    canonicalContent: content,
    contentFingerprint: fingerprintCanonicalContent(content),
  };
}

test('creates research bundle with explicit supporting and contradicting Evidence', () => {
  const supportText = 'Revenue guidance increased for the next quarter.';
  const contraText = 'Input costs also rose materially during the same period.';
  const bundle = createResearchBundle({
    bundleId: 'bundle-1',
    subjectId: 'KRX:000001',
    asOf: '2026-09-21T04:30:00.000Z',
    knowledgeCutoff: '2026-09-21T04:30:00.000Z',
    items: [
      {
        evidence: evidence('ev-support', supportText),
        disposition: 'SUPPORTING',
        material: material('ev-support', supportText),
      },
      {
        evidence: evidence('ev-contra', contraText),
        disposition: 'CONTRADICTING',
        material: material('ev-contra', contraText),
      },
    ],
  });

  assert.equal(bundle.schemaVersion, RESEARCH_BUNDLE_SCHEMA_VERSION);
  assert.equal(bundle.evidence.length, 2);
  assert.equal(bundle.evidence[0]?.materialVerified, true);
  assert.equal(bundle.evidence[1]?.disposition, 'CONTRADICTING');
  assert.equal(bundle.executionAuthority, false);
  assert.equal(bundle.reportPublicationAuthority, false);
});

test('fails closed when analysis material does not match stored Evidence fingerprint', () => {
  const stored = evidence('ev-1', 'Canonical source content.');
  assert.throws(
    () => createResearchBundle({
      bundleId: 'bundle-mismatch',
      subjectId: 'KRX:000001',
      asOf: '2026-09-21T04:30:00.000Z',
      knowledgeCutoff: '2026-09-21T04:30:00.000Z',
      items: [{
        evidence: stored,
        disposition: 'SUPPORTING',
        material: {
          evidenceId: 'ev-1',
          canonicalContent: 'Different content.',
          contentFingerprint: stored.contentFingerprint,
        },
      }],
    }),
    /canonical content fingerprint mismatch/,
  );
});

test('fails closed on Evidence observed after the knowledge cutoff', () => {
  const text = 'Late evidence.';
  assert.throws(
    () => createResearchBundle({
      bundleId: 'bundle-late',
      subjectId: 'KRX:000001',
      asOf: '2026-09-21T04:30:00.000Z',
      knowledgeCutoff: '2026-09-21T04:30:00.000Z',
      items: [{
        evidence: evidence('ev-late', text, '2026-09-21T04:45:00.000Z'),
        disposition: 'CONTEXT',
        material: material('ev-late', text),
      }],
    }),
    /observed after the knowledge cutoff/,
  );
});

test('missing canonical material remains an explicit data gap and cannot be cited', () => {
  const bundle = createResearchBundle({
    bundleId: 'bundle-gap',
    subjectId: 'KRX:000001',
    asOf: '2026-09-21T04:30:00.000Z',
    knowledgeCutoff: '2026-09-21T04:30:00.000Z',
    items: [{
      evidence: evidence('ev-gap', 'Content exists upstream but is not materialized here.'),
      disposition: 'UNRESOLVED',
    }],
  });

  assert.deepEqual(bundle.dataGaps, ['MISSING_CANONICAL_CONTENT:ev-gap']);
  assert.throws(
    () => createAnalystReview(bundle, {
      reviewId: 'review-gap',
      bundleId: bundle.bundleId,
      analyst: {
        analystId: 'research-analyst',
        role: 'Research Analyst',
        domain: 'general',
        methodVersion: '1.0',
        promptVersion: '1.0',
      },
      asOf: '2026-09-21T04:40:00.000Z',
      stance: 'INSUFFICIENT_DATA',
      confidence: null,
      assessment: 'Insufficient verified material.',
      facts: [],
      inferences: [],
      assumptions: [],
      supportingEvidenceIds: ['ev-gap'],
      counterevidenceIds: [],
      dataGaps: [],
      strongestCounterargument: null,
      invalidationConditions: [],
    }),
    /cannot cite Evidence without verified canonical material|disposition mismatch/,
  );
});

test('analyst review preserves counterevidence and rejects invented citations', () => {
  const supportText = 'Demand improved.';
  const contraText = 'Margins weakened.';
  const bundle = createResearchBundle({
    bundleId: 'bundle-review',
    subjectId: 'KRX:000001',
    asOf: '2026-09-21T04:30:00.000Z',
    knowledgeCutoff: '2026-09-21T04:30:00.000Z',
    items: [
      {
        evidence: evidence('ev-support', supportText),
        disposition: 'SUPPORTING',
        material: material('ev-support', supportText),
      },
      {
        evidence: evidence('ev-contra', contraText),
        disposition: 'CONTRADICTING',
        material: material('ev-contra', contraText),
      },
    ],
    dataGaps: ['NO_AUDITED_FORWARD_GUIDANCE'],
  });

  const review = createAnalystReview(bundle, {
    reviewId: 'review-1',
    bundleId: bundle.bundleId,
    analyst: {
      analystId: 'company-research',
      role: 'Research Analyst',
      domain: 'company',
      methodVersion: '1.0',
      promptVersion: '1.0',
    },
    asOf: '2026-09-21T04:40:00.000Z',
    stance: 'NEUTRAL',
    confidence: 0.62,
    assessment: 'Demand improved, but weaker margins preserve material uncertainty.',
    facts: ['Demand improved.', 'Margins weakened.'],
    inferences: ['Net effect remains uncertain.'],
    assumptions: ['No major accounting restatement.'],
    supportingEvidenceIds: ['ev-support'],
    counterevidenceIds: ['ev-contra'],
    dataGaps: ['NO_NEW_CAPEX_GUIDANCE'],
    strongestCounterargument: 'Demand strength may outweigh the margin pressure.',
    invalidationConditions: ['Margin pressure reverses materially.'],
  });

  assert.equal(review.schemaVersion, ANALYST_REVIEW_SCHEMA_VERSION);
  assert.deepEqual(review.counterevidenceIds, ['ev-contra']);
  assert.deepEqual(review.dataGaps, ['NO_AUDITED_FORWARD_GUIDANCE', 'NO_NEW_CAPEX_GUIDANCE']);
  assert.equal(review.executionAuthority, false);
  assert.equal(review.reportPublicationAuthority, false);

  assert.throws(
    () => createAnalystReview(bundle, {
      ...review,
      reviewId: 'review-invented',
      supportingEvidenceIds: ['ev-does-not-exist'],
    }),
    /outside the research bundle/,
  );
});

test('analyst cannot relabel contradicting Evidence or escalate authority', () => {
  const text = 'Material regulatory risk increased.';
  const bundle = createResearchBundle({
    bundleId: 'bundle-authority',
    subjectId: 'KRX:000001',
    asOf: '2026-09-21T04:30:00.000Z',
    knowledgeCutoff: '2026-09-21T04:30:00.000Z',
    items: [{
      evidence: evidence('ev-risk', text),
      disposition: 'CONTRADICTING',
      material: material('ev-risk', text),
    }],
  });

  const base = {
    reviewId: 'review-authority',
    bundleId: bundle.bundleId,
    analyst: {
      analystId: 'policy-analyst',
      role: 'Research Analyst',
      domain: 'policy',
      methodVersion: '1.0',
      promptVersion: '1.0',
    },
    asOf: '2026-09-21T04:40:00.000Z',
    stance: 'NEGATIVE' as const,
    confidence: 0.8,
    assessment: 'Regulatory risk increased.',
    facts: ['A regulatory action was observed.'],
    inferences: ['Risk increased.'],
    assumptions: [],
    supportingEvidenceIds: ['ev-risk'],
    counterevidenceIds: [],
    dataGaps: [],
    strongestCounterargument: null,
    invalidationConditions: [],
  };

  assert.throws(() => createAnalystReview(bundle, base), /disposition mismatch/);
  assert.throws(
    () => createAnalystReview(bundle, {
      ...base,
      supportingEvidenceIds: [],
      counterevidenceIds: ['ev-risk'],
      executionAuthority: true,
    }),
    /cannot grant execution or report-publication authority/,
  );
});
