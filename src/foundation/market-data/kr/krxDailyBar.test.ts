import assert from 'node:assert/strict';
import test from 'node:test';
import {
  KrxOfficialEodClient,
  kstTradingDate,
  krxCloseAt,
  krxEodAvailableAt,
  parseKrxAllStocksPayload,
  selectDailyBarsAsOf,
  type KrxDailyBar,
} from './krxDailyBar.js';

const SKELETON = new Map([['000660', 'KRX:000660']]);
const RETRIEVED = new Date('2026-10-02T10:00:00Z');

// Field names as in the MDCSTAT01501 response the BOT adapter consumes.
function payload(close = '318,500') {
  return {
    OutBlock_1: [
      { ISU_SRT_CD: '005930', ISU_ABBRV: '삼성전자', TDD_CLSPRC: '86,000' },
      {
        ISU_SRT_CD: '000660', ISU_ABBRV: 'SK하이닉스', MKT_NM: 'KOSPI',
        TDD_CLSPRC: close, TDD_OPNPRC: '312,000', TDD_HGPRC: '320,500', TDD_LWPRC: '311,000',
        FLUC_RT: '2.41', ACC_TRDVOL: '3,512,880', ACC_TRDVAL: '1,112,345,678,000',
        MKTCAP: '231,868,000,000,000', LIST_SHRS: '728,002,365',
      },
    ],
  };
}

test('KRX close and availability are fixed KST instants', () => {
  assert.equal(krxCloseAt('20261002'), '2026-10-02T06:30:00.000Z');
  assert.equal(krxEodAvailableAt('20261002'), '2026-10-02T09:00:00.000Z');
  assert.equal(kstTradingDate(new Date('2026-10-02T15:30:00Z')), '20261003');
  assert.throws(() => krxCloseAt('20260231'), /INVALID_TRADING_DATE/);
  assert.throws(() => krxCloseAt('2026-10-02'), /INVALID_TRADING_DATE/);
});

test('parses only the requested symbols with numbers un-comma-ed', () => {
  const [bar, ...rest] = parseKrxAllStocksPayload(payload(), '20261002', SKELETON, RETRIEVED);
  assert.equal(rest.length, 0);
  assert.deepEqual(bar, {
    assetId: 'KRX:000660', symbol: '000660', name: 'SK하이닉스', tradingDate: '2026-10-02',
    open: 312000, high: 320500, low: 311000, close: 318500, volume: 3512880,
    turnoverKrw: 1112345678000, marketCapKrw: 231868000000000, listedShares: 728002365,
    changeRate: 0.0241,
    closeAt: '2026-10-02T06:30:00.000Z', availableAt: '2026-10-02T09:00:00.000Z',
    retrievedAt: '2026-10-02T10:00:00.000Z', sourceId: 'KRX:MDCSTAT01501:20261002',
  });
});

test('a missing or non-positive close is dropped, never filled in', () => {
  assert.deepEqual(parseKrxAllStocksPayload(payload('-'), '20261002', SKELETON, RETRIEVED), []);
  assert.deepEqual(parseKrxAllStocksPayload(payload('0'), '20261002', SKELETON, RETRIEVED), []);
  assert.deepEqual(parseKrxAllStocksPayload({ output: [] }, '20261003', SKELETON, RETRIEVED), []);
});

test('a halted session is dropped, not turned into a zero-range bar', () => {
  const halted = payload();
  Object.assign(halted.OutBlock_1[1]!, { TDD_OPNPRC: '0', TDD_HGPRC: '0', TDD_LWPRC: '0', ACC_TRDVOL: '0' });
  assert.deepEqual(parseKrxAllStocksPayload(halted, '20261002', SKELETON, RETRIEVED), []);
});

