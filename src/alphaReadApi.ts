import { createHash } from 'node:crypto';
import { ALPHA_READ_MODEL_SCHEMA_VERSION, type AlphaReadModel } from './alphaReadModel.js';

export const ALPHA_READ_API_SCHEMA_VERSION = 'bor.alpha-read-api.v1' as const;
export interface AlphaReadApiResponse { statusCode: 200|404|405|409; body: Readonly<Record<string, unknown>>; }

function hash(value:unknown){return createHash('sha256').update(JSON.stringify(value),'utf8').digest('hex');}

export function isValidAlphaReadModel(model:Readonly<AlphaReadModel>):boolean {
  if(model.schemaVersion!==ALPHA_READ_MODEL_SCHEMA_VERSION) return false;
  if(model.executionAuthority!==false||model.reportPublicationAuthority!==false||model.botDependency!==false) return false;
  const {contentFingerprint,executionAuthority:_e,reportPublicationAuthority:_p,botDependency:_b,...core}=model;
  return hash(core)===contentFingerprint;
}

export function getAlphaReadApiResponse(method:string,model?:Readonly<AlphaReadModel>):AlphaReadApiResponse {
  const fixed={schemaVersion:ALPHA_READ_API_SCHEMA_VERSION,executionAuthority:false,reportPublicationAuthority:false,botDependency:false} as const;
  if(method!=='GET') return Object.freeze({statusCode:405,body:Object.freeze({...fixed,ok:false,error:'METHOD_NOT_ALLOWED'})});
  if(!model) return Object.freeze({statusCode:404,body:Object.freeze({...fixed,ok:false,error:'ALPHA_READ_MODEL_UNAVAILABLE'})});
  if(!isValidAlphaReadModel(model)) return Object.freeze({statusCode:409,body:Object.freeze({...fixed,ok:false,error:'ALPHA_READ_MODEL_INTEGRITY_FAILURE'})});
  return Object.freeze({statusCode:200,body:Object.freeze({...fixed,ok:true,model})});
}
