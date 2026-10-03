// Read-only access to nars_intel_outbox through Supabase REST.
// BOR reads by created_at cursor and never changes delivery status; marking a
// row as sent is the job of whichever consumer owns delivery.

import type { NarsOutboxRow } from './narsEvidencePacket.js';

export const NARS_OUTBOX_TABLE = 'nars_intel_outbox' as const;
export const NARS_OUTBOX_DESTINATION = 'black_oracle' as const;
const MAX_PAGE = 500;

/** Position after the last row read; (created_at, id) so equal timestamps are never skipped. */
export interface NarsOutboxCursor {
  createdAt: string;
  id: string;
}

export interface NarsOutboxPage {
  rows: NarsOutboxRow[];
  /** Pass back as `after` to continue; null when the page was empty. */
  nextCursor: NarsOutboxCursor | null;
}

export interface NarsOutboxReaderConfig {
  baseUrl: string;
  serviceRoleKey: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export class SupabaseNarsOutboxReader {
  readonly #base: string;
  readonly #headers: Record<string, string>;
  readonly #fetch: typeof fetch;

  constructor(private readonly config: NarsOutboxReaderConfig) {
    if (!config.baseUrl.trim() || !config.serviceRoleKey.trim()) throw new Error('SUPABASE_CONFIG_REQUIRED');
    this.#base = config.baseUrl.replace(/\/+$/, '');
    this.#headers = { apikey: config.serviceRoleKey, Authorization: `Bearer ${config.serviceRoleKey}`, Accept: 'application/json' };
    this.#fetch = config.fetch ?? fetch;
  }

  /** Rows strictly after the cursor in (created_at, id) order, oldest first. */
  async readPage(options: { after?: NarsOutboxCursor | null; limit?: number } = {}): Promise<NarsOutboxPage> {
    const url = new URL(`${this.#base}/rest/v1/${NARS_OUTBOX_TABLE}`);
    url.searchParams.set('select', 'id,created_at,payload');
    url.searchParams.set('destination', `eq.${NARS_OUTBOX_DESTINATION}`);
    url.searchParams.set('order', 'created_at.asc,id.asc');
    url.searchParams.set('limit', String(Math.max(1, Math.min(MAX_PAGE, Math.trunc(options.limit ?? 100) || 1))));
    if (options.after) {
      const { createdAt, id } = options.after;
      if (!Number.isFinite(Date.parse(createdAt)) || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('INVALID_CURSOR');
      url.searchParams.set('or', `(created_at.gt.${createdAt},and(created_at.eq.${createdAt},id.gt.${id}))`);
    }
    const response = await this.#fetch(url, {
      headers: this.#headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 15_000),
    });
    if (!response.ok) throw new Error(`NARS_OUTBOX_READ_FAILED:${response.status}:${(await response.text()).slice(0, 500)}`);
    const body = (await response.json()) as unknown;
    if (!Array.isArray(body)) throw new Error('NARS_OUTBOX_READ_NOT_ARRAY');
    const rows = body.map((item): NarsOutboxRow => {
      const row = (item ?? {}) as Record<string, unknown>;
      return { id: String(row.id ?? ''), created_at: String(row.created_at ?? ''), payload: row.payload };
    });
    const last = rows.at(-1);
    return { rows, nextCursor: last ? { createdAt: last.created_at, id: last.id } : null };
  }
}
