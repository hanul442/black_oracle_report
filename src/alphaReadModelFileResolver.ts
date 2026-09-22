import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { AlphaReadModel } from './alphaReadModel.js';
import type { AlphaReadModelResolver } from './httpRuntime.js';

const invalidModel = (): Readonly<AlphaReadModel> => Object.freeze({} as AlphaReadModel);

export function createAlphaReadModelFileResolver(
  env: NodeJS.ProcessEnv = process.env,
): AlphaReadModelResolver {
  const configuredPath = env.BOR_ALPHA_READ_MODEL_PATH?.trim();
  if (!configuredPath) return () => undefined;

  const modelPath = resolve(configuredPath);

  return () => {
    let raw: string;
    try {
      raw = readFileSync(modelPath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return undefined;
      return invalidModel();
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return invalidModel();
      return Object.freeze(parsed as AlphaReadModel);
    } catch {
      return invalidModel();
    }
  };
}
