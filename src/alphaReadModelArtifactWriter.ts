import {
  closeSync,
  fsyncSync,
  openSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';

import { isValidAlphaReadModel } from './alphaReadApi.js';
import type { AlphaReadModel } from './alphaReadModel.js';

let tempSequence = 0;

function cleanup(path: string): void {
  try { unlinkSync(path); } catch { /* best-effort cleanup */ }
}

export interface AlphaReadModelArtifactWriteResult {
  path: string;
  contentFingerprint: string;
  bytes: number;
  atomicReplace: true;
  executionAuthority: false;
  reportPublicationAuthority: false;
  botDependency: false;
}

export function persistAlphaReadModelArtifact(
  model: Readonly<AlphaReadModel>,
  configuredPath: string,
): Readonly<AlphaReadModelArtifactWriteResult> {
  if (!configuredPath.trim()) throw new Error('BOR Alpha read model artifact path is required');
  if (!isValidAlphaReadModel(model)) {
    throw new Error('BOR Alpha read model artifact must pass the canonical integrity/no-authority gate before persistence');
  }

  const target = resolve(configuredPath);
  const payload = `${JSON.stringify(model)}\n`;
  const sequence = tempSequence++;
  const temporary = `${target}.tmp-${process.pid}-${sequence}`;
  let descriptor: number | null = null;

  try {
    descriptor = openSync(temporary, 'wx', 0o600);
    writeFileSync(descriptor, payload, 'utf8');
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    renameSync(temporary, target);
  } catch (error) {
    if (descriptor !== null) {
      try { closeSync(descriptor); } catch { /* already closed */ }
    }
    cleanup(temporary);
    throw error;
  }

  return Object.freeze({
    path: target,
    contentFingerprint: model.contentFingerprint,
    bytes: Buffer.byteLength(payload, 'utf8'),
    atomicReplace: true,
    executionAuthority: false,
    reportPublicationAuthority: false,
    botDependency: false,
  });
}

export function persistConfiguredAlphaReadModelArtifact(
  model: Readonly<AlphaReadModel>,
  env: NodeJS.ProcessEnv = process.env,
): Readonly<AlphaReadModelArtifactWriteResult> {
  const configuredPath = env.BOR_ALPHA_READ_MODEL_PATH?.trim();
  if (!configuredPath) throw new Error('BOR_ALPHA_READ_MODEL_PATH is required for artifact persistence');
  return persistAlphaReadModelArtifact(model, configuredPath);
}
