import assert from 'node:assert/strict';
import test from 'node:test';
import type { CanonicalEventInput } from './canonicalEvent.js';
import {
  InMemoryCanonicalEventLedger,
  SupabaseRestCanonicalEventLedger,
  fromCanonicalEventDbRow,
  toCanonicalEventDbRow,
} from './canonicalEventLedger.js';

function event(overrides: Partial<CanonicalEventInput> = {}): CanonicalEventInput {
  return {
    eventKey: 'paper:cycle:1:system',
    occurredAt: '2026-10-01T03:00:00Z',
    runtimeId: 'black-oracle-paper',
    eventType: 'SYSTEM',
    eventName: 'PAPER_CYCLE_COMPLETED',
    market: 'KRW-BTC',
    summary: 'Paper cycle completed.',
    source: 'paper_runtime',
    ...overrides,
  };
}

test('maps an input to a database row and back', () => {
  const row = toCanonicalEventDbRow(event({ trace: { scanned: 3 } }));
  assert.equal(row.occurred_at, '2026-10-01T03:00:00.000Z');
  assert.equal(row.severity, 'INFO');
  assert.equal(row.authority, 'observed');
  assert.equal(row.execution_authority, false);
  const back = fromCanonicalEventDbRow({ ...row, id: 'x', recorded_at: '2026-10-01T03:00:01Z' });
  assert.equal(back.occurredAt, Date.parse('2026-10-01T03:00:00Z'));
  assert.deepEqual(back.trace, { scanned: 3 });
  assert.equal(back.market, 'KRW-BTC');
});

test('rejects an unparseable occurredAt instead of recording it as now', () => {
  assert.throws(() => toCanonicalEventDbRow(event({ occurredAt: 'not-a-date' })), /INVALID_OCCURRED_AT/);
  assert.throws(() => toCanonicalEventDbRow(event({ eventKey: ' ' })), /EMPTY_EVENT_KEY/);
});

test('clips oversized text fields like the database adapter did', () => {
  const row = toCanonicalEventDbRow(event({ summary: 'x'.repeat(5_000), eventName: 'y'.repeat(500) }));
  assert.equal(row.summary.length, 2_000);
  assert.equal(row.event_name.length, 120);
});

test('in-memory ledger ignores a re-appended event key and never updates it', async () => {
  const ledger = new InMemoryCanonicalEventLedger(() => Date.parse('2026-10-01T03:00:05Z'));
  await ledger.append([event()]);
  await ledger.append([event({ summary: 'rewritten' })]);
  const rows = await ledger.read();
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.summary, 'Paper cycle completed.');
});

test('in-memory ledger filters by type and market and orders newest first', async () => {
  const ledger = new InMemoryCanonicalEventLedger(() => 0);
  await ledger.append([
    event(),
    event({ eventKey: 'k2', occurredAt: '2026-10-01T04:00:00Z', eventType: 'DECISION', market: 'KRW-ETH' }),
    event({ eventKey: 'k3', occurredAt: '2026-10-01T05:00:00Z', eventType: 'DECISION', market: 'KRW-BTC' }),
  ]);
  assert.deepEqual((await ledger.read()).map((r) => r.eventKey), ['k3', 'k2', 'paper:cycle:1:system']);
  assert.deepEqual((await ledger.read({ type: 'DECISION', market: 'krw-btc' })).map((r) => r.eventKey), ['k3']);
  assert.equal((await ledger.read({ limit: 1 })).length, 1);
});

test('REST adapter posts ignore-duplicate inserts and reads with the expected query', async () => {
  const calls: { url: string; init: RequestInit | undefined }[] = [];
  const fakeFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    if (init?.method === 'POST') return new Response(null, { status: 201 });
    return new Response(JSON.stringify([{ id: '1', event_key: 'k', occurred_at: '2026-10-01T03:00:00Z', event_type: 'DECISION', trace: [] }]), { status: 200 });
  }) as typeof fetch;
  const ledger = new SupabaseRestCanonicalEventLedger({ baseUrl: 'https://db.example.test/', serviceRoleKey: 'service-key', fetch: fakeFetch });

  assert.deepEqual(await ledger.append([event()]), { attempted: 1, persisted: true });
  assert.equal(calls[0]?.url, 'https://db.example.test/rest/v1/black_oracle_events?on_conflict=event_key');
  const headers = calls[0]?.init?.headers as Record<string, string>;
  assert.equal(headers.Prefer, 'resolution=ignore-duplicates,return=minimal');
  assert.equal(headers.Authorization, 'Bearer service-key');

  const rows = await ledger.read({ type: 'DECISION', market: 'krw-btc', limit: 9_999 });
  const url = new URL(calls[1]!.url);
  assert.equal(url.searchParams.get('event_type'), 'eq.DECISION');
  assert.equal(url.searchParams.get('market'), 'eq.KRW-BTC');
  assert.equal(url.searchParams.get('limit'), '500');
  assert.equal(rows[0]?.eventType, 'DECISION');
  assert.deepEqual(rows[0]?.trace, {});
});

test('REST adapter surfaces failures and refuses missing configuration', async () => {
  const failing = (async () => new Response('boom', { status: 503 })) as typeof fetch;
  const ledger = new SupabaseRestCanonicalEventLedger({ baseUrl: 'https://db.example.test', serviceRoleKey: 'k', fetch: failing });
  await assert.rejects(ledger.append([event()]), /CANONICAL_EVENT_APPEND_FAILED:503/);
  await assert.rejects(ledger.read(), /CANONICAL_EVENT_READ_FAILED:503/);
  assert.throws(() => new SupabaseRestCanonicalEventLedger({ baseUrl: '', serviceRoleKey: 'k' }), /SUPABASE_CONFIG_REQUIRED/);
});
