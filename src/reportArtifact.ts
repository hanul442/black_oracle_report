import { createHash } from 'node:crypto';
import type { ResearchBundle } from './researchPipeline.js';
import type { ResearchCouncilDecision } from './researchCouncil.js';
import { THESIS_SCENARIO_SCHEMA_VERSION, type ThesisScenarioArtifact } from './thesisScenario.js';

export const REPORT_ARTIFACT_SCHEMA_VERSION = 'bor.report-artifact.v1' as const;
interface NoAuthority { executionAuthority?: boolean; reportPublicationAuthority?: boolean }
export interface ReportArtifactInput extends NoAuthority { reportId:string; seriesId:string; version:number; asOf:string; title:string; summary:string; }
export interface ReportArtifact extends Omit<ReportArtifactInput,'executionAuthority'|'reportPublicationAuthority'> {
  schemaVersion:typeof REPORT_ARTIFACT_SCHEMA_VERSION; bundleId:string; analystReviewId:string; councilId:string; thesisArtifactId:string;
  thesis:string; scenarios:ThesisScenarioArtifact['scenarios']; citationEvidenceIds:readonly string[]; unresolvedDisagreements:readonly string[]; dataGaps:readonly string[];
  contentFingerprint:string; executionAuthority:false; reportPublicationAuthority:false;
}
function text(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} is required`);return n;}
function time(v:string,f:string){const n=Date.parse(v);if(!Number.isFinite(n))throw new Error(`${f} must be an ISO timestamp`);return n;}
function noAuthority(v:NoAuthority){if(v.executionAuthority||v.reportPublicationAuthority)throw new Error('report artifact cannot grant execution or report-publication authority');}
function fingerprint(payload:unknown){return createHash('sha256').update(JSON.stringify(payload),'utf8').digest('hex');}

export function createReportArtifact(bundle:ResearchBundle,council:ResearchCouncilDecision,thesis:ThesisScenarioArtifact,input:ReportArtifactInput):Readonly<ReportArtifact>{
  noAuthority(input);
  if(thesis.schemaVersion!==THESIS_SCENARIO_SCHEMA_VERSION||thesis.bundleId!==bundle.bundleId||thesis.councilId!==council.councilId||thesis.analystReviewId!==council.analystReviewId)throw new Error('report upstream lineage mismatch');
  if(thesis.executionAuthority!==false||thesis.reportPublicationAuthority!==false||council.executionAuthority!==false||council.reportPublicationAuthority!==false)throw new Error('upstream authority mismatch');
  const asOf=time(input.asOf,'asOf');if(asOf<Date.parse(thesis.asOf))throw new Error('report asOf cannot precede thesis');
  if(!Number.isInteger(input.version)||input.version<1)throw new Error('report version must be a positive integer');
  const citations=Object.freeze([...new Set(thesis.scenarios.flatMap(s=>[...s.evidenceIds,...s.contradictingEvidenceIds]))].sort());
  const byId=new Map(bundle.evidence.map(e=>[e.evidenceId,e]));for(const id of citations){const e=byId.get(id);if(!e||!e.materialVerified)throw new Error(`report citation integrity failure: ${id}`);}
  const core={schemaVersion:REPORT_ARTIFACT_SCHEMA_VERSION,reportId:text(input.reportId,'reportId'),seriesId:text(input.seriesId,'seriesId'),version:input.version,asOf:new Date(asOf).toISOString(),title:text(input.title,'title'),summary:text(input.summary,'summary'),bundleId:bundle.bundleId,analystReviewId:thesis.analystReviewId,councilId:council.councilId,thesisArtifactId:thesis.artifactId,thesis:thesis.thesis,scenarios:thesis.scenarios,citationEvidenceIds:citations,unresolvedDisagreements:Object.freeze([...thesis.unresolvedDisagreements]),dataGaps:Object.freeze([...thesis.dataGaps])};
  return Object.freeze({...core,contentFingerprint:fingerprint(core),executionAuthority:false,reportPublicationAuthority:false});
}

export class ReportArchive {
  readonly #byId=new Map<string,Readonly<ReportArtifact>>(); readonly #series=new Map<string,Readonly<ReportArtifact>[]>();
  append(report:Readonly<ReportArtifact>){
    if(report.schemaVersion!==REPORT_ARTIFACT_SCHEMA_VERSION||report.executionAuthority!==false||report.reportPublicationAuthority!==false)throw new Error('invalid report artifact');
    if(this.#byId.has(report.reportId))throw new Error('report artifact ID already archived');
    const {contentFingerprint,...rest}=report;if(fingerprint(rest)!==contentFingerprint)throw new Error('report content fingerprint mismatch');
    const versions=this.#series.get(report.seriesId)??[];const prev=versions.at(-1);if(prev&&(report.version<=prev.version||Date.parse(report.asOf)<=Date.parse(prev.asOf)))throw new Error('report series version/asOf must increase monotonically');
    this.#byId.set(report.reportId,report);this.#series.set(report.seriesId,[...versions,report]);return report;
  }
  get(reportId:string){return this.#byId.get(reportId);}
  listSeries(seriesId:string):readonly Readonly<ReportArtifact>[] {return Object.freeze([...(this.#series.get(seriesId)??[])]);}
}
