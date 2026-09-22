import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { REPORT_EXPORT_SCHEMA_VERSION, type ReportExportArtifact } from './reportExport.js';
import { PDF_RENDER_MANIFEST_SCHEMA_VERSION, preparePdfRenderManifest } from './reportPdfManifest.js';

function hash(v:string){return createHash('sha256').update(v,'utf8').digest('hex');}
function fixture(format:'HTML'|'PDF'='PDF'): ReportExportArtifact {
  const scenario=(kind:'BULL'|'BASE'|'BEAR')=>({kind,narrative:`${kind} case`,evidenceIds:[`ev-${kind}`],contradictingEvidenceIds:['ev-counter'],catalysts:['catalyst one'],risks:['risk zero'],invalidationConditions:['invalidate quoted']});
  const core={schemaVersion:REPORT_EXPORT_SCHEMA_VERSION,exportId:'export-25',format,reportId:'report-25',seriesId:'series-a',reportVersion:3,reportAsOf:'2026-09-23T00:00:00.000Z',reportContentFingerprint:'parent-fingerprint',title:'Alpha Report',summary:'summary context',thesis:'thesis over noise',scenarios:[scenario('BULL'),scenario('BASE'),scenario('BEAR')],citationEvidenceIds:['ev-BULL','ev-BASE','ev-BEAR','ev-counter'],unresolvedDisagreements:['desk disagrees'],dataGaps:['missing explicit']};
  return {...core,exportFingerprint:hash(JSON.stringify(core)),executionAuthority:false,reportPublicationAuthority:false};
}

test('prepares deterministic PDF manifest preserving canonical research semantics',()=>{
  const source=fixture(); const a=preparePdfRenderManifest(source); const b=preparePdfRenderManifest(source);
  assert.deepEqual(a,b); assert.equal(a.contentFingerprint,hash(a.bytes)); assert.equal(a.manifest.schemaVersion,PDF_RENDER_MANIFEST_SCHEMA_VERSION);
  assert.equal(a.manifest.sourceExportFingerprint,source.exportFingerprint); assert.deepEqual(a.manifest.citationEvidenceIds,source.citationEvidenceIds);
  assert.deepEqual(a.manifest.scenarios,source.scenarios); assert.deepEqual(a.manifest.unresolvedDisagreements,source.unresolvedDisagreements); assert.deepEqual(a.manifest.dataGaps,source.dataGaps);
  assert.equal(a.executionAuthority,false); assert.equal(a.reportPublicationAuthority,false);
  for(const forbidden of ['http://','https://','<script','browser','provider']) assert.equal(a.bytes.includes(forbidden),false);
});

test('rejects tampered export fingerprint',()=>{const source=fixture(); assert.throws(()=>preparePdfRenderManifest({...source,title:'tampered'}),/fingerprint mismatch/);});
test('rejects HTML export',()=>assert.throws(()=>preparePdfRenderManifest(fixture('HTML')),/requires PDF export/));
test('rejects authority escalation',()=>{const source=fixture(); assert.throws(()=>preparePdfRenderManifest({...source,executionAuthority:true} as unknown as ReportExportArtifact),/zero-authority/);});
test('rejects empty identity even with recomputed fingerprint',()=>{
  const source=fixture(); const {exportFingerprint:_old,executionAuthority,reportPublicationAuthority,...core}=source; const badCore={...core,exportId:'   '};
  const bad={...badCore,exportFingerprint:hash(JSON.stringify(badCore)),executionAuthority,reportPublicationAuthority} as ReportExportArtifact;
  assert.throws(()=>preparePdfRenderManifest(bad),/exportId is required/);
});
