export const BOR_PRODUCT = 'BLACK_ORACLE_REPORT' as const;
export const BOR_RUNTIME_VERSION = 'BOR-ALPHA-v0.1' as const;

const FORBIDDEN_ENV_PATTERNS = [
  /UPBIT.*(KEY|SECRET)/i,
  /BROKER.*(KEY|SECRET|TOKEN)/i,
  /TRADING.*(KEY|SECRET|TOKEN)/i,
  /BINANCE.*(KEY|SECRET)/i,
  /BYBIT.*(KEY|SECRET)/i,
] as const;

export interface BorRuntimeStatus {
  product: typeof BOR_PRODUCT;
  version: typeof BOR_RUNTIME_VERSION;
  status: 'READY' | 'BLOCKED';
  tradingAuthority: false;
  botDependency: false;
  checkedAt: string;
  blockers: string[];
}

export function findForbiddenTradingEnvironment(env: NodeJS.ProcessEnv): string[] {
  return Object.keys(env)
    .filter((name) => FORBIDDEN_ENV_PATTERNS.some((pattern) => pattern.test(name)))
    .sort();
}

export function getBorRuntimeStatus(
  env: NodeJS.ProcessEnv = process.env,
  now: Date = new Date(),
): BorRuntimeStatus {
  const invalidClock = Number.isNaN(now.getTime());
  const forbiddenNames = findForbiddenTradingEnvironment(env);
  const blockers = [
    ...(invalidClock ? ['INVALID_RUNTIME_CLOCK'] : []),
    ...forbiddenNames.map((name) => `FORBIDDEN_TRADING_ENV:${name}`),
  ];

  return {
    product: BOR_PRODUCT,
    version: BOR_RUNTIME_VERSION,
    status: blockers.length === 0 ? 'READY' : 'BLOCKED',
    tradingAuthority: false,
    botDependency: false,
    checkedAt: invalidClock ? 'INVALID' : now.toISOString(),
    blockers,
  };
}
