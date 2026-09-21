import type { AnalystReview, ResearchBundle } from './researchPipeline.js';

export const SPECIALIST_REVIEW_SCHEMA_VERSION = 'bor.specialist-review.v1' as const;
export const RED_TEAM_CHALLENGE_SCHEMA_VERSION = 'bor.red-team-challenge.v1' as const;
export const RESEARCH_COUNCIL_SCHEMA_VERSION = 'bor.research-council.v1' as const;

export type CouncilStance = AnalystReview['stance'];

interface NoAuthority { executionAuthority?: boolean; reportPublicationAuthority?: boolean }
interface VersionedActor { actorId: string; role: string; domain: string; methodVersion: string; promptVersion: string }

export interface SpecialistReviewInput extends NoAuthority {
  reviewId: string; analystReviewId: string; actor: VersionedActor; asOf: string; stance: CouncilStance;
  confidence: number | null; assessment: string; evidenceIds: readonly string[]; dataGaps?: readonly string[];
}
export interface SpecialistReview extends Omit<SpecialistReviewInput, 'executionAuthority'|'reportPublicationAuthority'> {
  schemaVersion: typeof SPECIALIST_REVIEW_SCHEMA_VERSION; executionAuthority: false; reportPublicationAuthority: false;
}
export interface RedTeamChallengeInput extends NoAuthority {
  challengeId: string; analystReviewId: string; actor: VersionedActor; asOf: string; strongestCounterargument: string;
  contradictingEvidenceIds: readonly string[]; unresolvedQuestions: readonly string[]; invalidationConditions: readonly string[];
}
export interface RedTeamChallenge extends Omit<RedTeamChallengeInput, 'executionAuthority'|'reportPublicationAuthority'> {
  schemaVersion: typeof RED_TEAM_CHALLENGE_SCHEMA_VERSION; executionAuthority: false; reportPublicationAuthority: false;
}
export interface ResearchCouncilInput extends NoAuthority {
  councilId: string; analystReviewId: string; asOf: string; methodVersion: string; promptVersion: string;
  specialistReviews: readonly SpecialistReview[]; redTeamChallenges: readonly RedTeamChallenge[]; stance: CouncilStance;
  confidence: number | null; synthesis: string; unresolvedDisagreements: readonly string[]; dataGaps?: readonly string[];
}
export interface ResearchCouncilDecision extends Omit<ResearchCouncilInput, 'executionAuthority'|'reportPublicationAuthority'|'dataGaps'> {
  schemaVersion: typeof RESEARCH_COUNCIL_SCHEMA_VERSION;
  dataGaps: readonly string[];
  executionAuthority: false;
  reportPublicationAuthority: false;
}

function text(v:string, f:string){ const n=v.trim(); if(!n) throw new Error(`${f} is required`); return n; }
function time(v:string,f:string){ const n=Date.parse(v); if(!Number.isFinite(n)) throw new Error(`${f} must be an ISO timestamp`); return n; }
function noAuthority(v:NoAuthority){ if(v.executionAuthority||v.reportPublicationAuthority) throw new Error('evaluation artifacts cannot grant execution or report-publication authority'); }
function confidence(v:number|null){ if(v!==null&&(!Number.isFinite(v)||v<0||v>1)) throw new Error('confidence must be null or between 0 and 1'); }
function unique(values:readonly string[], field:string){ const a=values.map((v,i)=>text(v,`${field}[${i}]`)); if(new Set(a).size!==a.length) throw new Error(`${field} must be unique`); return Object.freeze(a); }
function actor(a:VersionedActor):Readonly<VersionedActor>{ return Object.freeze({actorId:text(a.actorId,'actorId'),role:text(a.role,'role'),domain:text(a.domain,'domain'),methodVersion:text(a.methodVersion,'methodVersion'),promptVersion:text(a.promptVersion,'promptVersion')}); }
function evidenceIds(bundle:ResearchBundle, ids:readonly string[], field:string){ const byId=new Map(bundle.evidence.map(e=>[e.evidenceId,e])); const out=unique(ids,field); for(const id of out){ const e=byId.get(id); if(!e) throw new Error(`${field} references Evidence outside the research bundle: ${id}`); if(!e.materialVerified) throw new Error(`${field} cannot cite Evidence without verified canonical material: ${id}`); } return out; }
function assertUpstream(review:AnalystReview,bundle:ResearchBundle){ if(review.bundleId!==bundle.bundleId) throw new Error('analyst review does not belong to research bundle'); }

