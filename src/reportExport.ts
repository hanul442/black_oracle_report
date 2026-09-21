import { createHash } from 'node:crypto';
import { REPORT_ARTIFACT_SCHEMA_VERSION, type ReportArtifact } from './reportArtifact.js';

export const REPORT_EXPORT_SCHEMA_VERSION = 'bor.report-export.v1' as const;
export const REPORT_EXPORT_FORMATS = ['HTML','PDF'] as const;
export type ReportExportFormat = typeof REPORT_EXPORT_FORMATS[number];

interface NoAuthority { executionAuthority?: boolean; reportPublicationAuthority?: boolean }
export interface ReportExportInput extends NoAuthority { exportId:string; format:ReportExportFormat; }
export interface ReportExportArtifact {
  schemaVersion:typeof REPORT_EXPORT_SCHEMA_VERSION; exportId:string; format:ReportExportFormat;
  reportId:string; seriesId:string; reportVersion:number; reportAsOf:string; reportContentFingerprint:string;
  title:string; summary:string; thesis:string; scenarios:ReportArtifact['scenarios']; citationEvidenceIds:readonly string[];
  unresolvedDisagreements:readonly string[]; dataGaps:readonly string[]; exportFingerprint:string;
  executionAuthority:false; reportPublicationAuthority:false;
}
function text(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} is required`);return n;}
function fingerprint(payload:unknown){return createHash('sha256').update(JSON.stringify(payload),'utf8').digest('hex');}
function reportCore(report:Readonly<ReportArtifact>){const {contentFingerprint:_contentFingerprint,executionAuthority:_executionAuthority,reportPublicationAuthority:_reportPublicationAuthority,...core}=report;return core;}
export function verifyReportArtifactForExport(report:Readonly<ReportArtifact>){
  if(report.schemaVersion!==REPORT_ARTIFACT_SCHEMA_VERSION)throw new Error('unsupported report artifact schema');
  if(report.executionAuthority!==false||report.reportPublicationAuthority!==false)throw new Error('report export requires zero-authority parent');
  if(fingerprint(reportCore(report))!==report.contentFingerprint)throw new Error('report content fingerprint mismatch');
  return report;
}
export function createReportExport(report:Readonly<ReportArtifact>,input:ReportExportInput):Readonly<ReportExportArtifact>{
  verifyReportArtifactForExport(report);
  if(input.executionAuthority||input.reportPublicationAuthority)throw new Error('report export cannot grant execution or publication authority');
  if(!REPORT_EXPORT_FORMATS.includes(input.format))throw new Error('unsupported report export format');
  const core={schemaVersion:REPORT_EXPORT_SCHEMA_VERSION,exportId:text(input.exportId,'exportId'),format:input.format,reportId:report.reportId,seriesId:report.seriesId,reportVersion:report.version,reportAsOf:report.asOf,reportContentFingerprint:report.contentFingerprint,title:report.title,summary:report.summary,thesis:report.thesis,scenarios:report.scenarios,citationEvidenceIds:Object.freeze([...report.citationEvidenceIds]),unresolvedDisagreements:Object.freeze([...report.unresolvedDisagreements]),dataGaps:Object.freeze([...report.dataGaps])};
  return Object.freeze({...core,exportFingerprint:fingerprint(core),executionAuthority:false,reportPublicationAuthority:false});
}
