import type { AnalystReview, ResearchBundle } from './researchPipeline.js';
import { RESEARCH_COUNCIL_SCHEMA_VERSION, type ResearchCouncilDecision } from './researchCouncil.js';

export const THESIS_SCENARIO_SCHEMA_VERSION = 'bor.thesis-scenario.v1' as const;
export const SCENARIO_KINDS = ['BULL','BASE','BEAR'] as const;
export type ScenarioKind = typeof SCENARIO_KINDS[number];

interface NoAuthority { executionAuthority?: boolean; reportPublicationAuthority?: boolean }
export interface ScenarioInput {
  kind: ScenarioKind; narrative: string; evidenceIds: readonly string[]; contradictingEvidenceIds: readonly string[];
  catalysts: readonly string[]; risks: readonly string[]; invalidationConditions: readonly string[];
}
export interface ThesisScenarioInput extends NoAuthority {
  artifactId: string; bundleId: string; analystReviewId: string; councilId: string; asOf: string;
  methodVersion: string; thesis: string; scenarios: readonly ScenarioInput[]; dataGaps?: readonly string[];
}
export interface ThesisScenarioArtifact extends Omit<ThesisScenarioInput,'executionAuthority'|'reportPublicationAuthority'|'scenarios'|'dataGaps'> {
  schemaVersion: typeof THESIS_SCENARIO_SCHEMA_VERSION;
  scenarios: readonly Readonly<ScenarioInput>[]; unresolvedDisagreements: readonly string[]; dataGaps: readonly string[];
  executionAuthority: false; reportPublicationAuthority: false;
}
function text(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} is required`);return n;}
function time(v:string,f:string){const n=Date.parse(v);if(!Number.isFinite(n))throw new Error(`${f} must be an ISO timestamp`);return n;}
function unique(v:readonly string[],f:string){const a=v.map((x,i)=>text(x,`${f}[${i}]`));if(new Set(a).size!==a.length)throw new Error(`${f} must be unique`);return Object.freeze(a);}
function noAuthority(v:NoAuthority){if(v.executionAuthority||v.reportPublicationAuthority)throw new Error('thesis artifact cannot grant execution or report-publication authority');}
function citations(bundle:ResearchBundle,ids:readonly string[],field:string,contradicting=false){const out=unique(ids,field);const byId=new Map(bundle.evidence.map(e=>[e.evidenceId,e]));for(const id of out){const e=byId.get(id);if(!e)throw new Error(`${field} references Evidence outside the research bundle: ${id}`);if(!e.materialVerified)throw new Error(`${field} cannot cite Evidence without verified canonical material: ${id}`);if(contradicting&&e.disposition!=='CONTRADICTING')throw new Error(`${field} must cite CONTRADICTING Evidence: ${id}`);}return out;}

export function createThesisScenarioArtifact(bundle:ResearchBundle,review:AnalystReview,council:ResearchCouncilDecision,input:ThesisScenarioInput):Readonly<ThesisScenarioArtifact>{
  noAuthority(input);
  if(review.bundleId!==bundle.bundleId||input.bundleId!==bundle.bundleId)throw new Error('thesis bundle lineage mismatch');
  if(council.schemaVersion!==RESEARCH_COUNCIL_SCHEMA_VERSION||council.analystReviewId!==review.reviewId||input.analystReviewId!==review.reviewId||input.councilId!==council.councilId)throw new Error('thesis council/review lineage mismatch');
  if(council.executionAuthority!==false||council.reportPublicationAuthority!==false)throw new Error('upstream council authority mismatch');
  const t=time(input.asOf,'asOf');if(t<Date.parse(council.asOf))throw new Error('thesis asOf cannot precede council');
  if(input.scenarios.length!==3)throw new Error('thesis requires exactly three scenarios');
  const kinds=input.scenarios.map(s=>s.kind);if(new Set(kinds).size!==3||SCENARIO_KINDS.some(k=>!kinds.includes(k)))throw new Error('thesis requires exactly one BULL, BASE and BEAR scenario');
  if(council.stance==='INSUFFICIENT_DATA'&&input.thesis.trim())throw new Error('INSUFFICIENT_DATA council cannot produce a directional thesis');
  const scenarios=input.scenarios.map((s,i)=>Object.freeze({kind:s.kind,narrative:text(s.narrative,`scenarios[${i}].narrative`),evidenceIds:citations(bundle,s.evidenceIds,`scenarios[${i}].evidenceIds`),contradictingEvidenceIds:citations(bundle,s.contradictingEvidenceIds,`scenarios[${i}].contradictingEvidenceIds`,true),catalysts:unique(s.catalysts,`scenarios[${i}].catalysts`),risks:unique(s.risks,`scenarios[${i}].risks`),invalidationConditions:unique(s.invalidationConditions,`scenarios[${i}].invalidationConditions`)}));
  return Object.freeze({...input,schemaVersion:THESIS_SCENARIO_SCHEMA_VERSION,artifactId:text(input.artifactId,'artifactId'),bundleId:bundle.bundleId,analystReviewId:review.reviewId,councilId:council.councilId,asOf:new Date(t).toISOString(),methodVersion:text(input.methodVersion,'methodVersion'),thesis: council.stance==='INSUFFICIENT_DATA'?'':text(input.thesis,'thesis'),scenarios:Object.freeze(scenarios),unresolvedDisagreements:Object.freeze([...council.unresolvedDisagreements]),dataGaps:unique([...council.dataGaps,...(input.dataGaps??[])],'dataGaps'),executionAuthority:false,reportPublicationAuthority:false});
}