export function createSpecialistReview(bundle:ResearchBundle, review:AnalystReview, input:SpecialistReviewInput):Readonly<SpecialistReview>{
  noAuthority(input); assertUpstream(review,bundle); if(text(input.analystReviewId,'analystReviewId')!==review.reviewId) throw new Error('specialist analystReviewId mismatch');
  const t=time(input.asOf,'asOf'); if(t<Date.parse(review.asOf)) throw new Error('specialist asOf cannot precede analyst review'); confidence(input.confidence);
  return Object.freeze({...input,schemaVersion:SPECIALIST_REVIEW_SCHEMA_VERSION,reviewId:text(input.reviewId,'reviewId'),analystReviewId:review.reviewId,actor:actor(input.actor),asOf:new Date(t).toISOString(),assessment:text(input.assessment,'assessment'),evidenceIds:evidenceIds(bundle,input.evidenceIds,'evidenceIds'),dataGaps:unique(input.dataGaps??[],'dataGaps'),executionAuthority:false,reportPublicationAuthority:false});
}

export function createRedTeamChallenge(bundle:ResearchBundle, review:AnalystReview, input:RedTeamChallengeInput):Readonly<RedTeamChallenge>{
  noAuthority(input); assertUpstream(review,bundle); if(text(input.analystReviewId,'analystReviewId')!==review.reviewId) throw new Error('red-team analystReviewId mismatch');
  const t=time(input.asOf,'asOf'); if(t<Date.parse(review.asOf)) throw new Error('red-team asOf cannot precede analyst review');
  const ids=evidenceIds(bundle,input.contradictingEvidenceIds,'contradictingEvidenceIds'); const byId=new Map(bundle.evidence.map(e=>[e.evidenceId,e]));
  for(const id of ids) if(byId.get(id)?.disposition!=='CONTRADICTING') throw new Error(`red-team Evidence must be CONTRADICTING: ${id}`);
  return Object.freeze({...input,schemaVersion:RED_TEAM_CHALLENGE_SCHEMA_VERSION,challengeId:text(input.challengeId,'challengeId'),analystReviewId:review.reviewId,actor:actor(input.actor),asOf:new Date(t).toISOString(),strongestCounterargument:text(input.strongestCounterargument,'strongestCounterargument'),contradictingEvidenceIds:ids,unresolvedQuestions:unique(input.unresolvedQuestions,'unresolvedQuestions'),invalidationConditions:unique(input.invalidationConditions,'invalidationConditions'),executionAuthority:false,reportPublicationAuthority:false});
}

export function createResearchCouncilDecision(review:AnalystReview,input:ResearchCouncilInput):Readonly<ResearchCouncilDecision>{
  noAuthority(input); if(text(input.analystReviewId,'analystReviewId')!==review.reviewId) throw new Error('council analystReviewId mismatch'); const t=time(input.asOf,'asOf'); if(t<Date.parse(review.asOf)) throw new Error('council asOf cannot precede analyst review'); confidence(input.confidence);
  const srIds=input.specialistReviews.map(x=>x.reviewId), rtIds=input.redTeamChallenges.map(x=>x.challengeId); unique(srIds,'specialist review IDs'); unique(rtIds,'red-team challenge IDs');
  for(const x of input.specialistReviews) {
    if(x.schemaVersion!==SPECIALIST_REVIEW_SCHEMA_VERSION||x.executionAuthority!==false||x.reportPublicationAuthority!==false) throw new Error('council specialist artifact authority/schema mismatch');
    if(x.analystReviewId!==review.reviewId||Date.parse(x.asOf)>t) throw new Error('council specialist lineage/chronology mismatch');
  }
  for(const x of input.redTeamChallenges) {
    if(x.schemaVersion!==RED_TEAM_CHALLENGE_SCHEMA_VERSION||x.executionAuthority!==false||x.reportPublicationAuthority!==false) throw new Error('council red-team artifact authority/schema mismatch');
    if(x.analystReviewId!==review.reviewId||Date.parse(x.asOf)>t) throw new Error('council red-team lineage/chronology mismatch');
  }
  if(input.specialistReviews.length===0&&input.redTeamChallenges.length===0&&input.stance!=='INSUFFICIENT_DATA') throw new Error('empty council must return INSUFFICIENT_DATA');
  const gaps=unique([...review.dataGaps,...input.specialistReviews.flatMap(x=>x.dataGaps??[]),...(input.dataGaps??[])],'dataGaps');
  return Object.freeze({...input,schemaVersion:RESEARCH_COUNCIL_SCHEMA_VERSION,councilId:text(input.councilId,'councilId'),analystReviewId:review.reviewId,asOf:new Date(t).toISOString(),methodVersion:text(input.methodVersion,'methodVersion'),promptVersion:text(input.promptVersion,'promptVersion'),synthesis:text(input.synthesis,'synthesis'),unresolvedDisagreements:unique(input.unresolvedDisagreements,'unresolvedDisagreements'),dataGaps:gaps,executionAuthority:false,reportPublicationAuthority:false});
}
