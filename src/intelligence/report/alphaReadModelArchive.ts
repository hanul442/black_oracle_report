import { createHash } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';

import { isValidAlphaReadModel } from './alphaReadApi.js';
import type { AlphaReadModel } from './alphaReadModel.js';

let archiveTempSequence = 0;

function cleanup(path: string): void {
  try { unlinkSync(path); } catch { /* best-effort cleanup */ }
}

function assertSafeIdentity(value: string, field: string): void {
  if (!value || value === '.' || value === '..' || /[\\/\0]/.test(value)) {
    throw new Error(`BOR Alpha archive ${field} is unsafe`);
  }
}

function archiveIdFor(model: Readonly<AlphaReadModel>): string {
  assertSafeIdentity(model.projectionId, 'projectionId');
  assertSafeIdentity(model.reportId, 'reportId');
  assertSafeIdentity(model.seriesId, 'seriesId');
  const identity = {
    projectionId: model.projectionId,
    reportId: model.reportId,
    seriesId: model.seriesId,
    reportVersion: model.reportVersion,
    contentFingerprint: model.contentFingerprint,
  };
  return createHash('sha256').update(JSON.stringify(identity), 'utf8').digest('hex');
}

export interface AlphaReadModelArchiveResult {
  archiveId: string;
  path: string;
  contentFingerprint: string;
  bytes: number;
  created: boolean;
  immutable: true;
  executionAuthority: false;
  reportPublicationAuthority: false;
  botDependency: false;
}

export function archiveAlphaReadModel(
  model: Readonly<AlphaReadModel>,
  archiveRoot: string,
): Readonly<AlphaReadModelArchiveResult> {
  if (!archiveRoot.trim()) throw new Error('BOR Alpha archive root is required');
  if (!isValidAlphaReadModel(model)) {
    throw new Error('BOR Alpha archive requires a canonical integrity/no-authority model');
  }

  const root = resolve(archiveRoot);
  mkdirSync(root, { recursive: true, mode: 0o700 });
  const archiveId = archiveIdFor(model);
  const target = resolve(root, `${archiveId}.json`);
  const payload = `${JSON.stringify(model)}\n`;

  if (existsSync(target)) {
    const existing = readFileSync(target, 'utf8');
    if (existing !== payload) throw new Error('BOR Alpha archive collision or tamper detected');
    return Object.freeze({ archiveId, path: target, contentFingerprint: model.contentFingerprint, bytes: Buffer.byteLength(payload, 'utf8'), created: false, immutable: true, executionAuthority: false, reportPublicationAuthority: false, botDependency: false });
  }

  const temporary = `${target}.tmp-${process.pid}-${archiveTempSequence++}`;
  let descriptor: number | null = null;
  try {
    descriptor = openSync(temporary, 'wx', 0o600);
    writeFileSync(descriptor, payload, 'utf8');
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    linkSync(temporary, target);
    unlinkSync(temporary);
  } catch (error) {
    if (descriptor !== null) {
      try { closeSync(descriptor); } catch { /* already closed */ }
    }
    cleanup(temporary);
    if (existsSync(target) && readFileSync(target, 'utf8') === payload) {
      return Object.freeze({ archiveId, path: target, contentFingerprint: model.contentFingerprint, bytes: Buffer.byteLength(payload, 'utf8'), created: false, immutable: true, executionAuthority: false, reportPublicationAuthority: false, botDependency: false });
    }
    throw error;
  }

  return Object.freeze({ archiveId, path: target, contentFingerprint: model.contentFingerprint, bytes: Buffer.byteLength(payload, 'utf8'), created: true, immutable: true, executionAuthority: false, reportPublicationAuthority: false, botDependency: false });
}
