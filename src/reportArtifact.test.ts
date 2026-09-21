import assert from 'node:assert/strict'; import test from 'node:test';
import {createEvidencePacket,fingerprintCanonicalContent} from './evidence.js';
import {createResearchBundle,createAnalystReview} from './researchPipeline.js';
import {createResearchCouncilDecision} from './researchCouncil.js';
import {createThesisScenarioArtifact} from './thesisScenario.js';
import {createReportArtifact,ReportArchive,type ReportArtifact} from './reportArtifact.js';

const now=new Date('2026-09-21T06:00:00Z');
function setup(){
  const mk=(id:string,txt:string)=>createEvidencePacket({evidenceId:id,source:{sourceId:id,sourceVersion:'v1',publisher:'T'},asset:{status:'RESOLVED',canonicalAssetId:'KRX:1',symbol:'1'},provenance:{retrievalUri:`https://example.test/${id}`,retrievedBy:'test'},publishedAt:'2026-09-21T04:00:00Z',observedAt:'2026-09-21T04:10:00Z',canonicalContent:txt},now);
  const mat=(id:string,txt:string)=>({evidenceId:id,canonicalContent:txt,contentFingerprint:fingerprintCanonicalContent(txt)});
  const bundle=createResearchBundle({bundleId:'b',subjectId:'KRX:1',asOf:'2026-09-21T04:30:00Z',knowledgeCutoff:'2026-09-21T04:30:00Z',items:[{evidence:mk('s','Demand improved.'),disposition:'SUPPORTING',material:mat('s','Demand improved.')},{evidence:mk('c','Margins weakened.'),disposition:'CONTRADICTING',material:mat('c','Margins weakened.')}],dataGaps:['GAP0']});
  const review=createAnalystReview(bundle,{reviewId:'a',bundleId:'b',analyst:{analystId:'a',role:'Analyst',domain:'company',methodVersion:'1',promptVersion:'1'},asOf:'2026-09-21T04:40:00Z',stance:'NEUTRAL',confidence:.5,assessment:'mixed',facts:[],inferences:[],assumptions:[],supportingEvidenceIds:['s'],counterevidenceIds:['c'],dataGaps:[],strongestCounterargument:'margin',invalidationConditions:[]});
  const council=createResearchCouncilDecision(review,{councilId:'co',analystReviewId:'a',asOf:'2026-09-21T05:00:00Z',methodVersion:'1',promptVersion:'1',specialistReviews:[],redTeamChallenges:[],stance:'NEUTRAL',confidence:.5,synthesis:'bounded',unresolvedDisagreements:['demand vs margin'],dataGaps:['GAP1']});
  const scenarios=[{kind:'BULL' as const,narrative:'upside',evidenceIds:['s'],contradictingEvidenceIds:['c'],catalysts:['demand'],risks:['margin'],invalidationConditions:['demand reversal']},{kind:'BASE' as const,narrative:'mixed',evidenceIds:['s'],contradictingEvidenceIds:['c'],catalysts:[],risks:['margin'],invalidationConditions:['material change']},{kind:'BEAR' as const,narrative:'downside',evidenceIds:['c'],contradictingEvidenceIds:['c'],catalysts:[],risks:['margin'],invalidationConditions:['margin recovery']}] as const;
  const thesis=createThesisScenarioArtifact(bundle,review,council,{artifactId:'t1',bundleId:'b',analystReviewId:'a',councilId:'co',asOf:'2026-09-21T05:10:00Z',methodVersion:'1',thesis:'mixed outlook',scenarios});
  return {bundle,council,thesis};
}
function reportInput(reportId='r1',version=1,asOf='2026-09-21T05:20:00Z'){return{reportId,seriesId:'series',version,asOf,title:'BOR report',summary:'bounded summary'};}

test('creates and archives immutable report with canonical citations and no authority',()=>{
  const {bundle,council,thesis}=setup(); const report=createReportArtifact(bundle,council,thesis,reportInput()); const archive=new ReportArchive();
  assert.deepEqual(report.citationEvidenceIds,['c','s']); assert.equal(report.executionAuthority,false); assert.equal(report.reportPublicationAuthority,false);
  assert.equal(archive.append(report),report); assert.equal(archive.get('r1'),report); assert.equal(archive.listSeries('series').length,1);
});
test('fails closed on authority, chronology, lineage and archive fingerprint tampering',()=>{
  const {bundle,council,thesis}=setup();
  assert.throws(()=>createReportArtifact(bundle,council,thesis,{...reportInput(),executionAuthority:true}),/cannot grant/);
  assert.throws(()=>createReportArtifact(bundle,council,thesis,{...reportInput(),asOf:'2026-09-21T05:05:00Z'}),/precede/);
  assert.throws(()=>createReportArtifact(bundle,{...council,councilId:'forged'},thesis,reportInput()),/lineage mismatch/);
  const report=createReportArtifact(bundle,council,thesis,reportInput()); const archive=new ReportArchive();
  const tampered={...report,summary:'tampered'} as ReportArtifact; assert.throws(()=>archive.append(tampered),/fingerprint mismatch/);
});
test('archive rejects duplicate IDs and non-monotonic series version/asOf',()=>{
  const {bundle,council,thesis}=setup(); const archive=new ReportArchive(); const first=createReportArtifact(bundle,council,thesis,reportInput()); archive.append(first);
  assert.throws(()=>archive.append(first),/already archived/);
  const sameVersion=createReportArtifact(bundle,council,thesis,reportInput('r2',1,'2026-09-21T05:30:00Z')); assert.throws(()=>archive.append(sameVersion),/increase monotonically/);
  const staleTime=createReportArtifact(bundle,council,thesis,reportInput('r3',2,'2026-09-21T05:15:00Z')); assert.throws(()=>archive.append(staleTime),/increase monotonically/);
  const next=createReportArtifact(bundle,council,thesis,reportInput('r4',2,'2026-09-21T05:30:00Z')); archive.append(next); assert.equal(archive.listSeries('series').length,2);
});
