import assert from 'node:assert/strict';
import test from 'node:test';
import { SupabaseNarsOutboxReader } from './narsOutboxReader.js';

const ID_A = '11111111-1111-4111-8111-111111111111';

function reader(respond: (url: URL) => Response, seen: URL[] = []) {
  const fakeFetch = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    seen.push(url);
    return respond(url);
  }) as typeof fetch;
  return new SupabaseNarsOutboxReader({ baseUrl: 'https://db.example.test', serviceRoleKey: 'k', fetch: fakeFetch });
}

test('reads black_oracle rows oldest first and returns a (created_at, id) cursor', async () => {
  const seen: URL[] = [];
  const r = reader(() => new Response(JSON.stringify([{ id: ID_A, created_at: '2026-10-01T00:00:00+00:00', payload: { producer: 'NARS' } }])), seen);
  const page = await r.readPage({ limit: 50 });
  const url = seen[0]!;
  assert.equal(url.pathname, '/rest/v1/nars_intel_outbox');
  assert.equal(url.searchParams.get('destination'), 'eq.black_oracle');
  assert.equal(url.searchParams.get('order'), 'created_at.asc,id.asc');
  assert.equal(url.searchParams.get('limit'), '50');
  assert.equal(url.searchParams.get('or'), null);
  assert.deepEqual(page.nextCursor, { createdAt: '2026-10-01T00:00:00+00:00', id: ID_A });
});

test('continues after a cursor without skipping rows that share its timestamp', async () => {
  const seen: URL[] = [];
  const r = reader(() => new Response('[]'), seen);
  const page = await r.readPage({ after: { createdAt: '2026-10-01T00:00:00Z', id: ID_A } });
  assert.equal(seen[0]!.searchParams.get('or'), `(created_at.gt.2026-10-01T00:00:00Z,and(created_at.eq.2026-10-01T00:00:00Z,id.gt.${ID_A}))`);
  assert.equal(page.nextCursor, null);
});

test('rejects malformed cursors and surfaces read failures', async () => {
  const r = reader(() => new Response('down', { status: 503 }));
  await assert.rejects(r.readPage({ after: { createdAt: 'x', id: ID_A } }), /INVALID_CURSOR/);
  await assert.rejects(r.readPage({ after: { createdAt: '2026-10-01T00:00:00Z', id: 'not-a-uuid),or(x' } }), /INVALID_CURSOR/);
  await assert.rejects(r.readPage(), /NARS_OUTBOX_READ_FAILED:503/);
});
