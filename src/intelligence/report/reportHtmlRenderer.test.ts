import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { REPORT_EXPORT_SCHEMA_VERSION, type ReportExportArtifact } from './reportExport.js';
import { renderReportHtml } from './reportHtmlRenderer.js';

function hash(v:string){return createHash('sha256').update(v,'utf8').digest('hex');}
function fixture(format:'HTML'|'PDF'='HTML'): ReportExportArtifact {
  const scenario=(kind:'BULL'|'BASE'|'BEAR')=>({kind,narrative:`${kind} <case>`,evidenceIds:[`ev-${kind}`],contradictingEvidenceIds:['ev-counter'],catalysts:['catalyst & one'],risks:['risk > zero'],invalidationConditions:['invalidate "quoted"']});
  const core={schemaVersion:REPORT_EXPORT_SCHEMA_VERSION,exportId:'export-24',format,reportId:'report-24',seriesId:'series-a',reportVersion:2,reportAsOf:'2026-09-23T00:00:00.000Z',reportContentFingerprint:'parent-fingerprint',title:'Alpha <Report>',summary:'summary & context',thesis:'thesis > noise',scenarios:[scenario('BULL'),scenario('BASE'),scenario('BEAR')],citationEvidenceIds:['ev-BULL','ev-BASE','ev-BEAR','ev-counter'],unresolvedDisagreements:['desk < disagrees'],dataGaps:['missing & explicit']};
  return {...core,exportFingerprint:hash(JSON.stringify(core)),executionAuthority:false,reportPublicationAuthority:false};
}

test('renders deterministic escaped HTML preserving canonical research semantics',()=>{
  const source=fixture(); const a=renderReportHtml(source); const b=renderReportHtml(source);
  assert.deepEqual(a,b); assert.equal(a.contentFingerprint,hash(a.html));
  for(const token of ['BULL','BASE','BEAR','ev-BULL','ev-BASE','ev-BEAR','ev-counter','Unresolved disagreements','Data gaps']) assert.match(a.html,new RegExp(token));
  assert.match(a.html,/Alpha &lt;Report&gt;/); assert.match(a.html,/summary &amp; context/); assert.match(a.html,/desk &lt; disagrees/); assert.match(a.html,/missing &amp; explicit/);
  assert.doesNotMatch(a.html,/Alpha <Report>/); assert.equal(a.executionAuthority,false); assert.equal(a.reportPublicationAuthority,false);
});

test('rejects tampered export fingerprint',()=>{
  const source=fixture(); assert.throws(()=>renderReportHtml({...source,title:'tampered'}),/fingerprint mismatch/);
});

test('rejects PDF export',()=>assert.throws(()=>renderReportHtml(fixture('PDF')),/requires HTML export/));

test('rejects authority escalation',()=>{
  const source=fixture(); assert.throws(()=>renderReportHtml({...source,executionAuthority:true} as unknown as ReportExportArtifact),/zero-authority/);
});

test('rejects empty canonical identity even with recomputed fingerprint',()=>{
  const source=fixture(); const {exportFingerprint:_old,executionAuthority,reportPublicationAuthority,...core}=source; const badCore={...core,exportId:'   '};
  const bad={...badCore,exportFingerprint:hash(JSON.stringify(badCore)),executionAuthority,reportPublicationAuthority} as ReportExportArtifact;
  assert.throws(()=>renderReportHtml(bad),/exportId is required/);
});
