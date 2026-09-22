import { readFileSync } from 'node:fs';

import { isValidAlphaReadModel } from './alphaReadApi.js';
import type { AlphaReadModel } from './alphaReadModel.js';
import type { AlphaReadModelResolver } from './httpRuntime.js';

export const BOR_ALPHA_READ_MODEL_PATH_ENV = 'BOR_ALPHA_READ_MODEL_PATH' as const;

function freezeModel(value: AlphaReadModel): Readonly<AlphaReadModel> {
  return Object.freeze(value);
}

export function createFileAlphaReadModelResolver(
  env: NodeJS.ProcessEnv = process.env,
): AlphaReadModelResolver {
  const configuredPath = env[BOR_ALPHA_READ_MODEL_PATH_ENV]?.trim();

  return () => {
    if (!configuredPath) return undefined;

    let raw: string;
    try {
      raw = readFileSync(configuredPath, 'utf8');
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return undefined;
      return undefined;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return undefined;
    }

    if (!parsed || typeof parsed !== 'object') return undefined;
    const model = parsed as AlphaReadModel;
    if (!isValidAlphaReadModel(model)) return undefined;
    return freezeModel(model);
  };
}
