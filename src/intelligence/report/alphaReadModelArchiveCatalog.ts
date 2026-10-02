import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { isValidAlphaReadModel } from './alphaReadApi.js';
import type { AlphaReadModel } from './alphaReadModel.js';

export type ArchiveCatalogRejectionReason = 'UNSAFE_ENTRY'|'NOT_REGULAR_FILE'|'MALFORMED_JSON'|'INTEGRITY_OR_AUTHORITY_FAILURE'|'ARCHIVE_ID_MISMATCH';
export interface AlphaReadModelArchiveCatalogEntry { archiveId:string; projectionId:string; reportId:string; seriesId:string; reportVersion:number; asOf:string; contentFingerprint:string; citationCount:number; scenarioCount:number; unresolvedDisagreementCount:number; dataGapCount:number; executionAuthority:false; reportPublicationAuthority:false; botDependency:false; }
export interface AlphaReadModelArchiveCatalogRejection { entryName:string; reason:ArchiveCatalogRejectionReason; }
export interface AlphaReadModelArchiveCatalog { entries:readonly Readonly<AlphaReadModelArchiveCatalogEntry>[]; rejected:readonly Readonly<AlphaReadModelArchiveCatalogRejection>[]; executionAuthority:false; reportPublicationAuthority:false; botDependency:false; }

function archiveIdFor(model:Readonly<AlphaReadModel>):string { const identity={projectionId:model.projectionId,reportId:model.reportId,seriesId:model.seriesId,reportVersion:model.reportVersion,contentFingerprint:model.contentFingerprint}; return createHash('sha256').update(JSON.stringify(identity),'utf8').digest('hex'); }
function rejection(entryName:string,reason:ArchiveCatalogRejectionReason):Readonly<AlphaReadModelArchiveCatalogRejection>{return Object.freeze({entryName,reason});}

export function catalogAlphaReadModelArchive(archiveRoot:string):Readonly<AlphaReadModelArchiveCatalog>{
  if(!archiveRoot.trim()) throw new Error('BOR Alpha archive catalog root is required');
  const root=resolve(archiveRoot); const entries:AlphaReadModelArchiveCatalogEntry[]=[]; const rejected:AlphaReadModelArchiveCatalogRejection[]=[];
  for(const dirent of readdirSync(root,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    const name=dirent.name;
    if(!/^[a-f0-9]{64}\.json$/.test(name)){rejected.push(rejection(name,'UNSAFE_ENTRY'));continue;}
    const path=join(root,name); const stat=lstatSync(path);
    if(dirent.isSymbolicLink()||stat.isSymbolicLink()||!stat.isFile()){rejected.push(rejection(name,'NOT_REGULAR_FILE'));continue;}
    let parsed:unknown;
    try{parsed=JSON.parse(readFileSync(path,'utf8'));}catch{rejected.push(rejection(name,'MALFORMED_JSON'));continue;}
    if(parsed===null||typeof parsed!=='object'||Array.isArray(parsed)){rejected.push(rejection(name,'INTEGRITY_OR_AUTHORITY_FAILURE'));continue;}
    const model=parsed as AlphaReadModel;
    if(!isValidAlphaReadModel(model)){rejected.push(rejection(name,'INTEGRITY_OR_AUTHORITY_FAILURE'));continue;}
    const archiveId=name.slice(0,-5);
    if(archiveIdFor(model)!==archiveId){rejected.push(rejection(name,'ARCHIVE_ID_MISMATCH'));continue;}
    entries.push(Object.freeze({archiveId,projectionId:model.projectionId,reportId:model.reportId,seriesId:model.seriesId,reportVersion:model.reportVersion,asOf:model.asOf,contentFingerprint:model.contentFingerprint,citationCount:model.citationEvidenceIds.length,scenarioCount:model.scenarios.length,unresolvedDisagreementCount:model.unresolvedDisagreements.length,dataGapCount:model.dataGaps.length,executionAuthority:false,reportPublicationAuthority:false,botDependency:false}));
  }
  entries.sort((a,b)=>b.asOf.localeCompare(a.asOf)||b.reportVersion-a.reportVersion||a.archiveId.localeCompare(b.archiveId));
  return Object.freeze({entries:Object.freeze(entries),rejected:Object.freeze(rejected),executionAuthority:false,reportPublicationAuthority:false,botDependency:false});
}
