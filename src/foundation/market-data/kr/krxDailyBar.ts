// KRX official end-of-day bars (North Star M2/M3 price input, inventory #14).
//
// Ported from BOT server/trading/equity/krxOfficialEodMarketData.ts: same
// KRX data-portal endpoint (MDCSTAT01501, all listed stocks for one trading
// date) and the same field names, narrowed to OHLCV bars for the requested
// symbols. Sector lookups and synthetic index observations are not ported.
//
// Point in time: a bar carries the trading-day close (15:30 KST), the time it
// is conservatively available from KRX (18:00 KST, `availableAt`) and when
// this process actually retrieved it (`retrievedAt`). Point-in-time reads use
// `availableAt` so a history backfilled later still replays as it would have
// been knowable then; `retrievedAt` stays for audit.

export const KRX_EOD_SOURCE_ID = 'KRX:MDCSTAT01501' as const;
const KRX_JSON_URL = 'http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd';
const KRX_REFERER = 'http://data.krx.co.kr/contents/MDC/STAT/standard/MDCSTAT01501';
const KST_OFFSET_MS = 9 * 60 * 60_000;
const TRADING_DATE = /^(\d{4})(\d{2})(\d{2})$/;

export interface KrxDailyBar {
  /** BOR canonical asset id, e.g. KRX:000660. */
  assetId: string;
  symbol: string;
  name: string;
  /** KST trading date, YYYY-MM-DD. */
  tradingDate: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
  turnoverKrw: number | null;
  marketCapKrw: number | null;
  listedShares: number | null;
  /** Daily change as a fraction (FLUC_RT / 100). */
  changeRate: number | null;
  /** 15:30 KST on the trading date, ISO UTC. */
  closeAt: string;
  /** Earliest time the bar is treated as known, ISO UTC. */
  availableAt: string;
  /** When this process fetched it, ISO UTC; never earlier than availableAt for live fetches. */
  retrievedAt: string;
  sourceId: string;
}

function asNumber(value: unknown): number | null {
  const text = String(value ?? '').replace(/,/g, '').trim();
  if (!text || text === '-') return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTradingDate(tradingDate: string): [number, number, number] {
  const match = TRADING_DATE.exec(tradingDate);
  if (!match) throw new Error('INVALID_TRADING_DATE');
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) throw new Error('INVALID_TRADING_DATE');
  return [year, month, day];
}

function kstInstant(tradingDate: string, hour: number, minute: number): string {
  const [year, month, day] = parseTradingDate(tradingDate);
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - KST_OFFSET_MS).toISOString();
}

/** KST calendar date (YYYYMMDD) of an instant. */
export function kstTradingDate(at: Date): string {
  const kst = new Date(at.getTime() + KST_OFFSET_MS);
  return `${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, '0')}${String(kst.getUTCDate()).padStart(2, '0')}`;
}

export const krxCloseAt = (tradingDate: string): string => kstInstant(tradingDate, 15, 30);
export const krxEodAvailableAt = (tradingDate: string): string => kstInstant(tradingDate, 18, 0);

/** The row list, or an error: a reply without one is not a holiday. */
function rowsOf(payload: unknown): readonly unknown[] {
  if (payload !== null && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['output', 'OutBlock_1', 'block1']) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
  }
  throw new Error('KRX_EOD_UNEXPECTED_PAYLOAD');
}

/**
 * Bars for `symbols` from one MDCSTAT01501 payload. A row without a positive
 * close, or with no trading (halted: zero volume or zero open/high/low), is
 * dropped rather than filled in.
 */
