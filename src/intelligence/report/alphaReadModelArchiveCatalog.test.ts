import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { ALPHA_READ_MODEL_SCHEMA_VERSION, type AlphaReadModel } from './alphaReadModel.js';
import { archiveAlphaReadModel } from './alphaReadModelArchive.js';
import { catalogAlphaReadModelArchive } from './alphaReadModelArchiveCatalog.js';

function model(version: number, asOf: string): AlphaReadModel {
  const core = {
    schemaVersion: ALPHA_READ_MODEL_SCHEMA_VERSION,
    projectionId: 'projection-1', reportId: `report-${version}`, seriesId: 'series-1', reportVersion: version,
    asOf, reportContentFingerprint: `report-fp-${version}`, exportId: `export-${version}`, exportFingerprint: `export-fp-${version}`,
    title: `BOR report ${version}`, summary: 'bounded', thesis: '',
    scenarios: [
      { kind:'BULL' as const, narrative:'up', evidenceIds:['e1'], contradictingEvidenceIds:[], catalysts:['c1'], risks:['r1'], invalidationConditions:['i1'] },
      { kind:'BASE' as const, narrative:'base', evidenceIds:['e1'], contradictingEvidenceIds:[], catalysts:[], risks:['r2'], invalidationConditions:['i2'] },
      { kind:'BEAR' as const, narrative:'down', evidenceIds:['e1'], contradictingEvidenceIds:['e2'], catalysts:[], risks:['r3'], invalidationConditions:['i3'] },
    ],
    citationEvidenceIds: ['e1','e2'], unresolvedDisagreements: ['d1'], dataGaps: ['g1'],
  };
  const contentFingerprint = createHash('sha256').update(JSON.stringify(core),'utf8').digest('hex');
  return { ...core, contentFingerprint, executionAuthority:false, reportPublicationAuthority:false, botDependency:false };
}

test('catalogs only verified archives newest-first without mutating bytes', () => {
  const dir=mkdtempSync(join(tmpdir(),'bor-s23-'));
  try {
    const older=archiveAlphaReadModel(model(1,'2026-09-21T05:00:00Z'),dir);
    const newer=archiveAlphaReadModel(model(2,'2026-09-22T05:00:00Z'),dir);
    const before=readFileSync(newer.path,'utf8');
    const catalog=catalogAlphaReadModelArchive(dir);
    assert.deepEqual(catalog.entries.map((entry)=>entry.reportVersion),[2,1]);
    assert.equal(catalog.entries[0]?.citationCount,2); assert.equal(catalog.entries[0]?.scenarioCount,3);
    assert.equal(catalog.entries[0]?.unresolvedDisagreementCount,1); assert.equal(catalog.entries[0]?.dataGapCount,1);
    assert.equal(catalog.executionAuthority,false); assert.equal(catalog.reportPublicationAuthority,false); assert.equal(catalog.botDependency,false);
    assert.equal(readFileSync(newer.path,'utf8'),before); assert.equal(readFileSync(older.path,'utf8').length>0,true);
    assert.deepEqual(catalogAlphaReadModelArchive(dir),catalog);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('rejects malformed, tampered, authority-escalated, identity-mismatched and unsafe entries', () => {
  const dir=mkdtempSync(join(tmpdir(),'bor-s23-'));
  try {
    const valid=archiveAlphaReadModel(model(1,'2026-09-22T05:00:00Z'),dir);
    const malformed='a'.repeat(64)+'.json'; writeFileSync(join(dir,malformed),'{','utf8');
    const escalated={...model(3,'2026-09-22T07:00:00Z'),executionAuthority:true};
    const escalatedName='b'.repeat(64)+'.json'; writeFileSync(join(dir,escalatedName),JSON.stringify(escalated),'utf8');
    const mismatch='c'.repeat(64)+'.json'; writeFileSync(join(dir,mismatch),readFileSync(valid.path,'utf8'),'utf8');
    writeFileSync(join(dir,'notes.txt'),'not an archive','utf8');
    const symlinkName='d'.repeat(64)+'.json'; symlinkSync(valid.path,join(dir,symlinkName));
    const tampered=JSON.parse(readFileSync(valid.path,'utf8')) as AlphaReadModel; tampered.summary='changed'; writeFileSync(valid.path,JSON.stringify(tampered),'utf8');

    const catalog=catalogAlphaReadModelArchive(dir);
    assert.equal(catalog.entries.length,0);
    assert.deepEqual(new Set(catalog.rejected.map((item)=>item.reason)),new Set(['MALFORMED_JSON','INTEGRITY_OR_AUTHORITY_FAILURE','ARCHIVE_ID_MISMATCH','UNSAFE_ENTRY','NOT_REGULAR_FILE']));
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
