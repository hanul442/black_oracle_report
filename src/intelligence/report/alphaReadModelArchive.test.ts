import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { ALPHA_READ_MODEL_SCHEMA_VERSION, type AlphaReadModel } from './alphaReadModel.js';
import { archiveAlphaReadModel } from './alphaReadModelArchive.js';

function model(overrides: Partial<AlphaReadModel> = {}): AlphaReadModel {
  const core = {
    schemaVersion: ALPHA_READ_MODEL_SCHEMA_VERSION,
    projectionId: 'projection-1', reportId: 'report-1', seriesId: 'series-1', reportVersion: 3,
    asOf: '2026-09-22T05:00:00Z', reportContentFingerprint: 'report-fp', exportId: 'export-1', exportFingerprint: 'export-fp',
    title: 'BOR report', summary: 'bounded', thesis: '',
    scenarios: [
      { kind:'BULL' as const, narrative:'up', evidenceIds:['e1'], contradictingEvidenceIds:[], catalysts:['c1'], risks:['r1'], invalidationConditions:['i1'] },
      { kind:'BASE' as const, narrative:'base', evidenceIds:['e1'], contradictingEvidenceIds:[], catalysts:[], risks:['r2'], invalidationConditions:['i2'] },
      { kind:'BEAR' as const, narrative:'down', evidenceIds:['e1'], contradictingEvidenceIds:['e2'], catalysts:[], risks:['r3'], invalidationConditions:['i3'] },
    ],
    citationEvidenceIds: ['e1','e2'], unresolvedDisagreements: ['d1'], dataGaps: ['g1'],
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => !['contentFingerprint','executionAuthority','reportPublicationAuthority','botDependency'].includes(key))),
  };
  const contentFingerprint = createHash('sha256').update(JSON.stringify(core),'utf8').digest('hex');
  return { ...core, contentFingerprint, executionAuthority:false, reportPublicationAuthority:false, botDependency:false } as AlphaReadModel;
}

test('archives canonical model exactly and replay is idempotent', () => {
  const dir=mkdtempSync(join(tmpdir(),'bor-s22-'));
  try {
    const value=model(); const first=archiveAlphaReadModel(value,dir); const disk=JSON.parse(readFileSync(first.path,'utf8'));
    assert.equal(first.created,true); assert.deepEqual(disk,value); assert.deepEqual(disk.citationEvidenceIds,['e1','e2']); assert.equal(disk.scenarios.length,3); assert.deepEqual(disk.unresolvedDisagreements,['d1']); assert.deepEqual(disk.dataGaps,['g1']); assert.equal(first.contentFingerprint,value.contentFingerprint); assert.equal(first.executionAuthority,false); assert.equal(first.reportPublicationAuthority,false); assert.equal(first.botDependency,false);
    const replay=archiveAlphaReadModel(value,dir); assert.equal(replay.archiveId,first.archiveId); assert.equal(replay.path,first.path); assert.equal(replay.created,false);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('fails closed on archive tamper/collision', () => {
  const dir=mkdtempSync(join(tmpdir(),'bor-s22-'));
  try { const value=model(); const first=archiveAlphaReadModel(value,dir); writeFileSync(first.path,'{"tampered":true}\n','utf8'); assert.throws(()=>archiveAlphaReadModel(value,dir),/collision or tamper/); }
  finally { rmSync(dir,{recursive:true,force:true}); }
});

test('rejects unsafe identity, invalid authority, and missing root', () => {
  const dir=mkdtempSync(join(tmpdir(),'bor-s22-'));
  try {
    assert.throws(()=>archiveAlphaReadModel(model({projectionId:'../escape'}),dir),/projectionId is unsafe/);
    const escalated={...model(),executionAuthority:true} as unknown as AlphaReadModel;
    assert.throws(()=>archiveAlphaReadModel(escalated,dir),/integrity\/no-authority/);
    assert.throws(()=>archiveAlphaReadModel(model(),'   '),/archive root is required/);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