export function parseKrxAllStocksPayload(
  payload: unknown,
  tradingDate: string,
  symbols: ReadonlyMap<string, string>,
  retrievedAt: Date,
): KrxDailyBar[] {
  const closeAt = krxCloseAt(tradingDate);
  const availableAt = krxEodAvailableAt(tradingDate);
  const [year, month, day] = parseTradingDate(tradingDate);
  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const bars: KrxDailyBar[] = [];
  for (const raw of rowsOf(payload)) {
    if (raw === null || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const symbol = String(row.ISU_SRT_CD ?? '').trim();
    const assetId = symbols.get(symbol);
    if (!assetId) continue;
    const close = asNumber(row.TDD_CLSPRC);
    if (close === null || close <= 0) continue;
    const [open, high, low, volume] = [asNumber(row.TDD_OPNPRC), asNumber(row.TDD_HGPRC), asNumber(row.TDD_LWPRC), asNumber(row.ACC_TRDVOL)];
    if (volume === 0 || open === 0 || high === 0 || low === 0) continue;
    const changeRate = asNumber(row.FLUC_RT);
    bars.push({
      assetId,
      symbol,
      name: String(row.ISU_ABBRV ?? row.ISU_NM ?? symbol).trim(),
      tradingDate: isoDate,
      open,
      high,
      low,
      close,
      volume,
      turnoverKrw: asNumber(row.ACC_TRDVAL),
      marketCapKrw: asNumber(row.MKTCAP),
      listedShares: asNumber(row.LIST_SHRS),
      changeRate: changeRate === null ? null : changeRate / 100,
      closeAt,
      availableAt,
      retrievedAt: retrievedAt.toISOString(),
      sourceId: `${KRX_EOD_SOURCE_ID}:${tradingDate}`,
    });
  }
  return bars;
}

export interface KrxEodClientConfig {
  fetch?: typeof fetch;
  timeoutMs?: number;
  clock?: () => Date;
}

export class KrxOfficialEodClient {
  readonly #fetch: typeof fetch;
  readonly #clock: () => Date;

  constructor(private readonly config: KrxEodClientConfig = {}) {
    this.#fetch = config.fetch ?? fetch;
    this.#clock = config.clock ?? (() => new Date());
  }

  /**
   * Bars for one KST trading date (YYYYMMDD). A date whose bar is not yet
   * available (before 18:00 KST) is refused rather than fetched as a partial
   * session; a holiday returns no bars.
   */
  async fetchDailyBars(tradingDate: string, symbols: ReadonlyMap<string, string>): Promise<KrxDailyBar[]> {
    const now = this.#clock();
    if (now.getTime() < Date.parse(krxEodAvailableAt(tradingDate))) throw new Error('KRX_EOD_NOT_YET_AVAILABLE');
    const response = await this.#fetch(KRX_JSON_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Referer: KRX_REFERER,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: new URLSearchParams({
        bld: 'dbms/MDC/STAT/standard/MDCSTAT01501',
        locale: 'ko_KR',
        csvxls_isNo: 'false',
        mktId: 'ALL',
        trdDd: tradingDate,
        share: '1',
        money: '1',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 30_000),
    });
    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 180);
      throw new Error(`KRX_EOD_HTTP_${response.status}${detail ? `:${detail}` : ''}`);
    }
    const payload = (await response.json().catch(() => null)) as unknown;
    if (payload === null || typeof payload !== 'object') throw new Error('KRX_EOD_NOT_JSON');
    return parseKrxAllStocksPayload(payload, tradingDate, symbols, now);
  }
}

/** Bars knowable at `cutoff`, oldest first; one bar per asset and trading date. */
export function selectDailyBarsAsOf(bars: readonly KrxDailyBar[], assetId: string, cutoff: string): KrxDailyBar[] {
  const cutoffMs = Date.parse(cutoff);
  if (!Number.isFinite(cutoffMs)) throw new Error('INVALID_CUTOFF');
  const byDate = new Map<string, KrxDailyBar>();
  for (const bar of bars) {
    if (bar.assetId !== assetId || Date.parse(bar.availableAt) > cutoffMs) continue;
    const existing = byDate.get(bar.tradingDate);
    // Two retrievals of the same session must agree; a silent pick would hide a revision.
    if (existing && (existing.close !== bar.close || existing.volume !== bar.volume)) throw new Error(`CONFLICTING_DAILY_BAR:${assetId}:${bar.tradingDate}`);
    if (!existing) byDate.set(bar.tradingDate, bar);
  }
  return [...byDate.values()].sort((a, b) => (a.tradingDate < b.tradingDate ? -1 : a.tradingDate > b.tradingDate ? 1 : 0));
}
