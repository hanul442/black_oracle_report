import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createEvidencePacket, fingerprintCanonicalContent } from './evidence.js';
import { createResearchBundle, createAnalystReview } from './researchPipeline.js';
import { createResearchCouncilDecision } from './researchCouncil.js';
import { createThesisScenarioArtifact } from './thesisScenario.js';
import { createReportArtifact, type ReportArtifact } from './reportArtifact.js';
import { createReportExport } from './reportExport.js';
import { verifyReportExportConsistency } from './reportConsistency.js';
import { publishAlphaReadModelArtifact } from './alphaReadModelPublishCycle.js';

const now = new Date('2026-09-22T05:00:00Z');
function parents() {
  const packet = createEvidencePacket({ evidenceId:'e1', source:{sourceId:'s1',sourceVersion:'v1',publisher:'Test'}, asset:{status:'RESOLVED',canonicalAssetId:'KRX:1',symbol:'1'}, provenance:{retrievalUri:'https://example.test/e1',retrievedBy:'test'}, publishedAt:'2026-09-22T03:00:00Z', observedAt:'2026-09-22T03:10:00Z', canonicalContent:'Demand improved.' }, now);
  const material = { evidenceId:'e1', canonicalContent:'Demand improved.', contentFingerprint:fingerprintCanonicalContent('Demand improved.') };
  const bundle = createResearchBundle({ bundleId:'b1', subjectId:'KRX:1', asOf:'2026-09-22T03:30:00Z', knowledgeCutoff:'2026-09-22T03:30:00Z', items:[{evidence:packet,disposition:'SUPPORTING',material}], dataGaps:['GAP0'] });
  const review = createAnalystReview(bundle,{ reviewId:'a1',bundleId:'b1',analyst:{analystId:'a',role:'Analyst',domain:'company',methodVersion:'1',promptVersion:'1'},asOf:'2026-09-22T03:40:00Z',stance:'NEUTRAL',confidence:.5,assessment:'bounded',facts:[],inferences:[],assumptions:[],supportingEvidenceIds:['e1'],counterevidenceIds:[],dataGaps:[],strongestCounterargument:'missing counterevidence',invalidationConditions:[] });
  const council = createResearchCouncilDecision(review,{ councilId:'c1',analystReviewId:'a1',asOf:'2026-09-22T03:50:00Z',methodVersion:'1',promptVersion:'1',specialistReviews:[],redTeamChallenges:[],stance:'INSUFFICIENT_DATA',confidence:null,synthesis:'bounded',unresolvedDisagreements:['insufficient counterevidence'],dataGaps:['GAP1'] });
  const scenarios = [
    {kind:'BULL' as const,narrative:'upside',evidenceIds:['e1'],contradictingEvidenceIds:[],catalysts:['demand'],risks:['reversal'],invalidationConditions:['demand reversal']},
    {kind:'BASE' as const,narrative:'bounded',evidenceIds:['e1'],contradictingEvidenceIds:[],catalysts:[],risks:['data gap'],invalidationConditions:['material change']},
    {kind:'BEAR' as const,narrative:'downside',evidenceIds:['e1'],contradictingEvidenceIds:[],catalysts:[],risks:['reversal'],invalidationConditions:['demand persists']},
  ] as const;
  const thesis = createThesisScenarioArtifact(bundle,review,council,{ artifactId:'t1',bundleId:'b1',analystReviewId:'a1',councilId:'c1',asOf:'2026-09-22T04:00:00Z',methodVersion:'1',thesis:'bounded thesis',scenarios });
  const report = createReportArtifact(bundle,council,thesis,{reportId:'r1',seriesId:'series',version:1,asOf:'2026-09-22T04:10:00Z',title:'BOR report',summary:'bounded summary'});
  const exported = createReportExport(report,{exportId:'x1',format:'PDF'});
  return { report, exported, consistency:verifyReportExportConsistency(report,exported) };
}

test('publishes exact canonical projection through verified atomic persistence',()=>{
  const dir=mkdtempSync(join(tmpdir(),'bor-s21-'));
  try { const path=join(dir,'alpha.json'); const {report,exported,consistency}=parents(); const out=publishAlphaReadModelArtifact(report,exported,consistency,{projectionId:'p1'},path); const disk=JSON.parse(readFileSync(path,'utf8'));
    assert.deepEqual(disk,out.model); assert.deepEqual(out.model.citationEvidenceIds,['e1']); assert.equal(out.model.scenarios.length,3); assert.deepEqual(out.model.unresolvedDisagreements,['insufficient counterevidence']); assert.deepEqual(out.model.dataGaps,['GAP0','GAP1']); assert.equal(out.persistence.contentFingerprint,out.model.contentFingerprint); assert.equal(out.executionAuthority,false); assert.equal(out.reportPublicationAuthority,false); assert.equal(out.botDependency,false);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('fails closed before persistence for tampered parent or authority escalation',()=>{
  const dir=mkdtempSync(join(tmpdir(),'bor-s21-'));
  try { const path=join(dir,'alpha.json'); const {report,exported,consistency}=parents(); const tampered={...report,summary:'tampered'} as ReportArtifact;
    assert.throws(()=>publishAlphaReadModelArtifact(tampered,exported,consistency,{projectionId:'p2'},path),/parent integrity failure/); assert.equal(existsSync(path),false);
    assert.throws(()=>publishAlphaReadModelArtifact(report,exported,consistency,{projectionId:'p3',executionAuthority:true},path),/cannot grant/); assert.equal(existsSync(path),false);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('invalid artifact target fails without granting authority',()=>{
  const dir=mkdtempSync(join(tmpdir(),'bor-s21-'));
  try { const {report,exported,consistency}=parents(); assert.throws(()=>publishAlphaReadModelArtifact(report,exported,consistency,{projectionId:'p4'},dir)); }
  finally { rmSync(dir,{recursive:true,force:true}); }
});
