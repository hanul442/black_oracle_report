import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { REPORT_EXPORT_SCHEMA_VERSION, type ReportExportArtifact } from './reportExport.js';
import { preparePdfRenderManifest, type PreparedPdfRenderManifest } from './reportPdfManifest.js';
import { renderPdfBytes } from './reportPdfRenderer.js';

function hash(v:string|Buffer){return createHash('sha256').update(v).digest('hex');}
function fixture(): ReportExportArtifact {
  const scenario=(kind:'BULL'|'BASE'|'BEAR')=>({kind,narrative:`${kind} case`,evidenceIds:[`ev-${kind}`],contradictingEvidenceIds:['ev-counter'],catalysts:['catalyst one'],risks:['risk zero'],invalidationConditions:['invalidate quoted']});
  const core={schemaVersion:REPORT_EXPORT_SCHEMA_VERSION,exportId:'export-26',format:'PDF' as const,reportId:'report-26',seriesId:'series-a',reportVersion:4,reportAsOf:'2026-09-23T00:00:00.000Z',reportContentFingerprint:'parent-fingerprint',title:'Alpha (Verified) Report',summary:'summary context',thesis:'thesis over noise',scenarios:[scenario('BULL'),scenario('BASE'),scenario('BEAR')],citationEvidenceIds:['ev-BULL','ev-BASE','ev-BEAR','ev-counter'],unresolvedDisagreements:['desk disagrees'],dataGaps:['missing explicit']};
  return {...core,exportFingerprint:hash(JSON.stringify(core)),executionAuthority:false,reportPublicationAuthority:false};
}

test('renders deterministic valid-looking PDF bytes preserving inspectable semantics',()=>{
  const manifest=preparePdfRenderManifest(fixture()); const a=renderPdfBytes(manifest); const b=renderPdfBytes(manifest);
  assert.deepEqual(a,b); assert.equal(a.contentFingerprint,hash(a.bytes)); assert.equal(a.sourceManifestFingerprint,manifest.contentFingerprint);
  const text=a.bytes.toString('utf8');
  assert.ok(text.startsWith('%PDF-1.4')); assert.ok(text.includes('xref\n')); assert.ok(text.includes('trailer\n')); assert.ok(text.endsWith('%%EOF\n'));
  for(const expected of ['report-26','series-a','export-26','thesis over noise','BULL:','BASE:','BEAR:','ev-counter','desk disagrees','missing explicit']) assert.ok(text.includes(expected),expected);
  for(const forbidden of ['/JavaScript','/JS ','/Launch','/EmbeddedFiles','/URI','http://','https://']) assert.equal(text.includes(forbidden),false,forbidden);
  assert.equal(a.executionAuthority,false); assert.equal(a.reportPublicationAuthority,false);
});

test('escapes PDF literal-string metacharacters from report text',()=>{
  const source=fixture(); const {exportFingerprint:_old,executionAuthority,reportPublicationAuthority,...core}=source; const changed={...core,title:'Alpha (safe) \\ report'}; const valid={...changed,exportFingerprint:hash(JSON.stringify(changed)),executionAuthority,reportPublicationAuthority};
  const text=renderPdfBytes(preparePdfRenderManifest(valid)).bytes.toString('utf8');
  assert.ok(text.includes('Alpha \\(safe\\) \\\\ report'));
});

test('rejects tampered manifest bytes',()=>{const m=preparePdfRenderManifest(fixture()); assert.throws(()=>renderPdfBytes({...m,bytes:m.bytes+' '}),/bytes mismatch/);});
test('rejects tampered manifest fingerprint',()=>{const m=preparePdfRenderManifest(fixture()); assert.throws(()=>renderPdfBytes({...m,contentFingerprint:'0'.repeat(64)}),/fingerprint mismatch/);});
test('rejects authority escalation',()=>{const m=preparePdfRenderManifest(fixture()); assert.throws(()=>renderPdfBytes({...m,executionAuthority:true} as unknown as PreparedPdfRenderManifest),/zero-authority/);});
test('rejects empty canonical identity even with internally consistent bytes and fingerprint',()=>{
  const m=preparePdfRenderManifest(fixture()); const manifest={...m.manifest,reportId:'   '}; const bytes=JSON.stringify(manifest); const bad={...m,manifest,bytes,contentFingerprint:hash(bytes)} as PreparedPdfRenderManifest;
  assert.throws(()=>renderPdfBytes(bad),/reportId is required/);
});
