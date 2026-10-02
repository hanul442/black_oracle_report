import { createHash } from 'node:crypto';
import type { ReportArtifact } from './reportArtifact.js';
import type { ReportExportArtifact } from './reportExport.js';
import { REPORT_CONSISTENCY_SCHEMA_VERSION, verifyReportExportConsistency, type ReportConsistencyResult } from './reportConsistency.js';

export const ALPHA_READ_MODEL_SCHEMA_VERSION = 'bor.alpha-read-model.v1' as const;
interface NoAuthority { executionAuthority?: boolean; reportPublicationAuthority?: boolean; botDependency?: boolean }
export interface AlphaReadModelInput extends NoAuthority { projectionId:string; }
export interface AlphaReadModel {
  schemaVersion:typeof ALPHA_READ_MODEL_SCHEMA_VERSION; projectionId:string; reportId:string; seriesId:string; reportVersion:number; asOf:string;
  reportContentFingerprint:string; exportId:string; exportFingerprint:string; title:string; summary:string; thesis:string;
  scenarios:ReportArtifact['scenarios']; citationEvidenceIds:readonly string[]; unresolvedDisagreements:readonly string[]; dataGaps:readonly string[];
  contentFingerprint:string; executionAuthority:false; reportPublicationAuthority:false; botDependency:false;
}
function text(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} is required`);return n;}
function fingerprint(payload:unknown){return createHash('sha256').update(JSON.stringify(payload),'utf8').digest('hex');}
function noAuthority(v:NoAuthority){if(v.executionAuthority||v.reportPublicationAuthority||v.botDependency)throw new Error('Alpha read model cannot grant execution, publication, or BOT dependency authority');}

export function createAlphaReadModel(report:Readonly<ReportArtifact>,value:Readonly<ReportExportArtifact>,consistency:Readonly<ReportConsistencyResult>,input:AlphaReadModelInput):Readonly<AlphaReadModel>{
  noAuthority(input);
  const actual=verifyReportExportConsistency(report,value);
  if(consistency.schemaVersion!==REPORT_CONSISTENCY_SCHEMA_VERSION||consistency.status!=='PASS'||consistency.executionAuthority!==false||consistency.reportPublicationAuthority!==false)throw new Error('Alpha read model requires a no-authority S14 PASS');
  if(consistency.reportId!==report.reportId||consistency.exportId!==value.exportId)throw new Error('Alpha read model consistency parent mismatch');
  if(actual.status!=='PASS')throw new Error(`Alpha read model parent integrity failure: ${actual.issues.join(',')}`);
  const core={schemaVersion:ALPHA_READ_MODEL_SCHEMA_VERSION,projectionId:text(input.projectionId,'projectionId'),reportId:report.reportId,seriesId:report.seriesId,reportVersion:report.version,asOf:report.asOf,reportContentFingerprint:report.contentFingerprint,exportId:value.exportId,exportFingerprint:value.exportFingerprint,title:report.title,summary:report.summary,thesis:report.thesis,scenarios:report.scenarios,citationEvidenceIds:Object.freeze([...report.citationEvidenceIds]),unresolvedDisagreements:Object.freeze([...report.unresolvedDisagreements]),dataGaps:Object.freeze([...report.dataGaps])};
  return Object.freeze({...core,contentFingerprint:fingerprint(core),executionAuthority:false,reportPublicationAuthority:false,botDependency:false});
}
