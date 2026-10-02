import { createHash } from 'node:crypto';
import { REPORT_ARTIFACT_SCHEMA_VERSION, type ReportArtifact } from './reportArtifact.js';
import { REPORT_EXPORT_SCHEMA_VERSION, type ReportExportArtifact } from './reportExport.js';

export const REPORT_CONSISTENCY_SCHEMA_VERSION = 'bor.report-consistency.v1' as const;
export const REPORT_CONSISTENCY_ISSUES = [
  'REPORT_SCHEMA_INVALID','EXPORT_SCHEMA_INVALID','AUTHORITY_ESCALATION','REPORT_FINGERPRINT_INVALID','EXPORT_FINGERPRINT_INVALID',
  'PARENT_IDENTITY_MISMATCH','CITATION_SET_MISMATCH','SCENARIO_MISMATCH','DISAGREEMENT_MISMATCH','DATA_GAP_MISMATCH'
] as const;
export type ReportConsistencyIssue = typeof REPORT_CONSISTENCY_ISSUES[number];
export interface ReportConsistencyResult { schemaVersion:typeof REPORT_CONSISTENCY_SCHEMA_VERSION; status:'PASS'|'FAIL'; reportId:string; exportId:string; issues:readonly ReportConsistencyIssue[]; executionAuthority:false; reportPublicationAuthority:false; }
function fingerprint(payload:unknown){return createHash('sha256').update(JSON.stringify(payload),'utf8').digest('hex');}
function reportCore(report:Readonly<ReportArtifact>){const {contentFingerprint:_f,executionAuthority:_e,reportPublicationAuthority:_p,...core}=report;return core;}
function exportCore(value:Readonly<ReportExportArtifact>){const {exportFingerprint:_f,executionAuthority:_e,reportPublicationAuthority:_p,...core}=value;return core;}
function same(a:unknown,b:unknown){return JSON.stringify(a)===JSON.stringify(b);}
function sorted(values:readonly string[]){return [...values].sort();}

export function verifyReportExportConsistency(report:Readonly<ReportArtifact>,value:Readonly<ReportExportArtifact>):Readonly<ReportConsistencyResult>{
  const issues:ReportConsistencyIssue[]=[];
  if(report.schemaVersion!==REPORT_ARTIFACT_SCHEMA_VERSION)issues.push('REPORT_SCHEMA_INVALID');
  if(value.schemaVersion!==REPORT_EXPORT_SCHEMA_VERSION)issues.push('EXPORT_SCHEMA_INVALID');
  if(report.executionAuthority!==false||report.reportPublicationAuthority!==false||value.executionAuthority!==false||value.reportPublicationAuthority!==false)issues.push('AUTHORITY_ESCALATION');
  if(fingerprint(reportCore(report))!==report.contentFingerprint)issues.push('REPORT_FINGERPRINT_INVALID');
  if(fingerprint(exportCore(value))!==value.exportFingerprint)issues.push('EXPORT_FINGERPRINT_INVALID');
  if(value.reportId!==report.reportId||value.seriesId!==report.seriesId||value.reportVersion!==report.version||value.reportAsOf!==report.asOf||value.reportContentFingerprint!==report.contentFingerprint)issues.push('PARENT_IDENTITY_MISMATCH');
  if(!same(sorted(value.citationEvidenceIds),sorted(report.citationEvidenceIds)))issues.push('CITATION_SET_MISMATCH');
  if(!same(value.scenarios,report.scenarios))issues.push('SCENARIO_MISMATCH');
  if(!same(value.unresolvedDisagreements,report.unresolvedDisagreements))issues.push('DISAGREEMENT_MISMATCH');
  if(!same(value.dataGaps,report.dataGaps))issues.push('DATA_GAP_MISMATCH');
  return Object.freeze({schemaVersion:REPORT_CONSISTENCY_SCHEMA_VERSION,status:issues.length?'FAIL':'PASS',reportId:report.reportId,exportId:value.exportId,issues:Object.freeze(issues),executionAuthority:false,reportPublicationAuthority:false});
}
