// Canonical event ledger: append-only store contract, row mapping and a
// Supabase REST adapter. Ported from BOT server/eventLedger.ts (North Star M1).
//
// Differences from the BOT original:
//   * an unparseable occurredAt is rejected instead of silently becoming "now";
//   * an over-long eventKey is rejected instead of truncated (it is the dedup key);
//   * market is stored uppercase, matching the uppercase read filter;
//   * the REST adapter takes its configuration and fetch as arguments, so
//     foundation never reads process.env.

import type { CanonicalEventInput, CanonicalEventRow, CanonicalEventType } from './canonicalEvent.js';

export const CANONICAL_EVENT_SCHEMA_VERSION = 1 as const;
export const CANONICAL_EVENT_TABLE = 'black_oracle_events' as const;
const MAX_READ_LIMIT = 500;
const MAX_EVENT_KEY_LENGTH = 500;

export interface CanonicalEventQuery {
  limit?: number;
  type?: CanonicalEventType | null;
  market?: string | null;
}

export interface CanonicalEventAppendResult {
  attempted: number;
  persisted: boolean;
}

/** Append-only. Re-appending an existing eventKey is ignored, never updated. */
export interface CanonicalEventLedger {
  append(events: readonly CanonicalEventInput[]): Promise<CanonicalEventAppendResult>;
  read(query?: CanonicalEventQuery): Promise<CanonicalEventRow[]>;
}

export interface CanonicalEventDbRow {
  event_key: string;
  occurred_at: string;
  runtime_id: string | null;
  event_type: CanonicalEventType;
  event_name: string;
  market: string | null;
  strategy_id: string | null;
  strategy_version: string | null;
  action: string | null;
  summary: string;
  reason: string | null;
  severity: CanonicalEventRow['severity'];
  authority: string;
  execution_authority: boolean;
  source: string;
  trace: Record<string, unknown>;
  links: Record<string, unknown>;
  schema_version: number;
}

function toIso(value: number | string): string {
  const ms = typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(ms)) throw new Error('INVALID_OCCURRED_AT');
  return new Date(ms).toISOString();
}

function clip(value: unknown, max: number): string {
  return String(value ?? '').slice(0, max);
}

function clipOrNull(value: string | null | undefined, max: number): string | null {
  return value ? clip(value, max) : null;
}

export function toCanonicalEventDbRow(event: CanonicalEventInput): CanonicalEventDbRow {
  if (!event.eventKey?.trim()) throw new Error('EMPTY_EVENT_KEY');
  // The key is the idempotency identity; truncating it could merge two events.
  if (event.eventKey.length > MAX_EVENT_KEY_LENGTH) throw new Error('EVENT_KEY_TOO_LONG');
  return {
    event_key: event.eventKey,
    occurred_at: toIso(event.occurredAt),
    runtime_id: clipOrNull(event.runtimeId, 200),
    event_type: event.eventType,
    event_name: clip(event.eventName, 120),
    // Stored uppercase so the uppercase market filter on read always matches.
    market: event.market ? clip(event.market.toUpperCase(), 120) : null,
    strategy_id: clipOrNull(event.strategyId, 300),
    strategy_version: clipOrNull(event.strategyVersion, 200),
    action: clipOrNull(event.action, 80),
    summary: clip(event.summary, 2_000),
    reason: clipOrNull(event.reason, 4_000),
    severity: event.severity ?? 'INFO',
    authority: clip(event.authority ?? 'observed', 120),
    execution_authority: Boolean(event.executionAuthority),
    source: clip(event.source, 160),
    trace: event.trace ?? {},
    links: event.links ?? {},
    schema_version: CANONICAL_EVENT_SCHEMA_VERSION,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringOrNull(value: unknown): string | null {
  return value == null ? null : String(value);
}

export function fromCanonicalEventDbRow(row: Record<string, unknown>): CanonicalEventRow {
  return {
    id: String(row.id ?? ''),
    eventKey: String(row.event_key ?? ''),
    occurredAt: row.occurred_at ? Date.parse(String(row.occurred_at)) : 0,
    recordedAt: row.recorded_at ? Date.parse(String(row.recorded_at)) : 0,
    runtimeId: stringOrNull(row.runtime_id),
    eventType: String(row.event_type ?? 'SYSTEM') as CanonicalEventType,
    eventName: String(row.event_name ?? ''),
    market: stringOrNull(row.market),
    strategyId: stringOrNull(row.strategy_id),
    strategyVersion: stringOrNull(row.strategy_version),
    action: stringOrNull(row.action),
    summary: String(row.summary ?? ''),
    reason: stringOrNull(row.reason),
    severity: String(row.severity ?? 'INFO') as CanonicalEventRow['severity'],
    authority: String(row.authority ?? 'observed'),
    executionAuthority: Boolean(row.execution_authority),
    source: String(row.source ?? ''),
    trace: isObject(row.trace) ? row.trace : {},
    links: isObject(row.links) ? row.links : {},
    schemaVersion: Number(row.schema_version ?? CANONICAL_EVENT_SCHEMA_VERSION),
  };
}

function clampLimit(limit: number | undefined): number {
  return Math.max(1, Math.min(MAX_READ_LIMIT, Math.trunc(Number(limit ?? 200)) || 1));
}

/** Deterministic reference implementation with the same semantics as the database. */
export class InMemoryCanonicalEventLedger implements CanonicalEventLedger {
  readonly #rows = new Map<string, CanonicalEventRow>();
  #sequence = 0;

  constructor(private readonly clock: () => number = () => Date.now()) {}

  async append(events: readonly CanonicalEventInput[]): Promise<CanonicalEventAppendResult> {
    const rows = events.map(toCanonicalEventDbRow);
    const recordedAt = this.clock();
    for (const row of rows) {
      if (this.#rows.has(row.event_key)) continue;
      this.#sequence += 1;
      this.#rows.set(row.event_key, Object.freeze(fromCanonicalEventDbRow({
        ...row, id: `mem-${this.#sequence}`, recorded_at: new Date(recordedAt).toISOString(),
      })));
    }
    return { attempted: events.length, persisted: true };
  }

  async read(query: CanonicalEventQuery = {}): Promise<CanonicalEventRow[]> {
    const market = query.market ? query.market.toUpperCase() : null;
    return [...this.#rows.values()]
      .filter((row) => !query.type || row.eventType === query.type)
      .filter((row) => !market || row.market === market)
      .sort((a, b) => b.occurredAt - a.occurredAt || b.recordedAt - a.recordedAt)
      .slice(0, clampLimit(query.limit));
  }
}

