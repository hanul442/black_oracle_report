import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Domain dependency rules from docs/NORTH_STAR.md §4.
// A domain may import only itself and the domains listed here.
const ALLOWED_DEPENDENCIES: Record<string, readonly string[]> = {
  foundation: [],
  intelligence: ['foundation'],
  strategy: ['foundation', 'intelligence'],
  risk: ['foundation'],
  paper: ['foundation', 'risk'],
  evaluation: ['foundation', 'intelligence', 'strategy'],
  runtime: ['foundation', 'intelligence', 'strategy', 'risk', 'paper', 'evaluation'],
};

// Compiled tests run from dist/; read the TypeScript sources instead.
const SRC_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const IMPORT_PATTERN = /(?:from\s+|import\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g;

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(path);
    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

function domainOf(file: string): string | undefined {
  const parts = relative(SRC_ROOT, file).split(sep);
  return parts.length > 1 ? parts[0] : undefined;
}

test('every source file lives in a known domain folder', () => {
  const misplaced = listSourceFiles(SRC_ROOT)
    .filter((file) => !file.endsWith('architecture.test.ts'))
    .filter((file) => {
      const domain = domainOf(file);
      return domain === undefined || !(domain in ALLOWED_DEPENDENCIES);
    })
    .map((file) => relative(SRC_ROOT, file));
  assert.deepEqual(misplaced, []);
});

test('domains import only their allowed dependencies', () => {
  const violations: string[] = [];
  for (const file of listSourceFiles(SRC_ROOT)) {
    const from = domainOf(file);
    if (from === undefined) continue;
    for (const match of readFileSync(file, 'utf8').matchAll(IMPORT_PATTERN)) {
      const specifier = match[1]!;
      const to = domainOf(resolve(dirname(file), specifier));
      if (to === undefined || to === from) continue;
      if (!ALLOWED_DEPENDENCIES[from]?.includes(to)) {
        violations.push(`${relative(SRC_ROOT, file)} -> ${specifier} (${from} -> ${to})`);
      }
    }
  }
  assert.deepEqual(violations, []);
});