test('a reply without a row list is an error, not a holiday', async () => {
  assert.throws(() => parseKrxAllStocksPayload('not json', '20261002', SKELETON, RETRIEVED), /KRX_EOD_UNEXPECTED_PAYLOAD/);
  assert.throws(() => parseKrxAllStocksPayload({ error: 'session expired' }, '20261002', SKELETON, RETRIEVED), /KRX_EOD_UNEXPECTED_PAYLOAD/);
  const client = new KrxOfficialEodClient({ clock: () => RETRIEVED, fetch: (async () => new Response('{"RESULT":"LOGOUT"}', { status: 200 })) as typeof fetch });
  await assert.rejects(client.fetchDailyBars('20261002', SKELETON), /KRX_EOD_UNEXPECTED_PAYLOAD/);
});

test('client posts the BOT request form and refuses an unsettled session', async () => {
  let body = '';
  const fakeFetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    body = String(init?.body);
    return new Response(JSON.stringify(payload()), { status: 200 });
  }) as typeof fetch;
  const early = new KrxOfficialEodClient({ fetch: fakeFetch, clock: () => new Date('2026-10-02T08:59:59Z') });
  await assert.rejects(early.fetchDailyBars('20261002', SKELETON), /KRX_EOD_NOT_YET_AVAILABLE/);
  assert.equal(body, '');

  const client = new KrxOfficialEodClient({ fetch: fakeFetch, clock: () => RETRIEVED });
  const bars = await client.fetchDailyBars('20261002', SKELETON);
  const form = new URLSearchParams(body);
  assert.equal(form.get('bld'), 'dbms/MDC/STAT/standard/MDCSTAT01501');
  assert.equal(form.get('trdDd'), '20261002');
  assert.equal(form.get('mktId'), 'ALL');
  assert.equal(bars[0]?.close, 318500);
});

test('client surfaces HTTP and payload failures', async () => {
  const clock = () => RETRIEVED;
  const failing = new KrxOfficialEodClient({ clock, fetch: (async () => new Response('LOGOUT', { status: 400 })) as typeof fetch });
  await assert.rejects(failing.fetchDailyBars('20261002', SKELETON), /KRX_EOD_HTTP_400:LOGOUT/);
  const html = new KrxOfficialEodClient({ clock, fetch: (async () => new Response('<html>', { status: 200 })) as typeof fetch });
  await assert.rejects(html.fetchDailyBars('20261002', SKELETON), /KRX_EOD_NOT_JSON/);
});

test('point-in-time selection uses availability, not retrieval time', () => {
  const d1 = parseKrxAllStocksPayload(payload('300,000'), '20261001', SKELETON, new Date('2026-10-05T00:00:00Z'));
  const d2 = parseKrxAllStocksPayload(payload(), '20261002', SKELETON, RETRIEVED);
  const bars: KrxDailyBar[] = [...d2, ...d1];
  // A history backfilled on 10/05 still replays as knowable on 10/01 evening.
  assert.deepEqual(selectDailyBarsAsOf(bars, 'KRX:000660', '2026-10-01T09:00:00Z').map((b) => b.close), [300000]);
  // The 10/02 bar is not known during the 10/02 session.
  assert.deepEqual(selectDailyBarsAsOf(bars, 'KRX:000660', '2026-10-02T06:30:00Z').map((b) => b.close), [300000]);
  assert.deepEqual(selectDailyBarsAsOf(bars, 'KRX:000660', '2026-10-02T09:00:00Z').map((b) => b.tradingDate), ['2026-10-01', '2026-10-02']);
  assert.deepEqual(selectDailyBarsAsOf(bars, 'KRX:005930', '2026-10-03T00:00:00Z'), []);
});

test('two retrievals of one session must agree', () => {
  const a = parseKrxAllStocksPayload(payload(), '20261002', SKELETON, RETRIEVED);
  const same = parseKrxAllStocksPayload(payload(), '20261002', SKELETON, new Date('2026-10-03T00:00:00Z'));
  assert.equal(selectDailyBarsAsOf([...a, ...same], 'KRX:000660', '2026-10-03T00:00:00Z').length, 1);
  const revised = parseKrxAllStocksPayload(payload('319,000'), '20261002', SKELETON, RETRIEVED);
  assert.throws(() => selectDailyBarsAsOf([...a, ...revised], 'KRX:000660', '2026-10-03T00:00:00Z'), /CONFLICTING_DAILY_BAR/);
});