export interface SupabaseRestConfig {
  baseUrl: string;
  serviceRoleKey: string;
  fetch?: typeof fetch;
  appendTimeoutMs?: number;
  readTimeoutMs?: number;
}

export class SupabaseRestCanonicalEventLedger implements CanonicalEventLedger {
  readonly #base: string;
  readonly #headers: Record<string, string>;
  readonly #fetch: typeof fetch;

  constructor(private readonly config: SupabaseRestConfig) {
    if (!config.baseUrl.trim() || !config.serviceRoleKey.trim()) throw new Error('SUPABASE_CONFIG_REQUIRED');
    this.#base = config.baseUrl.replace(/\/+$/, '');
    this.#headers = {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    this.#fetch = config.fetch ?? fetch;
  }

  async append(events: readonly CanonicalEventInput[]): Promise<CanonicalEventAppendResult> {
    if (!events.length) return { attempted: 0, persisted: true };
    const body = JSON.stringify(events.map(toCanonicalEventDbRow));
    const response = await this.#fetch(`${this.#base}/rest/v1/${CANONICAL_EVENT_TABLE}?on_conflict=event_key`, {
      method: 'POST',
      headers: { ...this.#headers, Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body,
      signal: AbortSignal.timeout(this.config.appendTimeoutMs ?? 20_000),
    });
    if (!response.ok) throw new Error(`CANONICAL_EVENT_APPEND_FAILED:${response.status}:${(await response.text()).slice(0, 500)}`);
    return { attempted: events.length, persisted: true };
  }

  async read(query: CanonicalEventQuery = {}): Promise<CanonicalEventRow[]> {
    const url = new URL(`${this.#base}/rest/v1/${CANONICAL_EVENT_TABLE}`);
    url.searchParams.set('select', '*');
    url.searchParams.set('order', 'occurred_at.desc,recorded_at.desc');
    url.searchParams.set('limit', String(clampLimit(query.limit)));
    if (query.type) url.searchParams.set('event_type', `eq.${query.type}`);
    if (query.market) url.searchParams.set('market', `eq.${query.market.toUpperCase()}`);
    const response = await this.#fetch(url, {
      headers: this.#headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(this.config.readTimeoutMs ?? 15_000),
    });
    if (!response.ok) throw new Error(`CANONICAL_EVENT_READ_FAILED:${response.status}:${(await response.text()).slice(0, 500)}`);
    const rows = (await response.json()) as unknown;
    if (!Array.isArray(rows)) throw new Error('CANONICAL_EVENT_READ_NOT_ARRAY');
    return rows.map((row) => fromCanonicalEventDbRow(isObject(row) ? row : {}));
  }
}
