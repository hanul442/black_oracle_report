// NARS issuer name -> BOR canonical asset (North Star M2, decision D-3).
//
// The walking skeleton covers one asset, SK하이닉스. Only an explicit NARS
// ISSUER entity is resolved, and only by exact (normalized) alias match:
// a near miss stays UNRESOLVED rather than being guessed into an asset.

import type { AssetResolution } from '../evidence/evidence.js';

export interface NarsAssetAlias {
  canonicalAssetId: string;
  symbol: string;
  aliases: readonly string[];
}

export const NARS_ASSET_ALIASES: readonly NarsAssetAlias[] = [
  { canonicalAssetId: 'KRX:000660', symbol: '000660', aliases: ['SK하이닉스', '에스케이하이닉스', 'SK hynix', 'SK hynix Inc.'] },
];

/** Case, width, spacing, punctuation and corporate suffixes do not change an issuer. */
export function normalizeIssuerName(name: string): string {
  return name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\(주\)|㈜|주식회사|\binc\b\.?|\bco\.?,?\s*ltd\b\.?|\bcorp(oration)?\b\.?/g, '')
    .replace(/[\s.,·\-_()]/g, '');
}

export class NarsAssetResolver {
  readonly #byAlias = new Map<string, NarsAssetAlias>();

  constructor(entries: readonly NarsAssetAlias[] = NARS_ASSET_ALIASES) {
    for (const entry of entries) {
      for (const alias of entry.aliases) {
        const key = normalizeIssuerName(alias);
        const existing = this.#byAlias.get(key);
        if (!key) throw new Error('EMPTY_ASSET_ALIAS');
        if (existing && existing.canonicalAssetId !== entry.canonicalAssetId) throw new Error(`AMBIGUOUS_ASSET_ALIAS:${alias}`);
        this.#byAlias.set(key, entry);
      }
    }
  }

  /**
   * Resolves an ISSUER entity name. Without one the packet stays unresolved
   * and `fallbackQuery` (the event title) is kept for a later resolver.
   */
  resolve(issuerName: string | null, fallbackQuery: string): AssetResolution {
    if (issuerName === null) return { status: 'UNRESOLVED', query: fallbackQuery, reason: 'NARS_NO_ISSUER_ENTITY' };
    const entry = this.#byAlias.get(normalizeIssuerName(issuerName));
    return entry
      ? { status: 'RESOLVED', canonicalAssetId: entry.canonicalAssetId, symbol: entry.symbol }
      : { status: 'UNRESOLVED', query: issuerName, reason: 'NARS_ISSUER_NOT_IN_SKELETON' };
  }
}
